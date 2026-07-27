"""
utils/helpers.py
Utility validation routines and token authentication decorators.
"""

import re
import jwt
from datetime import datetime
from functools import wraps
from flask import request, jsonify, current_app

def token_required(f):
    """
    Decorator to protect routes requiring authentication. Parses authorization headers 
    or HTTP-only cookies to extract the verified user session token.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 1. Check for standard Authorization Header (Bearer Token)
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        # 2. Fallback check for session cookie
        if not token and request.cookies.get('session_token'):
            token = request.cookies.get('session_token')
            
        if not token:
            return jsonify({
                "error": "Authentication required", 
                "message": "Access token is missing."
            }), 401
            
        try:
            # Decode payload using application key signatures
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Authentication failed", 
                "message": "Token has expired. Please sign in again."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Authentication failed", 
                "message": "Invalid access token structure."
            }), 401
            
        return f(current_user_id, *args, **kwargs)
        
    return decorated


def generate_jwt_token(user_id):
    """
    Generates a cryptographically signed JWT for cross-origin access control tracking.
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def validate_registration_payload(data):
    """
    Validates user registration payloads.
    """
    if not data:
        return "Invalid JSON request body."
        
    required = ['name', 'email', 'password']
    for field in required:
        if field not in data or not str(data[field]).strip():
            return f"Missing required registration parameter: '{field}'."
            
    email = str(data['email']).strip()
    # Simple RFC 5322 compliant regex structural check
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return "Invalid email address formatting."
        
    if len(str(data['password'])) < 6:
        return "Password security threshold error: must be at least 6 characters."
        
    return None


def validate_prediction_payload(data):
    """
    Validates clinical feature arrays before evaluation.
    """
    if not data:
        return "Invalid telemetry data packet."
        
    # Crucial clinical identifiers map
    required_metrics = [
        'age_group', 'time_in_hospital', 'num_lab_procedures', 
        'num_procedures', 'num_medications', 'number_diagnoses'
    ]
    
    for metric in required_metrics:
        if metric not in data:
            return f"Missing analytical feature index parameter: '{metric}'."
        try:
            # Enforce validation casting parameters
            val = float(data[metric])
            if val < 0:
                return f"Clinical metrics anomaly: '{metric}' cannot possess negative values."
        except (ValueError, TypeError):
            return f"Data type mismatch: '{metric}' must resolve to an absolute numerical digit."
            
    return None