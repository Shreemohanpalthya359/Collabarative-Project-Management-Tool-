from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.json

    return jsonify({
        "message": "register route working",
        "data": data
    })