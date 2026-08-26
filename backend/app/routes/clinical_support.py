from __future__ import annotations

from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..errors import APIError
from ..extensions import db
from ..models import ClinicalSupportPlan, Patient, TreatmentEffectiveness, User, UserRole
from ..services.insights_service import build_clinical_support
from ..utils.access_control import require_roles

bp = Blueprint("clinical_support", __name__)


def _resolve_patient(patient_id: str) -> Patient:
    try:
        numeric_id = int(patient_id)
    except (TypeError, ValueError) as exc:
        raise APIError("Patient not found", 404) from exc
    patient = db.session.get(Patient, numeric_id)
    if patient is None:
        raise APIError("Patient not found", 404)
    return patient


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "module": "clinical_support"})


@bp.get("/<patient_id>")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def support_for_patient(patient_id: str):
    patient = _resolve_patient(patient_id)
    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if current_user and current_user.role == UserRole.doctor and patient.assigned_doctor_id != current_user.id:
        raise APIError("You are not authorized to view this patient's clinical support recommendations.", 403)
    return jsonify(build_clinical_support(patient))


@bp.post("/<patient_id>/draft")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def save_draft(patient_id: str):
    patient = _resolve_patient(patient_id)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise APIError("JSON request body is required", 400)

    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if not current_user:
        raise APIError("User not found", 404)

    if current_user.role == UserRole.doctor and patient.assigned_doctor_id != current_user.id:
        raise APIError("You are not authorized to manage this patient's treatment lifecycle.", 403)

    plan = ClinicalSupportPlan.query.filter_by(patient_id=patient.id).first()
    if not plan:
        plan = ClinicalSupportPlan(patient_id=patient.id)
        db.session.add(plan)

    plan.draft_notes = payload.get("draft_notes")
    plan.updated_by = current_user.id
    plan.status = "draft"

    # Derive and save treatment_name if not already set
    if not plan.treatment_name:
        support_data = build_clinical_support(patient)
        recs = support_data.get("recommendations") or []
        if recs:
            t_name = recs[0]
            if len(t_name) > 150:
                t_name = t_name[:147] + "..."
            plan.treatment_name = t_name
        else:
            plan.treatment_name = "Standard Care Protocol"

    db.session.flush()
    from ..services.notification_service import broadcast_notification
    broadcast_notification(
        title="💾 Clinical Support Draft Saved",
        message=f"Clinical support plan draft saved for patient {patient.first_name} {patient.last_name}.",
        notification_type="CLINICAL_SUPPORT_DRAFT_SAVED",
        related_entity="ClinicalSupportPlan",
        related_entity_id=plan.id
    )
    db.session.commit()
    return jsonify({
        "status": "success",
        "message": "Draft saved successfully.",
        "plan": {
            "is_approved": plan.is_approved,
            "status": plan.status,
            "treatment_name": plan.treatment_name,
            "approved_by": plan.approver.full_name if plan.approver else None,
            "approved_at": plan.approved_at.isoformat() if plan.approved_at else None,
            "draft_notes": plan.draft_notes,
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
            "updated_by": plan.updater.full_name if plan.updater else None,
        }
    })


