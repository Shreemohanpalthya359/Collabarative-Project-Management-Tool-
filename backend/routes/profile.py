"""User profile and personal stats routes."""
from flask import Blueprint, request, jsonify
from models import db, User, Task, ActivityLog, ProjectMember
from routes.auth import token_required
from werkzeug.security import generate_password_hash, check_password_hash

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user's profile with summary stats."""
    total_assigned = Task.query.filter_by(assignee_id=current_user.id).count()
    completed = Task.query.filter_by(assignee_id=current_user.id, status='done').count()
    in_progress = Task.query.filter_by(assignee_id=current_user.id, status='in_progress').count()
    projects_count = ProjectMember.query.filter_by(user_id=current_user.id).count()

    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'joined': current_user.created_at.isoformat(),
        'stats': {
            'total_assigned': total_assigned,
            'completed': completed,
            'in_progress': in_progress,
            'projects': projects_count
        }
    })

@profile_bp.route('/tasks', methods=['GET'])
@token_required
def get_my_tasks(current_user):
    """Get all tasks assigned to the current user."""
    tasks = Task.query.filter_by(assignee_id=current_user.id)\
        .order_by(Task.created_at.desc()).limit(50).all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'status': t.status,
        'priority': t.priority,
        'project_id': t.project_id,
        'project_name': t.project.name,
        'due_date': t.due_date.isoformat() if t.due_date else None,
        'estimate': t.estimate
    } for t in tasks])

@profile_bp.route('/activity', methods=['GET'])
@token_required
def get_my_activity(current_user):
    """Get recent activity performed by the current user."""
    logs = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.created_at.desc()).limit(20).all()
    return jsonify([{
        'id': a.id,
        'action_type': a.action_type,
        'description': a.description,
        'created_at': a.created_at.isoformat(),
        'project_id': a.project_id
    } for a in logs])

@profile_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change the current user's password."""
    data = request.get_json()
    if not check_password_hash(current_user.password, data.get('current_password', '')):
        return jsonify({'message': 'Current password is incorrect'}), 400
    if len(data.get('new_password', '')) < 6:
        return jsonify({'message': 'New password must be at least 6 characters'}), 400
    current_user.password = generate_password_hash(data['new_password'])
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'})
