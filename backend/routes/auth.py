"""Authentication routes for user registration and login."""
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from models import db, User

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    """Decorator to require a valid JWT token for secure routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                return jsonify({'message': 'Token is invalid or user no longer exists!'}), 401
        except jwt.PyJWTError:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'])

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'User already exists'}), 400
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Registered successfully'})

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Login invalid!'}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token, 'username': user.username, 'user_id': user.id})
