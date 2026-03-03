"""Labels / Tags CRUD and task assignment routes."""
from flask import Blueprint, jsonify, request
from models import db, Label, Task, Project, ProjectMember
from routes.auth import token_required

labels_bp = Blueprint('labels', __name__)

def _member_or_owner(project_id, user_id):
    proj = Project.query.get(project_id)
    if proj and proj.owner_id == user_id:
        return True
    return ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first() is not None

@labels_bp.route('/project/<int:project_id>', methods=['GET'])
@token_required
def get_labels(current_user, project_id):
    _ = current_user
    labels = Label.query.filter_by(project_id=project_id).all()
    return jsonify([{'id': l.id, 'name': l.name, 'color': l.color} for l in labels])

@labels_bp.route('/project/<int:project_id>', methods=['POST'])
@token_required
def create_label(current_user, project_id):
    if not _member_or_owner(project_id, current_user.id):
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    color = data.get('color', '#6366f1')
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    label = Label(project_id=project_id, name=name, color=color)
    db.session.add(label)
    db.session.commit()
    return jsonify({'id': label.id, 'name': label.name, 'color': label.color}), 201

@labels_bp.route('/<int:label_id>', methods=['DELETE'])
@token_required
def delete_label(current_user, label_id):
    label = Label.query.get_or_404(label_id)
    if not _member_or_owner(label.project_id, current_user.id):
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(label)
    db.session.commit()
    return jsonify({'message': 'Label deleted'})

@labels_bp.route('/task/<int:task_id>/assign', methods=['POST'])
@token_required
def assign_label(current_user, task_id):
    _ = current_user
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    label_id = data.get('label_id')
    label = Label.query.get_or_404(label_id)
    if label not in task.labels:
        task.labels.append(label)
        db.session.commit()
    return jsonify({'message': 'Label assigned'})

@labels_bp.route('/task/<int:task_id>/remove', methods=['POST'])
@token_required
def remove_label(current_user, task_id):
    _ = current_user
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    label_id = data.get('label_id')
    label = Label.query.get(label_id)
    if label and label in task.labels:
        task.labels.remove(label)
        db.session.commit()
    return jsonify({'message': 'Label removed'})
