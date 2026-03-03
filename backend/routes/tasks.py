from flask import Blueprint, request, jsonify
from models import db, Task, TaskComment, ChecklistItem, Label, task_labels, Sprint, ActivityLog
from datetime import datetime
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
            'assignee_id': t.assignee_id,
            'assignee_username': t.assignee.username if t.assignee else None,
            'sprint_id': t.sprint_id,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'estimate': t.estimate,
            'labels': [{'id': l.id, 'name': l.name, 'color': l.color} for l in t.labels],
            'checklist_count': len(t.checklist_items),
            'checklist_completed': sum(1 for c in t.checklist_items if c.is_completed),
            'comment_count': len(t.comments)
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
        assignee_id=data.get('assignee_id'),
        parent_id=data.get('parent_id')
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
    if 'sprint_id' in data:
        task.sprint_id = data['sprint_id']
    if 'estimate' in data:
        task.estimate = data['estimate']
    if 'due_date' in data:
        task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) if data['due_date'] else None
    db.session.commit()
    return jsonify({'message': 'Task updated!'})

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    """Delete a task and all its related data."""
    task = Task.query.get_or_404(task_id)
    project_id = task.project_id
    task_title = task.title
    db.session.delete(task)
    # Log the deletion
    log = ActivityLog(
        project_id=project_id,
        user_id=current_user.id,
        action_type='task_deleted',
        description=f"Deleted task '{task_title}'"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Task deleted'})

@tasks_bp.route('/<int:task_id>/details', methods=['GET'])
@token_required
def get_task_details(current_user, task_id):
    """Get full details of a task including comments, checklists, etc."""
    _ = current_user
    t = Task.query.get_or_404(task_id)
    return jsonify({
        'id': t.id,
        'title': t.title,
        'description': t.description,
        'status': t.status,
        'priority': t.priority,
        'project_id': t.project_id,
        'assignee_id': t.assignee_id,
        'sprint_id': t.sprint_id,
        'due_date': t.due_date.isoformat() if t.due_date else None,
        'estimate': t.estimate,
        'labels': [{'id': l.id, 'name': l.name, 'color': l.color} for l in t.labels],
        'checklists': [{'id': c.id, 'content': c.content, 'is_completed': c.is_completed} for c in t.checklist_items],
        'subtasks': [{
            'id': st.id,
            'title': st.title,
            'status': st.status,
            'priority': st.priority,
            'assignee_username': st.assignee.username if st.assignee else None
        } for st in t.subtasks],
        'comments': [{
            'id': c.id, 
            'content': c.content, 
            'created_at': c.created_at.isoformat(),
            'user': {'id': c.user.id, 'username': c.user.username}
        } for c in t.comments]
    })

@tasks_bp.route('/<int:task_id>/comments', methods=['POST'])
@token_required
def add_comment(current_user, task_id):
    """Add a comment to a task."""
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    comment = TaskComment(task_id=task.id, user_id=current_user.id, content=data['content'])
    db.session.add(comment)
    db.session.commit()
    return jsonify({'message': 'Comment added', 'id': comment.id, 'created_at': comment.created_at.isoformat(), 'user': {'id': current_user.id, 'username': current_user.username}})

@tasks_bp.route('/<int:task_id>/checklists', methods=['POST'])
@token_required
def add_checklist_item(current_user, task_id):
    """Add a checklist item to a task."""
    _ = current_user
    data = request.get_json()
    task = Task.query.get_or_404(task_id)
    item = ChecklistItem(task_id=task.id, content=data['content'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Checklist item added', 'id': item.id, 'content': item.content, 'is_completed': item.is_completed})

@tasks_bp.route('/checklists/<int:item_id>', methods=['PUT', 'DELETE'])
@token_required
def toggle_checklist_item(current_user, item_id):
    """Toggle completion or delete a checklist item."""
    _ = current_user
    item = ChecklistItem.query.get_or_404(item_id)
    
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item deleted'})
        
    data = request.get_json()
    if 'is_completed' in data:
        item.is_completed = data['is_completed']
    if 'content' in data:
        item.content = data['content']
    db.session.commit()
    return jsonify({'message': 'Item updated'})

@tasks_bp.route('/<int:task_id>/labels', methods=['POST'])
@token_required
def assign_label(current_user, task_id):
    """Assign a label to a task."""
    _ = current_user
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    label = Label.query.get_or_404(data['label_id'])
    
    if label not in task.labels:
        task.labels.append(label)
        db.session.commit()
        
    return jsonify({'message': 'Label assigned', 'label': {'id': label.id, 'name': label.name, 'color': label.color}})
    
@tasks_bp.route('/<int:task_id>/labels/<int:label_id>', methods=['DELETE'])
@token_required
def remove_label(current_user, task_id, label_id):
    """Remove a label from a task."""
    _ = current_user
    task = Task.query.get_or_404(task_id)
    label = Label.query.get_or_404(label_id)
    
    if label in task.labels:
        task.labels.remove(label)
        db.session.commit()
        
    return jsonify({'message': 'Label removed'})

