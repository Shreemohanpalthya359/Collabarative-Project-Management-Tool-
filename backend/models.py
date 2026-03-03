from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Association table for Task <-> Label many-to-many relationship
task_labels = db.Table('task_labels',
    db.Column('task_id', db.Integer, db.ForeignKey('task.id'), primary_key=True),
    db.Column('label_id', db.Integer, db.ForeignKey('label.id'), primary_key=True)
)

class User(db.Model):
    """User representation for authentication and ownership."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    """Project representation storing metadata and GitHub links."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    github_repo = db.Column(db.String(255), nullable=True) # owner/repo format
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True, default=None)  # soft-delete
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    owner = db.relationship('User', backref=db.backref('projects_owned', lazy=True))

class ProjectMember(db.Model):
    """Mapping table for users belonging to projects with specific roles."""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='member') # owner, admin, member

    project = db.relationship(
        'Project',
        backref=db.backref('members', lazy=True, cascade="all, delete-orphan")
    )
    user = db.relationship('User', backref=db.backref('project_memberships', lazy=True))

class Sprint(db.Model):
    """Sprint/Milestone representation for a project."""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='planned') # planned, active, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('sprints', lazy=True, cascade="all, delete-orphan"))

class Label(db.Model):
    """Tags/Labels that can be attached to tasks."""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False, default='#3b82f6') # Hex color code
    
    project = db.relationship('Project', backref=db.backref('labels', lazy=True, cascade="all, delete-orphan"))

class Task(db.Model):
    """Task item associated with a project."""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='todo') # todo, in_progress, done
    priority = db.Column(db.String(50), nullable=False, default='medium') # low, medium, high
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    sprint_id = db.Column(db.Integer, db.ForeignKey('sprint.id'), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True) # For subtasks
    github_issue_id = db.Column(db.Integer, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    estimate = db.Column(db.Integer, nullable=True) # Story points or hours
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship(
        'Project',
        backref=db.backref('tasks', lazy=True, cascade="all, delete-orphan")
    )
    assignee = db.relationship('User', backref=db.backref('tasks_assigned', lazy=True))
    sprint = db.relationship('Sprint', backref=db.backref('tasks', lazy=True))
    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True)
    labels = db.relationship('Label', secondary=task_labels, lazy='subquery',
        backref=db.backref('tasks', lazy=True))

class TaskComment(db.Model):
    """Comments on a specific task."""
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref=db.backref('comments', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('comments', lazy=True))

class ChecklistItem(db.Model):
    """Checklist item within a task."""
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    content = db.Column(db.String(255), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref=db.backref('checklist_items', lazy=True, cascade="all, delete-orphan"))

class ActivityLog(db.Model):
    """Audit trail for project activities."""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # System actions might have no user
    action_type = db.Column(db.String(50), nullable=False) # e.g., 'task_created', 'status_changed'
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('activity_logs', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('activities', lazy=True))

class Notification(db.Model):
    """In-app notification for a user."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    link = db.Column(db.String(255), nullable=True)  # e.g. /project/6
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', lazy=True))
    project = db.relationship('Project', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))

class TimeLog(db.Model):
    """Time entry logged against a task."""
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    minutes = db.Column(db.Integer, nullable=False)  # duration in minutes
    note = db.Column(db.String(255), nullable=True)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref=db.backref('time_logs', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('time_logs', lazy=True))

class Attachment(db.Model):
    """File attachment linked to a task."""
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)       # original filename
    stored_name = db.Column(db.String(255), nullable=False)    # UUID-based stored name
    mimetype = db.Column(db.String(100), nullable=True)
    size_bytes = db.Column(db.Integer, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref=db.backref('attachments', lazy=True, cascade="all, delete-orphan"))
    user = db.relationship('User', backref=db.backref('attachments', lazy=True))

class TaskTemplate(db.Model):
    """Reusable task templates for a project."""
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), default='medium')
    estimate = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('templates', lazy=True, cascade="all, delete-orphan"))
