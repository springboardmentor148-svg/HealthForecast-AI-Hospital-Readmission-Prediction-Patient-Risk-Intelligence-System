from sqlalchemy.orm import Session
from models import Prediction


def save_prediction(
    db: Session,
    patient_id: int,
    predicted_class: int,
    probability: float,
    confidence: str,
    recommendation: str,
    predicted_by: int,
    risk_level: str
):

    prediction = Prediction(
        patient_id=patient_id,
        predicted_class=predicted_class,
        probability=probability,
        confidence=confidence,
        recommendation=recommendation,
        predicted_by=predicted_by,
        risk_level=risk_level
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return prediction


def get_all_predictions(db: Session):
    return db.query(Prediction).all()


def get_prediction_by_id(db: Session, prediction_id: int):
    return db.query(Prediction).filter(
        Prediction.prediction_id == prediction_id
    ).first()


def delete_prediction(db: Session, prediction_id: int):

    prediction = get_prediction_by_id(
        db,
        prediction_id
    )

    if prediction:

        db.delete(prediction)

        db.commit()

    return prediction