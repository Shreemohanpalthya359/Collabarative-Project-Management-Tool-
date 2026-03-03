"""File attachment routes — upload, list, download, delete."""
import os
import uuid
from flask import Blueprint, jsonify, request, send_from_directory, current_app
from werkzeug.utils import secure_filename
from models import db, Task, Attachment, User
from routes.auth import token_required

attachments_bp = Blueprint('attachments', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'md', 'zip', 'docx', 'xlsx', 'csv'}

def _allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@attachments_bp.route('/task/<int:task_id>', methods=['GET'])
@token_required
def list_attachments(current_user, task_id):
    _ = current_user
    Task.query.get_or_404(task_id)
    items = Attachment.query.filter_by(task_id=task_id).order_by(Attachment.uploaded_at.desc()).all()
    return jsonify([{
        'id': a.id,
        'filename': a.filename,
        'mimetype': a.mimetype,
        'size_bytes': a.size_bytes,
        'username': User.query.get(a.user_id).username if a.user_id else '?',
        'uploaded_at': a.uploaded_at.isoformat(),
        'download_url': f'/api/attachments/download/{a.id}'
    } for a in items])

@attachments_bp.route('/task/<int:task_id>', methods=['POST'])
@token_required
def upload_attachment(current_user, task_id):
    Task.query.get_or_404(task_id)
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    if not _allowed(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    original = secure_filename(file.filename)
    ext = original.rsplit('.', 1)[-1] if '.' in original else ''
    stored = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    path = os.path.join(UPLOAD_FOLDER, stored)
    file.save(path)
    size = os.path.getsize(path)

    attachment = Attachment(
        task_id=task_id,
        user_id=current_user.id,
        filename=original,
        stored_name=stored,
        mimetype=file.mimetype,
        size_bytes=size
    )
    db.session.add(attachment)
    db.session.commit()
    return jsonify({'id': attachment.id, 'filename': original, 'size_bytes': size}), 201

@attachments_bp.route('/download/<int:attachment_id>', methods=['GET'])
@token_required
def download_attachment(current_user, attachment_id):
    _ = current_user
    attachment = Attachment.query.get_or_404(attachment_id)
    return send_from_directory(UPLOAD_FOLDER, attachment.stored_name, as_attachment=True,
                               download_name=attachment.filename)

@attachments_bp.route('/<int:attachment_id>', methods=['DELETE'])
@token_required
def delete_attachment(current_user, attachment_id):
    attachment = Attachment.query.get_or_404(attachment_id)
    if attachment.user_id != current_user.id:
        return jsonify({'error': 'Can only delete your own attachments'}), 403
    path = os.path.join(UPLOAD_FOLDER, attachment.stored_name)
    if os.path.exists(path):
        os.remove(path)
    db.session.delete(attachment)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
