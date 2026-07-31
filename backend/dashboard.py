from sqlalchemy.orm import Session
from models import User, Patient, Prediction

def get_dashboard_stats(db: Session):

    return {

        "total_users": db.query(User).count(),

        "total_patients": db.query(Patient).count(),

        "total_predictions": db.query(Prediction).count(),

        "high_risk_cases":
            db.query(Prediction)
            .filter(Prediction.risk_level=="High Risk")
            .count(),

        "low_risk_cases":
            db.query(Prediction)
            .filter(Prediction.risk_level=="Low Risk")
            .count()

    }