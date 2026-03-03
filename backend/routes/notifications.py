"""Notification routes for in-app notification system."""
from flask import Blueprint, jsonify
from models import db, Notification
from routes.auth import token_required

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@token_required
def get_notifications(current_user):
    """Get all notifications for the current user (latest 30)."""
    notifs = Notification.query.filter_by(user_id=current_user.id)\
        .order_by(Notification.created_at.desc()).limit(30).all()
    return jsonify([{
        'id': n.id,
        'message': n.message,
        'link': n.link,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
        'project_id': n.project_id
    } for n in notifs])

@notifications_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """Get count of unread notifications."""
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({'count': count})

@notifications_bp.route('/mark-read', methods=['POST'])
@token_required
def mark_all_read(current_user):
    """Mark all notifications as read for the current user."""
    Notification.query.filter_by(user_id=current_user.id, is_read=False)\
        .update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})

@notifications_bp.route('/<int:notif_id>/read', methods=['POST'])
@token_required
def mark_one_read(current_user, notif_id):
    """Mark a single notification as read."""
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'})
