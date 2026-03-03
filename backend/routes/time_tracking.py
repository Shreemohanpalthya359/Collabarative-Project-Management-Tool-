"""Time tracking routes — log, list, and delete time entries."""
from flask import Blueprint, jsonify, request
from models import db, Task, TimeLog, User
from routes.auth import token_required

time_tracking_bp = Blueprint('time_tracking', __name__)

@time_tracking_bp.route('/task/<int:task_id>', methods=['GET'])
@token_required
def get_logs(current_user, task_id):
    _ = current_user
    Task.query.get_or_404(task_id)
    logs = TimeLog.query.filter_by(task_id=task_id).order_by(TimeLog.logged_at.desc()).all()
    total = sum(l.minutes for l in logs)
    return jsonify({
        'total_minutes': total,
        'logs': [{
            'id': l.id,
            'minutes': l.minutes,
            'note': l.note,
            'username': User.query.get(l.user_id).username if l.user_id else '?',
            'logged_at': l.logged_at.isoformat()
        } for l in logs]
    })

@time_tracking_bp.route('/task/<int:task_id>', methods=['POST'])
@token_required
def log_time(current_user, task_id):
    Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    minutes = data.get('minutes')
    if not minutes or int(minutes) <= 0:
        return jsonify({'error': 'minutes must be a positive integer'}), 400
    entry = TimeLog(
        task_id=task_id,
        user_id=current_user.id,
        minutes=int(minutes),
        note=data.get('note', '').strip() or None
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'id': entry.id, 'minutes': entry.minutes, 'note': entry.note}), 201

@time_tracking_bp.route('/<int:log_id>', methods=['DELETE'])
@token_required
def delete_log(current_user, log_id):
    entry = TimeLog.query.get_or_404(log_id)
    if entry.user_id != current_user.id:
        return jsonify({'error': 'Can only delete your own logs'}), 403
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Log deleted'})
