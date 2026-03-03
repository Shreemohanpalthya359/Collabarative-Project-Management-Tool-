"""Main application entry point for the Project Manager backend."""
from flask import Flask
from flask_cors import CORS
from models import db
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.tasks import tasks_bp
from routes.github import github_bp
from routes.sprints import sprints_bp
from routes.analytics import analytics_bp
from routes.notifications import notifications_bp
from routes.profile import profile_bp
from routes.comments import comments_bp
from routes.labels import labels_bp
from routes.time_tracking import time_tracking_bp
from routes.attachments import attachments_bp
from routes.templates import templates_bp
from routes.ical import ical_bp

app = Flask(__name__)
# Enable CORS for frontend integration
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project_manager.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-super-secret-key' # In production, use environment variable

db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
app.register_blueprint(github_bp, url_prefix='/api/github')
app.register_blueprint(sprints_bp, url_prefix='/api/sprints')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(comments_bp, url_prefix='/api/comments')
app.register_blueprint(labels_bp, url_prefix='/api/labels')
app.register_blueprint(time_tracking_bp, url_prefix='/api/time')
app.register_blueprint(attachments_bp, url_prefix='/api/attachments')
app.register_blueprint(templates_bp, url_prefix='/api/templates')
app.register_blueprint(ical_bp, url_prefix='/api/ical')

@app.route("/")
def home():
    """Health check endpoint to verify backend is running."""
    return "Backend Running!"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)