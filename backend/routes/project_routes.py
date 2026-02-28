from flask import Blueprint, request, jsonify
from models.project_model import Project
from database.db import db

project_bp = Blueprint("projects", __name__)


@project_bp.route("/", methods=["GET"])
def get_projects():

    projects = Project.query.all()

    project_list = []

    for project in projects:
        project_list.append({
            "id": project.id,
            "name": project.name,
            "description": project.description
        })

    return jsonify(project_list)


@project_bp.route("/", methods=["POST"])
def create_project():

    data = request.json

    new_project = Project(
        name=data.get("name"),
        description=data.get("description")
    )

    db.session.add(new_project)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully"
    })


@project_bp.route("/<int:id>", methods=["PUT"])
def update_project(id):

    project = Project.query.get(id)

    if not project:
        return jsonify({"error": "Project not found"}), 404

    data = request.json

    project.name = data.get("name", project.name)
    project.description = data.get("description", project.description)

    db.session.commit()

    return jsonify({
        "message": "Project updated"
    })


@project_bp.route("/<int:id>", methods=["DELETE"])
def delete_project(id):

    project = Project.query.get(id)

    if not project:
        return jsonify({"error": "Project not found"}), 404

    db.session.delete(project)
    db.session.commit()

    return jsonify({
        "message": "Project deleted"
    })
