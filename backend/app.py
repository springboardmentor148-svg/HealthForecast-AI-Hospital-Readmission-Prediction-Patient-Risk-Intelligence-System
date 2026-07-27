"""
app.py
Master Orchestration Gateway. Bootstraps app components, maps routing modules, 
configures global CORS validation gates, and orchestrates database initialization hooks.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config
from database import db
from routes.auth import auth_bp
from routes.predict import predict_bp

def create_app():
    """
    Application Factory Pattern. Instantiates configuration pipelines,
    registers application blueprints, and exposes global error handling layers.
    """
    app = Flask(__name__)
    
    # 1. Bind structural environment profile configurations
    app.config.from_object(get_config())
    
    # 2. Configure Cross-Origin Resource Sharing (CORS) rulesets
    # Allows cross-origin REST requests from decoupled frontend clients while protecting system boundaries
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})
    
    # 3. Synchronize infrastructure application components
    db.init_app(app)
    
    # 4. Bind system runtime blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(predict_bp, url_prefix='/api/predict')
    
    # 5. Initialize base database schemas on startup within appropriate context loops
    with app.app_context():
        db.init_db()
        
    # 6. Global fallback error handlers for structural tracking stability
    @app.errorhandler(404)
    def resource_not_found(e):
        return jsonify({"error": "Resource Not Found", "message": "The requested API endpoint does not exist."}), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred within the server."}), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        """Public verification metric to evaluate platform execution availability."""
        return jsonify({"status": "healthy", "service": "Diabetes Readmission Analytics Pipeline"}), 200

    return app

# Main entry point runner configuration
app = create_app()

if __name__ == '__main__':
    # Extract host configuration parameters or bind local loopbacks
    host_target = os.environ.get('HOST', '0.0.0.0')
    port_target = int(os.environ.get('PORT', 5000))
    
    app.run(host=host_target, port=port_target)