@bp.post("/<patient_id>/approve")
@jwt_required()
@require_roles(UserRole.doctor, UserRole.hospital_administrator, UserRole.system_administrator)
def approve_plan(patient_id: str):
    patient = _resolve_patient(patient_id)

    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)
    if not current_user:
        raise APIError("User not found", 404)

    if current_user.role == UserRole.doctor and patient.assigned_doctor_id != current_user.id:
        raise APIError("You are not authorized to manage this patient's treatment lifecycle.", 403)

    from ..services.insights_service import create_treatment_from_plan

    try:
        plan = ClinicalSupportPlan.query.filter_by(patient_id=patient.id).first()
        if not plan:
            plan = ClinicalSupportPlan(patient_id=patient.id)
            db.session.add(plan)

        # Derive and save treatment_name if not already set
        if not plan.treatment_name:
            support_data = build_clinical_support(patient)
            recs = support_data.get("recommendations") or []
            if recs:
                t_name = recs[0]
                if len(t_name) > 150:
                    t_name = t_name[:147] + "..."
                plan.treatment_name = t_name
            else:
                plan.treatment_name = "Standard Care Protocol"

        plan.is_approved = True
        plan.status = "approved"
        plan.approved_by = current_user.id
        plan.approved_at = datetime.now(timezone.utc)
        plan.updated_by = current_user.id

        treatment = TreatmentEffectiveness.query.filter_by(patient_id=patient.id, status="active").first()
        created_new = False
        if not treatment:
            treatment = create_treatment_from_plan(patient, plan, current_user.id)
            created_new = True
        else:
            from ..services.forecast_service import generate_treatment_forecast
            forecast = generate_treatment_forecast(patient.id)
            treatment.treatment_name = plan.treatment_name
            treatment.notes = plan.draft_notes
            treatment.approved_by = current_user.id
            treatment.predicted_treatment_effectiveness = forecast.get("predicted_treatment_effectiveness")
            treatment.predicted_recovery_days = forecast.get("predicted_recovery_days")
            treatment.expected_response_category = forecast.get("expected_response_category")
            treatment.treatment_confidence = forecast.get("treatment_confidence")
            treatment.forecast_generated_at = forecast.get("forecast_generated_at")

        db.session.flush()
        from ..services.notification_service import broadcast_notification
        broadcast_notification(
            title="📋 Clinical Support Plan Approved",
            message=f"Clinical support plan approved for patient {patient.first_name} {patient.last_name} by {current_user.full_name}.",
            notification_type="CLINICAL_SUPPORT_PLAN_APPROVED",
            related_entity="ClinicalSupportPlan",
            related_entity_id=plan.id
        )
        if created_new:
            broadcast_notification(
                title="🩺 Treatment Initiated",
                message=f"Treatment '{treatment.treatment_name}' initiated for patient {patient.first_name} {patient.last_name}.",
                notification_type="TREATMENT_INITIATED",
                related_entity="TreatmentEffectiveness",
                related_entity_id=treatment.id
            )
        db.session.commit()
        
        from ..services.user_service import log_user_activity
        log_user_activity(
            action="approve_clinical_support",
            target_type="ClinicalSupportPlan",
            target_id=plan.id,
            metadata={
                "patient_id": patient.id,
                "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
            },
        )
    except Exception as e:
        db.session.rollback()
        raise e


    return jsonify({
        "status": "success",
        "message": "Plan approved and treatment initiated." if created_new else "Plan approved. Existing active treatment returned.",
        "plan": {
            "is_approved": plan.is_approved,
            "status": plan.status,
            "treatment_name": plan.treatment_name,
            "approved_by": plan.approver.full_name if plan.approver else None,
            "approved_at": plan.approved_at.isoformat() if plan.approved_at else None,
            "draft_notes": plan.draft_notes,
            "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
            "updated_by": plan.updater.full_name if plan.updater else None,
        },
        "treatment": {
            "id": treatment.id,
            "treatment_name": treatment.treatment_name,
            "start_date": treatment.start_date.isoformat(),
            "status": treatment.status,
            "source": treatment.source,
            "approved_by": treatment.approver.full_name if treatment.approver else None,
        },
        "forecast": {
            "predicted_treatment_effectiveness": float(treatment.predicted_treatment_effectiveness) if treatment.predicted_treatment_effectiveness is not None else None,
            "predicted_recovery_days": float(treatment.predicted_recovery_days) if treatment.predicted_recovery_days is not None else None,
            "expected_response_category": treatment.expected_response_category.value if treatment.expected_response_category else None,
            "treatment_confidence": float(treatment.treatment_confidence) if treatment.treatment_confidence is not None else None,
            "forecast_generated_at": treatment.forecast_generated_at.isoformat() if treatment.forecast_generated_at else None,
        } if treatment else None
    })
