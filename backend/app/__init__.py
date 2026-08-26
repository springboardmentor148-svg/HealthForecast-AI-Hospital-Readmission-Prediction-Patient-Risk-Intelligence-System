from __future__ import annotations

from flask import Flask, jsonify

from .config import get_config_object
from .errors import register_error_handlers
from .extensions import cors, db, jwt, migrate
from . import models  # noqa: F401
from .routes import register_blueprints
from .services.ml_inference_service import get_ml_inference_service
from .utils.logger import configure_logging, register_request_logging


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)

    config_object = get_config_object(config_name)
    app.config.from_object(config_object)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY must be configured in the environment.")
    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("JWT_SECRET_KEY must be configured in the environment.")

    configure_logging(app)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    import sys
    import os
    is_testing = app.config.get("TESTING") or os.getenv("FLASK_ENV") == "testing" or "pytest" in sys.modules
    is_db_cmd = "db" in sys.argv
    if not is_testing and not is_db_cmd:
        with app.app_context():
            try:
                from sqlalchemy import inspect
                inspector = inspect(db.engine)
                existing_tables = set(inspector.get_table_names())
                required_tables = {
                    "users",
                    "patients",
                    "predictions",
                    "prediction_history",
                    "treatment_effectiveness",
                    "activity_logs",
                    "notifications",
                }
                missing_tables = required_tables - existing_tables
                if missing_tables:
                    missing_str = ", ".join(sorted(list(missing_tables)))
                    err_msg = f"Database schema incomplete. Missing tables: {missing_str}. Run flask db upgrade."
                    app.logger.error(err_msg)
                    raise RuntimeError(err_msg)
            except RuntimeError:
                raise
            except Exception as exc:
                app.logger.warning(f"Database schema check could not be completed: {exc!s}")

    @jwt.unauthorized_loader
    def handle_missing_jwt(reason: str):
        return jsonify({"error": {"code": 401, "message": reason or "Missing authorization token"}}), 401

    @jwt.invalid_token_loader
    def handle_invalid_jwt(reason: str):
        return jsonify({"error": {"code": 401, "message": reason or "Invalid token"}}), 401

    @jwt.expired_token_loader
    def handle_expired_jwt(jwt_header, jwt_payload):
        return jsonify({"error": {"code": 401, "message": "Token has expired"}}), 401

    @jwt.revoked_token_loader
    def handle_revoked_jwt(jwt_header, jwt_payload):
        return jsonify({"error": {"code": 401, "message": "Token has been revoked"}}), 401

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
            }
        },
        supports_credentials=True,
    )

    try:
        app.extensions["ml_inference_service"] = get_ml_inference_service(app.config["MODEL_ARTIFACTS_DIR"])
        app.extensions["ml_model_loaded"] = True
        app.extensions["ml_model_load_error"] = None
    except Exception as exc:  # pragma: no cover - startup fallback for missing/corrupt artifacts
        app.logger.exception("Unable to load ML inference service at startup")
        app.extensions["ml_inference_service"] = None
        app.extensions["ml_model_loaded"] = False
        app.extensions["ml_model_load_error"] = str(exc)

    register_blueprints(app)
    register_error_handlers(app)
    register_request_logging(app)

    @app.get("/api/v1/health")
    def service_health():
        return jsonify(
            {
                "status": "ok",
                "service": "HealthForecast AI Backend",
                "version": app.config["API_VERSION"],
            }
        )

    return app
