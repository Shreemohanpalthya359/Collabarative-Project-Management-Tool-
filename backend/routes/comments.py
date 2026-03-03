"""Task comments CRUD routes."""
from flask import Blueprint, jsonify, request
from models import db, Task, TaskComment, User, ActivityLog
from routes.auth import token_required

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/task/<int:task_id>', methods=['GET'])
@token_required
def get_comments(current_user, task_id):
    _ = current_user
    task = Task.query.get_or_404(task_id)
    _ = task
    comments = TaskComment.query.filter_by(task_id=task_id).order_by(TaskComment.created_at.asc()).all()
    return jsonify([{
        'id': c.id,
        'content': c.content,
        'user_id': c.user_id,
        'username': User.query.get(c.user_id).username if c.user_id else 'Unknown',
        'created_at': c.created_at.isoformat()
    } for c in comments])

@comments_bp.route('/task/<int:task_id>', methods=['POST'])
@token_required
def add_comment(current_user, task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    content = (data or {}).get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400

    comment = TaskComment(task_id=task_id, user_id=current_user.id, content=content)
    db.session.add(comment)

    # Activity log
    log = ActivityLog(
        project_id=task.project_id,
        user_id=current_user.id,
        action_type='comment_added',
        description=f"{current_user.username} commented on task '{task.title}'"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'id': comment.id,
        'content': comment.content,
        'user_id': comment.user_id,
        'username': current_user.username,
        'created_at': comment.created_at.isoformat()
    }), 201

@comments_bp.route('/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, comment_id):
    comment = TaskComment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        return jsonify({'error': 'You can only delete your own comments'}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'})
