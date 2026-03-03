"""GitHub routes for fetching public commit and issue data from GitHub."""
from flask import Blueprint, jsonify, request
import requests
from models import db, Project, Task, ActivityLog
from routes.auth import token_required

github_bp = Blueprint('github', __name__)

@github_bp.route('/commits/<path:repo_path>', methods=['GET'])
@token_required
def get_commits(current_user, repo_path):
    """Fetch public commits from a specified GitHub repository."""
    _ = current_user
    
    # Clean the repo string in case user pasted a full URL or .git
    clean_repo = repo_path.replace('https://github.com/', '').replace('http://github.com/', '')
    if clean_repo.endswith('.git'):
        clean_repo = clean_repo[:-4]
        
    url = f"https://api.github.com/repos/{clean_repo}/commits"
    response = requests.get(url, timeout=10)
    if response.status_code == 200:
        commits = response.json()
        result = []
        if isinstance(commits, list):
            for c in commits[:10]: # Return top 10
                if isinstance(c, dict) and 'commit' in c:
                    result.append({
                        'sha': c.get('sha', ''),
                        'message': c['commit'].get('message', ''),
                        'author': c['commit'].get('author', {}).get('name', ''),
                        'date': c['commit'].get('author', {}).get('date', '')
                    })
        return jsonify(result)
    return jsonify({'message': 'Failed to fetch commits from GitHub API'}), response.status_code

@github_bp.route('/issues/<path:repo_path>', methods=['GET'])
@token_required
def get_issues(current_user, repo_path):
    """Fetch open issues and pull requests from a specified GitHub repository."""
    _ = current_user
    
    # Clean the repo string in case user pasted a full URL or .git
    clean_repo = repo_path.replace('https://github.com/', '').replace('http://github.com/', '')
    if clean_repo.endswith('.git'):
        clean_repo = clean_repo[:-4]
        
    url = f"https://api.github.com/repos/{clean_repo}/issues?state=open"
    # GitHub API returns both issues and PRs in the issues endpoint. PRs have a pull_request key.
    response = requests.get(url, timeout=10)
    if response.status_code == 200:
        all_issues = response.json()
        
        issues = []
        prs = []

        if isinstance(all_issues, list):
            for item in all_issues[:20]: # Parse top 20
                if isinstance(item, dict):
                    record = {
                        'id': item.get('id'),
                        'number': item.get('number'),
                        'title': item.get('title'),
                        'user': item.get('user', {}).get('login') if isinstance(item.get('user'), dict) else None,
                        'url': item.get('html_url'),
                        'created_at': item.get('created_at')
                    }
                    if 'pull_request' in item:
                        prs.append(record)
                    else:
                        issues.append(record)

            return jsonify({
                'issues': issues[:5], 
                'pull_requests': prs[:5]
            })
        return jsonify({'issues': [], 'pull_requests': []})
    return jsonify({'message': 'Failed to fetch issues/PRs from GitHub API'}), response.status_code

@github_bp.route('/import_issues/<int:project_id>', methods=['POST'])
@token_required
def import_issues(current_user, project_id):
    """Fetch open issues from GitHub and convert them to project Tasks."""
    project = Project.query.get_or_404(project_id)
    if not project.github_repo:
        return jsonify({'message': 'No GitHub repository linked to this project'}), 400
        
    clean_repo = project.github_repo.replace('https://github.com/', '').replace('http://github.com/', '')
    if clean_repo.endswith('.git'):
        clean_repo = clean_repo[:-4]
        
    url = f"https://api.github.com/repos/{clean_repo}/issues?state=open"
    response = requests.get(url, timeout=10)
    
    if response.status_code != 200:
        return jsonify({'message': 'Failed to fetch issues from GitHub'}), response.status_code
        
    all_issues = response.json()
    imported_count = 0
    
    if isinstance(all_issues, list):
        # Fetch existing tasks to avoid duplicates and to update their status
        existing_tasks_by_issue_id = {t.github_issue_id: t for t in Task.query.filter(Task.project_id == project_id, Task.github_issue_id.isnot(None)).all()}
        
        updated_count = 0

        for item in all_issues:
            # We don't want to import PRs as tasks
            if isinstance(item, dict) and 'pull_request' not in item:
                issue_id = item.get('id')
                state = item.get('state')
                
                if issue_id not in existing_tasks_by_issue_id:
                    # Create new task
                    new_task = Task(
                        title=item.get('title'),
                        description=f"{item.get('body') or ''}\n\n*Imported from GitHub Issue #{item.get('number')}*",
                        status='todo' if state == 'open' else 'done',
                        priority='medium',
                        project_id=project_id,
                        github_issue_id=issue_id
                    )
                    db.session.add(new_task)
                    imported_count += 1
                else:
                    # Update status of existing task if it was closed on GitHub
                    task = existing_tasks_by_issue_id[issue_id]
                    if state == 'closed' and task.status != 'done':
                        task.status = 'done'
                        updated_count += 1
                        
        if imported_count > 0 or updated_count > 0:
            log = ActivityLog(
                project_id=project_id,
                user_id=current_user.id,
                action_type='github_sync',
                description=f"Imported {imported_count} new issues and synced {updated_count} existing issues from GitHub"
            )
            db.session.add(log)
            db.session.commit()
            
    return jsonify({
        'message': f'Successfully imported {imported_count} new issues and synced {updated_count} issues',
        'count': imported_count,
        'updated': updated_count
    })
