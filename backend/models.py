from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

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

class Task(db.Model):
    """Task item associated with a project."""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='todo') # todo, in_progress, done
    priority = db.Column(db.String(50), nullable=False, default='medium') # low, medium, high
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship(
        'Project',
        backref=db.backref('tasks', lazy=True, cascade="all, delete-orphan")
    )
    assignee = db.relationship('User', backref=db.backref('tasks_assigned', lazy=True))
