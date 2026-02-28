"""Main application entry point for the Project Manager backend."""
from flask import Flask
from flask_cors import CORS
from models import db
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.tasks import tasks_bp
from routes.github import github_bp

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

@app.route("/")
def home():
    """Health check endpoint to verify backend is running."""
    return "Backend Running!"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)