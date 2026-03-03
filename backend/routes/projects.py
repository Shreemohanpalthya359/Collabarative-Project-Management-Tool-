"""Project routes for creating and listing user projects."""
from flask import Blueprint, request, jsonify
from models import db, Project, ProjectMember, User, ActivityLog, Label
from routes.auth import token_required

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['GET'])
@token_required
def get_projects(current_user):
    """Get all projects the current user owns or is a member of (single query)."""
    member_project_ids = db.session.query(ProjectMember.project_id).filter_by(
        user_id=current_user.id
    ).subquery()

    projects = Project.query.filter(
        db.or_(
            Project.owner_id == current_user.id,
            Project.id.in_(member_project_ids)
        ),
        Project.deleted_at.is_(None)   # exclude soft-deleted
    ).all()

    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'github_repo': p.github_repo,
        'owner_id': p.owner_id,
        'created_at': p.created_at.isoformat() if p.created_at else None
    } for p in projects])

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

@projects_bp.route('/<int:project_id>/members', methods=['GET'])
@token_required
def get_project_members(current_user, project_id):
    """Get all members for a specific project."""
    _ = current_user
    memberships = ProjectMember.query.filter_by(project_id=project_id).all()
    result = []
    for m in memberships:
        result.append({
            'id': m.id,
            'role': m.role,
            'user': {
                'id': m.user.id,
                'username': m.user.username
            }
        })
    # Also include the owner if not explicitly in ProjectMember (though they should be)
    return jsonify(result)

@projects_bp.route('/<int:project_id>/members', methods=['POST'])
@token_required
def add_project_member(current_user, project_id):
    """Add a user to a project by username."""
    project = Project.query.get_or_404(project_id)
    
    # Check permissions (only owner or admin should add)
    membership = ProjectMember.query.filter_by(project_id=project_id, user_id=current_user.id).first()
    if project.owner_id != current_user.id and (not membership or membership.role not in ['admin', 'owner']):
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    username = data.get('username')
    role = data.get('role', 'member')
    
    user_to_add = User.query.filter_by(username=username).first()
    if not user_to_add:
        return jsonify({'message': 'User not found'}), 404
        
    # Check if already a member
    existing = ProjectMember.query.filter_by(project_id=project_id, user_id=user_to_add.id).first()
    if existing:
        return jsonify({'message': 'User is already a member'}), 400
        
    new_member = ProjectMember(project_id=project_id, user_id=user_to_add.id, role=role)
    db.session.add(new_member)
    
    # Audit log
    log = ActivityLog(
        project_id=project_id,
        user_id=current_user.id,
        action_type='member_added',
        description=f"Added {user_to_add.username} to the project as {role}"
    )
    db.session.add(log)
    
    db.session.commit()
    return jsonify({'message': 'Member added successfully', 'user': {'id': user_to_add.id, 'username': user_to_add.username}, 'role': role})

@projects_bp.route('/<int:project_id>/labels', methods=['GET'])
@token_required
def get_project_labels(current_user, project_id):
    """Get all labels for a specific project."""
    _ = current_user
    labels = Label.query.filter_by(project_id=project_id).all()
    result = [{'id': l.id, 'name': l.name, 'color': l.color} for l in labels]
    return jsonify(result)

@projects_bp.route('/<int:project_id>/labels', methods=['POST'])
@token_required
def create_project_label(current_user, project_id):
    """Create a new label for a project."""
    _ = current_user
    data = request.get_json()
    new_label = Label(
        project_id=project_id,
        name=data['name'],
        color=data.get('color', '#3b82f6')
    )
    db.session.add(new_label)
    db.session.commit()
    return jsonify({'message': 'Label created!', 'label': {'id': new_label.id, 'name': new_label.name, 'color': new_label.color}})

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@token_required
def delete_project(current_user, project_id):
    """Soft-delete a project (moves it to trash). Only the project owner can do this."""
    from datetime import datetime as dt
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'message': 'Only the project owner can delete this project'}), 403
    project.deleted_at = dt.utcnow()
    db.session.commit()
    return jsonify({'message': 'Project moved to trash'})

@projects_bp.route('/trash', methods=['GET'])
@token_required
def get_trash(current_user):
    """List all soft-deleted projects owned by the current user."""
    projects = Project.query.filter(
        Project.owner_id == current_user.id,
        Project.deleted_at.isnot(None)
    ).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'github_repo': p.github_repo,
        'created_at': p.created_at.isoformat() if p.created_at else None,
        'deleted_at': p.deleted_at.isoformat() if p.deleted_at else None,
    } for p in projects])

@projects_bp.route('/<int:project_id>/restore', methods=['POST'])
@token_required
def restore_project(current_user, project_id):
    """Restore a soft-deleted project from trash."""
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'message': 'Only the project owner can restore this project'}), 403
    project.deleted_at = None
    db.session.commit()
    return jsonify({'message': 'Project restored'})

@projects_bp.route('/<int:project_id>/permanent', methods=['DELETE'])
@token_required
def permanent_delete_project(current_user, project_id):
    """Permanently delete a project from trash."""
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'message': 'Only the project owner can permanently delete this project'}), 403
    if project.deleted_at is None:
        return jsonify({'message': 'Project must be in trash first'}), 400
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project permanently deleted'})

@projects_bp.route('/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
@token_required
def remove_project_member(current_user, project_id, member_id):
    """Remove a member from a project. Owner and admins can do this."""
    project = Project.query.get_or_404(project_id)
    membership = ProjectMember.query.filter_by(project_id=project_id, user_id=current_user.id).first()
    # Only owner or admin can remove members
    if project.owner_id != current_user.id and (not membership or membership.role not in ['admin', 'owner']):
        return jsonify({'message': 'Unauthorized'}), 403
    member = ProjectMember.query.get_or_404(member_id)
    if member.project_id != project_id:
        return jsonify({'message': 'Member not in this project'}), 400
    # Don't let the owner be removed
    if member.user_id == project.owner_id:
        return jsonify({'message': 'Cannot remove the project owner'}), 400
    removed_username = member.user.username
    db.session.delete(member)
    log = ActivityLog(
        project_id=project_id,
        user_id=current_user.id,
        action_type='member_removed',
        description=f"Removed {removed_username} from the project"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': f'{removed_username} removed from project'})
