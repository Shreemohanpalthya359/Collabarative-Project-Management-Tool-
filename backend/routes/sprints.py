"""Sprint and milestone routes for projects."""
from flask import Blueprint, request, jsonify
from models import db, Sprint
from routes.auth import token_required
from datetime import datetime

sprints_bp = Blueprint('sprints', __name__)

@sprints_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def get_sprints(current_user, project_id):
    """Retrieve all sprints for a specific project."""
    _ = current_user
    sprints = Sprint.query.filter_by(project_id=project_id).all()
    result = []
    for s in sprints:
        result.append({
            'id': s.id,
            'name': s.name,
            'status': s.status,
            'start_date': s.start_date.isoformat() if s.start_date else None,
            'end_date': s.end_date.isoformat() if s.end_date else None,
            'task_count': len(s.tasks)
        })
    return jsonify(result)

@sprints_bp.route('/project/<int:project_id>', methods=['POST'])
@token_required
def create_sprint(current_user, project_id):
    """Create a new sprint for a project."""
    _ = current_user
    data = request.get_json()
    
    start_date = None
    if data.get('start_date'):
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        
    end_date = None
    if data.get('end_date'):
        end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
    new_sprint = Sprint(
        name=data['name'],
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
        status=data.get('status', 'planned')
    )
    db.session.add(new_sprint)
    db.session.commit()
    
    return jsonify({
        'message': 'Sprint created', 
        'id': new_sprint.id,
        'name': new_sprint.name
    })

@sprints_bp.route('/<int:sprint_id>', methods=['PUT', 'DELETE'])
@token_required
def update_sprint(current_user, sprint_id):
    """Update or delete a sprint."""
    _ = current_user
    sprint = Sprint.query.get_or_404(sprint_id)
    
    if request.method == 'DELETE':
        db.session.delete(sprint)
        db.session.commit()
        return jsonify({'message': 'Sprint deleted'})
        
    data = request.get_json()
    if 'name' in data:
        sprint.name = data['name']
    if 'status' in data:
        sprint.status = data['status']
    if 'start_date' in data:
        sprint.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')) if data['start_date'] else None
    if 'end_date' in data:
        sprint.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')) if data['end_date'] else None
        
    db.session.commit()
    return jsonify({'message': 'Sprint updated'})
