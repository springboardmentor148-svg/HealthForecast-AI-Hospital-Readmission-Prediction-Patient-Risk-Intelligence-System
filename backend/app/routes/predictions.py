from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

import time
from ..errors import APIError
from ..models import UserRole, Patient, Prediction
from ..extensions import db
from ..services.prediction_service import (
    fetch_prediction,
    list_prediction_history,
    run_prediction,
    serialize_prediction_detail,
)
from ..utils.access_control import require_roles

bp = Blueprint("predictions", __name__)


def _json_response(payload: dict, status_code: int = 200):
    return jsonify(payload), status_code


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "predictions"})


@bp.get("")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def get_predictions():
    return _json_response(list_prediction_history(request.args))


@bp.get("/<prediction_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def get_prediction(prediction_id: str):
    prediction = _resolve_prediction(prediction_id)
    return _json_response({"prediction": serialize_prediction_detail(prediction)})


@bp.post("/run")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def create_prediction():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    identity = get_jwt_identity()
    created_by_id = None
    try:
        created_by_id = int(identity) if identity is not None else None
    except (TypeError, ValueError):
        created_by_id = None

    result = run_prediction(payload, created_by_id=created_by_id)
    return _json_response(result, 201)


def _resolve_prediction(prediction_id: str):
    try:
        numeric_id = int(prediction_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Prediction not found", 404) from exc

    prediction = fetch_prediction(numeric_id)
    if prediction is None:
        raise APIError("Prediction not found", 404)
    return prediction


@bp.get("/pending-count")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def get_pending_predictions_count():
    count = Patient.query.filter(~Patient.predictions.any()).count()
    return jsonify({"pending_count": count})


@bp.post("/run-pending")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def run_pending_predictions():
    identity = get_jwt_identity()
    created_by_id = None
    try:
        created_by_id = int(identity) if identity is not None else None
    except (TypeError, ValueError):
        created_by_id = None

    patients = Patient.query.filter(~Patient.predictions.any()).all()
    
    processed = len(patients)
    successful = 0
    failed = 0
    failed_patient_ids = []
    start_time = time.perf_counter()

    for p in patients:
        try:
            payload = {"patient_id": p.id}
            run_prediction(payload, created_by_id=created_by_id)
            successful += 1
        except Exception:
            db.session.rollback()
            failed += 1
            failed_patient_ids.append(p.id)

    duration = time.perf_counter() - start_time
    return jsonify({
        "processed": processed,
        "successful": successful,
        "failed": failed,
        "failed_patient_ids": failed_patient_ids,
        "duration_seconds": round(duration, 2)
    })


@bp.post("/run-all")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def run_all_predictions():
    identity = get_jwt_identity()
    created_by_id = None
    try:
        created_by_id = int(identity) if identity is not None else None
    except (TypeError, ValueError):
        created_by_id = None

    patients = Patient.query.all()
    
    processed = len(patients)
    successful = 0
    failed = 0
    failed_patient_ids = []
    start_time = time.perf_counter()

    for p in patients:
        try:
            latest_pred = (
                Prediction.query.filter_by(patient_id=p.id)
                .order_by(Prediction.predicted_at.desc())
                .first()
            )
            
            if latest_pred and latest_pred.features_snapshot and "inputs" in latest_pred.features_snapshot:
                inputs = latest_pred.features_snapshot["inputs"]
                payload = {
                    "patient_id": p.id,
                    "admission_source_id": inputs.get("admission_source_id", p.admission_source_id),
                    "discharge_disposition_id": inputs.get("discharge_disposition_id", p.discharge_disposition_id),
                    "number_inpatient": inputs.get("number_inpatient", p.number_inpatient),
                    "number_emergency": inputs.get("number_emergency", p.number_emergency),
                    "number_outpatient": inputs.get("number_outpatient", p.number_outpatient),
                    "num_procedures": inputs.get("num_procedures", p.num_procedures),
                    "num_medications": inputs.get("num_medications", p.num_medications),
                    "medications_count": inputs.get("medications_count", p.num_medications),
                    "diag_1": inputs.get("diag_1", p.primary_diagnosis),
                    "diag_2": inputs.get("diag_2", p.secondary_diagnosis),
                    "diag_3": inputs.get("diag_3", p.diag_3),
                    "a1c_result": inputs.get("a1c_result", p.a1c_result),
                    "max_glu_serum": inputs.get("max_glu_serum", p.max_glu_serum),
                    "insulin_usage": inputs.get("insulin_usage", p.insulin_usage),
                    "time_in_hospital": inputs.get("time_in_hospital", p.time_in_hospital),
                    "diagnoses_count": inputs.get("diagnoses_count", p.prior_diagnoses_count),
                }
            else:
                payload = {"patient_id": p.id}
            
            run_prediction(payload, created_by_id=created_by_id)
            successful += 1
        except Exception:
            db.session.rollback()
            failed += 1
            failed_patient_ids.append(p.id)

    duration = time.perf_counter() - start_time
    return jsonify({
        "processed": processed,
        "successful": successful,
        "failed": failed,
        "failed_patient_ids": failed_patient_ids,
        "duration_seconds": round(duration, 2)
    })
