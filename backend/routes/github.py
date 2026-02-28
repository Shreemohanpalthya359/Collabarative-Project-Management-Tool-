"""GitHub routes for fetching public commit and issue data from GitHub."""
from flask import Blueprint, jsonify
import requests
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
