"""
Clinical Decision Support Service

Generates rule-based care recommendations, follow-up planning, risk
mitigation suggestions, and discharge support notes based on a patient's
prediction result and key clinical factors.

This is NOT a diagnostic tool — it produces suggested talking points for
the doctor to review, not medical advice or an automated decision.
"""


def generate_recommendations(patient_data: dict, result: dict) -> dict:

    is_high_risk = result["prediction"] == 1

    care_recommendations = []
    follow_up_planning = []
    risk_mitigation = []
    discharge_support = []

    # ---------- Care Recommendations ----------
    if is_high_risk:
        care_recommendations.append(
            "Increase monitoring frequency for blood glucose and vital signs."
        )
        if patient_data.get("num_medications", 0) >= 15:
            care_recommendations.append(
                "High medication count detected — consider a pharmacist-led "
                "medication review to reduce polypharmacy risk."
            )
    else:
        care_recommendations.append(
            "Continue current care plan with standard monitoring."
        )

    # ---------- Follow-up Planning ----------
    if is_high_risk:
        follow_up_planning.append(
            "Schedule a follow-up appointment within 7 days of discharge."
        )
        follow_up_planning.append(
            "Consider a follow-up phone check-in within 48–72 hours."
        )
    else:
        follow_up_planning.append(
            "Schedule routine follow-up within 30 days."
        )

    # ---------- Risk Mitigation ----------
    if patient_data.get("number_inpatient", 0) >= 2:
        risk_mitigation.append(
            "Multiple prior inpatient admissions — consider enrollment in "
            "a care/case management program."
        )

    if patient_data.get("number_emergency", 0) >= 1:
        risk_mitigation.append(
            "Prior emergency visits noted — assess for gaps in outpatient "
            "access or medication adherence."
        )

    if patient_data.get("time_in_hospital", 0) >= 7:
        risk_mitigation.append(
            "Extended hospital stay indicates a complex case — evaluate "
            "need for home health services post-discharge."
        )

    if not risk_mitigation:
        risk_mitigation.append(
            "No elevated risk factors identified from admission history."
        )

    # ---------- Discharge Support ----------
    if is_high_risk:
        discharge_support.append(
            "Provide detailed written discharge instructions and confirm "
            "patient/caregiver understanding before leaving (teach-back method)."
        )
        discharge_support.append(
            "Ensure medication reconciliation is completed and a 30-day "
            "supply is arranged before discharge."
        )
    else:
        discharge_support.append(
            "Standard discharge instructions and medication list."
        )

    return {
        "care_recommendations": care_recommendations,
        "follow_up_planning": follow_up_planning,
        "risk_mitigation": risk_mitigation,
        "discharge_support": discharge_support,
    }