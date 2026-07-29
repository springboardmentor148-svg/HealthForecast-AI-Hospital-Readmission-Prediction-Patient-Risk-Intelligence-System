from __future__ import annotations


def test_ml_artifacts_load_at_startup(app):
    service = app.extensions.get("ml_inference_service")
    assert service is not None
    assert service.model is not None
    assert len(service.feature_names) == 85
    assert float(service.threshold) == 0.15
    assert service.model_name == "Weighted Stacking Ensemble"
    assert service.model_version == "v1.2"
