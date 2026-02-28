"""Project routes for creating and listing user projects."""
from flask import Blueprint, request, jsonify
from models import db, Project, ProjectMember
from routes.auth import token_required

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['GET'])
@token_required
def get_projects(current_user):
    """Get all projects the current user owns or is a member of."""
    memberships = ProjectMember.query.filter_by(user_id=current_user.id).all()
    owned_projects = Project.query.filter_by(owner_id=current_user.id).all()

    all_projects = list(set(owned_projects + [m.project for m in memberships]))

    result = []
    for p in all_projects:
        result.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'github_repo': p.github_repo,
            'owner_id': p.owner_id
        })
    return jsonify(result)

@projects_bp.route('', methods=['POST'])
@token_required
def create_project(current_user):
    """Create a new project workspace and assign the current user as an admin."""
    data = request.get_json()
    new_project = Project(
        name=data['name'], 
        description=data.get('description', ''),
        github_repo=data.get('github_repo', ''),
        owner_id=current_user.id
    )
    db.session.add(new_project)
    db.session.commit()

    member = ProjectMember(project_id=new_project.id, user_id=current_user.id, role='admin')
    db.session.add(member)
    db.session.commit()

    return jsonify({'message': 'Project created!', 'id': new_project.id})
