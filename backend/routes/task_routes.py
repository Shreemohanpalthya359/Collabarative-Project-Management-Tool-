from flask import Blueprint, request, jsonify
from models.task_model import Task
from database.db import db

task_bp = Blueprint("tasks", __name__)


@task_bp.route("/project/<int:project_id>", methods=["GET"])
def get_tasks(project_id):

    tasks = Task.query.filter_by(project_id=project_id).all()

    task_list = []

    for task in tasks:
        task_list.append({
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "project_id": task.project_id
        })

    return jsonify(task_list)


@task_bp.route("/", methods=["POST"])
def create_task():

    data = request.json

    new_task = Task(
        title=data.get("title"),
        status=data.get("status"),
        project_id=data.get("project_id")
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "message": "Task created successfully"
    })


@task_bp.route("/<int:id>", methods=["PUT"])
def update_task(id):

    task = Task.query.get(id)

    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.json

    task.title = data.get("title", task.title)
    task.status = data.get("status", task.status)

    db.session.commit()

    return jsonify({
        "message": "Task updated"
    })


@task_bp.route("/<int:id>", methods=["DELETE"])
def delete_task(id):

    task = Task.query.get(id)

    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Task deleted"
    })
