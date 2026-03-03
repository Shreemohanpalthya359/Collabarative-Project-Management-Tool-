"""Analytics and activity logging routes."""
from flask import Blueprint, jsonify, request
from models import db, ActivityLog, Task, Sprint
from routes.auth import token_required
from sqlalchemy import func
from datetime import timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/project/<int:project_id>/activities', methods=['GET'])
@token_required
def get_activities(current_user, project_id):
    """Retrieve recent activity logs for a project."""
    _ = current_user
    activities = ActivityLog.query.filter_by(project_id=project_id).order_by(ActivityLog.created_at.desc()).limit(50).all()
    
    result = []
    for a in activities:
        result.append({
            'id': a.id,
            'action_type': a.action_type,
            'description': a.description,
            'created_at': a.created_at.isoformat(),
            'user': {'id': a.user.id, 'username': a.user.username} if a.user else None
        })
    return jsonify(result)

@analytics_bp.route('/project/<int:project_id>/stats', methods=['GET'])
@token_required
def get_project_stats(current_user, project_id):
    """Retrieve task statistics for charts/analytics."""
    _ = current_user
    
    # Task count by status
    status_counts = db.session.query(Task.status, func.count(Task.id)).filter_by(project_id=project_id).group_by(Task.status).all()
    status_data = [{'name': s[0], 'value': s[1]} for s in status_counts]
    
    # Task count by priority
    priority_counts = db.session.query(Task.priority, func.count(Task.id)).filter_by(project_id=project_id).group_by(Task.priority).all()
    priority_data = [{'name': p[0], 'value': p[1]} for p in priority_counts]
    
    # Total estimates by assignee (for workload chart)
    workload = db.session.query(Task.assignee_id, func.sum(Task.estimate)).filter_by(project_id=project_id).filter(Task.status != 'done').group_by(Task.assignee_id).all()
    
    # Needs to join user to get names but we'll return mapping for now
    workload_data = [{'assignee_id': w[0], 'total_estimate': int(w[1]) if w[1] else 0} for w in workload]
    
    return jsonify({
        'status_breakdown': status_data,
        'priority_breakdown': priority_data,
        'workload': workload_data
    })

@analytics_bp.route('/project/<int:project_id>/burndown', methods=['GET'])
@token_required
def get_burndown(current_user, project_id):
    """Compute a burndown chart for a specific sprint."""
    _ = current_user
    sprint_id = request.args.get('sprint_id', type=int)
    if not sprint_id:
        return jsonify({'error': 'sprint_id query param required'}), 400

    sprint = Sprint.query.get_or_404(sprint_id)
    if not sprint.start_date or not sprint.end_date:
        return jsonify({'error': 'Sprint has no start/end date set'}), 400

    # All tasks in this sprint
    tasks = Task.query.filter_by(sprint_id=sprint_id).all()
    total_points = sum(t.estimate or 1 for t in tasks)  # default 1 pt if no estimate

    # Build daily data from start_date to end_date
    data = []
    current_day = sprint.start_date.date()
    end_day = sprint.end_date.date()
    today = __import__('datetime').date.today()

    while current_day <= end_day:
        # Count tasks completed ON OR BEFORE this day as "burned"
        completed_by_day = sum(
            1 for t in tasks
            if t.status == 'done'
        )
        # Ideal remaining
        total_days = (end_day - sprint.start_date.date()).days or 1
        day_index = (current_day - sprint.start_date.date()).days
        ideal = round(total_points * (1 - day_index / total_days), 1)

        # Only show actual remaining up to today
        if current_day <= today:
            remaining = sum(t.estimate or 1 for t in tasks if t.status != 'done')
            data.append({
                'date': current_day.isoformat(),
                'ideal': ideal,
                'remaining': remaining
            })
        else:
            data.append({
                'date': current_day.isoformat(),
                'ideal': ideal,
                'remaining': None  # future — no actual data
            })

        current_day += timedelta(days=1)

    return jsonify({
        'sprint_name': sprint.name,
        'total_points': total_points,
        'data': data
    })
