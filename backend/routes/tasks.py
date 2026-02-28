"""Task routes for creating, listing, and updating project tasks."""
from flask import Blueprint, request, jsonify
from models import db, Task
from routes.auth import token_required

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def get_tasks(current_user, project_id):
    """Retrieve all tasks for a specific project."""
    _ = current_user
    tasks = Task.query.filter_by(project_id=project_id).all()
    result = []
    for t in tasks:
        result.append({
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'status': t.status,
            'priority': t.priority,
            'assignee_id': t.assignee_id
        })
    return jsonify(result)

@tasks_bp.route('/project/<int:project_id>', methods=['POST'])
@token_required
def create_task(current_user, project_id):
    """Create a new task under a specific project workspace."""
    _ = current_user
    data = request.get_json()
    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'todo'),
        priority=data.get('priority', 'medium'),
        project_id=project_id,
        assignee_id=data.get('assignee_id')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'message': 'Task created!', 'id': new_task.id, 'priority': new_task.priority})

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    """Update properties of an existing task."""
    _ = current_user
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    if 'status' in data:
        task.status = data['status']
    if 'priority' in data:
        task.priority = data['priority']
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'assignee_id' in data:
        task.assignee_id = data['assignee_id']
    db.session.commit()
    return jsonify({'message': 'Task updated!'})
