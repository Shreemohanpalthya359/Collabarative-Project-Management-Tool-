# backend/tests/test_api.py
import sys
import os
import pytest

# Add backend folder to Python path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app as flask_app, db as real_db
from models.project_model import Project
from models.task_model import Task

# ===========================
# Setup Test App & DB
# ===========================
@pytest.fixture
def app():
    # Configure Flask app for testing
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",  # In-memory DB, fresh each test
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    # Create the database tables
    with flask_app.app_context():
        real_db.create_all()
        yield flask_app
        real_db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

# ===========================
# Example Tests
# ===========================
def test_create_project(client):
    with flask_app.app_context():
        # create project
        project = Project(name="Test Project", description="Sample Description")
        real_db.session.add(project)
        real_db.session.commit()

        # Check that project is added
        p = Project.query.filter_by(name="Test Project").first()
        assert p is not None
        assert p.description == "Sample Description"

def test_create_task(client):
    with flask_app.app_context():
        # create parent project for task
        project = Project(name="Another Project", description="For Task")
        real_db.session.add(project)
        real_db.session.commit()

        # create task
        task = Task(title="Task 1", status="Pending", project_id=project.id)
        real_db.session.add(task)
        real_db.session.commit()

        t = Task.query.filter_by(title="Task 1").first()
        assert t is not None
        assert t.project_id == project.id