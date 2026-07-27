"""
routes/auth.py
Blueprint handling application user identity transactions: Registration, 
Login, Profile retrieval, and Session invalidation.
"""

from flask import Blueprint, request, jsonify, make_response
from models.user import User
from utils.helpers import (
    validate_registration_payload, 
    generate_jwt_token, 
    token_required
)
import sqlite3

# Define decoupled route space cluster blueprints
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /register
    Handles inbound clinician account registration payloads.
    """
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Bad Request", "message": "Invalid JSON body payload format."}), 400
        
    # Run parameters payload syntax checks
    validation_error = validate_registration_payload(data)
    if validation_error:
        return jsonify({"error": "Validation Failure", "message": validation_error}), 400
        
    try:
        # Create user record with hashed credentials
        user_id = User.create(
            name=data['name'],
            email=data['email'],
            plain_password=data['password']
        )
        return jsonify({
            "status": "Success",
            "message": "User account registry finalized successfully.",
            "user_id": user_id
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({
            "error": "Conflict State", 
            "message": "An account linked to that email coordinate trace is already active."
        }), 409
    except Exception as e:
        return jsonify({"error": "Server Interface Error", "message": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /login
    Validates user credentials and issues a signed JWT access token.
    """
    try:
        data = request.get_json()
    except Exception:
        return jsonify({"error": "Bad Request", "message": "Invalid JSON payload format."}), 400
        
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Validation Failure", "message": "Missing email or password."}), 400
        
    user_row = User.find_by_email(data['email'])
    
    # Secure validation path: verify user existence and check password hash
    if not user_row or not User.verify_password(user_row['password'], data['password']):
        return jsonify({
            "error": "Unauthorized Access", 
            "message": "Invalid credentials provided."
        }), 401
        
    # Generate a cryptographically signed JWT access token
    token = generate_jwt_token(user_row['id'])
    
    # Build standard JSON response matrix
    response_payload = jsonify({
        "status": "Authenticated",
        "message": "Access token generated successfully.",
        "token": token,
        "user": {
            "id": user_row['id'],
            "name": user_row['name'],
            "email": user_row['email']
        }
    })
    
    # Wrap tracking arrays using cross-origin HTTP-only cookie parameters
    response = make_response(response_payload, 200)
    response.set_cookie(
        'session_token',
        token,
        httponly=True,
        samesite='Lax',
        secure=False  # Switch to True in a production environment with HTTPS
    )
    
    return response


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """
    GET /profile
    Retrieves profile metrics for the currently authenticated user.
    """
    user_profile = User.find_by_id(current_user_id)
    if not user_profile:
        return jsonify({"error": "Not Found", "message": "User context could not be resolved."}), 404
        
    return jsonify(user_profile), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    POST /logout
    Clears the active session token state cookies.
    """
    response = make_response(jsonify({
        "status": "Deauthenticated", 
        "message": "Session context destroyed successfully."
    }), 200)
    
    # Invalidate tracking states by clearing the session token cookie
    response.set_cookie('session_token', '', expires=0)
    return response