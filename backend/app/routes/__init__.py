from __future__ import annotations

from .analytics import bp as analytics_bp
from .auth import bp as auth_bp
from .clinical_support import bp as clinical_support_bp
from .patients import bp as patients_bp
from .predictions import bp as predictions_bp
from .models import bp as models_bp
from .treatments import bp as treatments_bp
from .users import bp as users_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(patients_bp, url_prefix="/api/v1/patients")
    app.register_blueprint(predictions_bp, url_prefix="/api/v1/predictions")
    app.register_blueprint(analytics_bp, url_prefix="/api/v1/analytics")
    app.register_blueprint(treatments_bp, url_prefix="/api/v1/treatments")
    app.register_blueprint(models_bp, url_prefix="/api/v1/models")
    app.register_blueprint(clinical_support_bp, url_prefix="/api/v1/clinical-support")
