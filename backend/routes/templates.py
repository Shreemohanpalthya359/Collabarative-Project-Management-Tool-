"""Task template routes — CRUD and apply-to-task."""
from flask import Blueprint, jsonify, request
from models import db, TaskTemplate, Task, Project, ActivityLog
from routes.auth import token_required

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def list_templates(current_user, project_id):
    _ = current_user
    templates = TaskTemplate.query.filter_by(project_id=project_id).all()
    return jsonify([{
        'id': t.id, 'name': t.name, 'title': t.title,
        'description': t.description, 'priority': t.priority, 'estimate': t.estimate
    } for t in templates])

@templates_bp.route('/project/<int:project_id>', methods=['POST'])
@token_required
def create_template(current_user, project_id):
    Project.query.get_or_404(project_id)
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    title = data.get('title', '').strip()
    if not name or not title:
        return jsonify({'error': 'name and title are required'}), 400
    t = TaskTemplate(
        project_id=project_id,
        name=name,
        title=title,
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        estimate=data.get('estimate')
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({'id': t.id, 'name': t.name, 'title': t.title}), 201

@templates_bp.route('/<int:template_id>', methods=['DELETE'])
@token_required
def delete_template(current_user, template_id):
    _ = current_user
    t = TaskTemplate.query.get_or_404(template_id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({'message': 'Template deleted'})

@templates_bp.route('/<int:template_id>/apply', methods=['POST'])
@token_required
def apply_template(current_user, template_id):
    """Create a new task from a template."""
    t = TaskTemplate.query.get_or_404(template_id)
    task = Task(
        project_id=t.project_id,
        title=t.title,
        description=t.description,
        priority=t.priority,
        estimate=t.estimate,
        status='todo',
        assignee_id=current_user.id
    )
    db.session.add(task)
    log = ActivityLog(
        project_id=t.project_id,
        user_id=current_user.id,
        action_type='task_created',
        description=f"{current_user.username} created task '{t.title}' from template '{t.name}'"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'id': task.id, 'title': task.title}), 201
