from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.auth_routes import auth_bp
from flask import Flask
from flask_cors import CORS
from database.db import db


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(project_bp, url_prefix="/api/projects")

    app.register_blueprint(task_bp, url_prefix="/api/tasks")

    @app.route("/")
    def home():
        return {"message": "API running"}

    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
