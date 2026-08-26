from __future__ import annotations

from ..extensions import db
from .enums import AdmissionType, Gender, RiskBand
from .mixins import TimestampMixin


class Patient(TimestampMixin, db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    patient_identifier = db.Column(
        db.String(32),
        nullable=False,
        unique=True,
        index=True,
    )
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    age_at_admission = db.Column(db.Integer, nullable=True)
    gender = db.Column(
        db.Enum(Gender, name="gender", native_enum=False, validate_strings=True),
        nullable=False,
        default=Gender.unknown,
    )
    admission_type = db.Column(
        db.Enum(
            AdmissionType,
            name="admission_type",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=AdmissionType.other,
    )
    primary_diagnosis = db.Column(db.String(255), nullable=False)
    secondary_diagnosis = db.Column(db.String(255), nullable=True)
    admission_date = db.Column(db.Date, nullable=True, index=True)
    discharge_date = db.Column(db.Date, nullable=True)
    time_in_hospital = db.Column(db.Integer, nullable=False, default=0)
    prior_diagnoses_count = db.Column(db.Integer, nullable=False, default=0)
    lab_procedures_count = db.Column(db.Integer, nullable=False, default=0)
    admission_source_id = db.Column(db.Integer, nullable=True)
    discharge_disposition_id = db.Column(db.Integer, nullable=True)
    number_inpatient = db.Column(db.Integer, nullable=True)
    number_emergency = db.Column(db.Integer, nullable=True)
    number_outpatient = db.Column(db.Integer, nullable=True)
    num_procedures = db.Column(db.Integer, nullable=True)
    num_medications = db.Column(db.Integer, nullable=True)
    diag_3 = db.Column(db.String(255), nullable=True)
    a1c_result = db.Column(db.String(16), nullable=True)
    max_glu_serum = db.Column(db.String(16), nullable=True)
    insulin_usage = db.Column(db.String(16), nullable=True)
    medications = db.Column(db.JSON, nullable=False, default=list)
    follow_up_schedule = db.Column(db.Text, nullable=True)
    discharge_plan = db.Column(db.Text, nullable=True)
    risk_band = db.Column(
        db.Enum(RiskBand, name="risk_band", native_enum=False, validate_strings=True),
        nullable=False,
        default=RiskBand.low,
    )
    readmission_probability = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    last_prediction_at = db.Column(db.DateTime(timezone=True), nullable=True)
    assigned_doctor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    assigned_doctor = db.relationship(
        "User",
        back_populates="assigned_patients",
        foreign_keys=[assigned_doctor_id],
        lazy="joined",
    )
    predictions = db.relationship(
        "Prediction",
        back_populates="patient",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    prediction_history = db.relationship(
        "PredictionHistory",
        back_populates="patient",
        lazy="selectin",
    )
    treatment_effectiveness = db.relationship(
        "TreatmentEffectiveness",
        back_populates="patient",
        lazy="selectin",
    )

    __table_args__ = (
        db.CheckConstraint("age_at_admission IS NULL OR age_at_admission >= 0", name="ck_patients_age_nonnegative"),
        db.CheckConstraint("time_in_hospital >= 0", name="ck_patients_time_in_hospital_nonnegative"),
        db.CheckConstraint("prior_diagnoses_count >= 0", name="ck_patients_prior_diagnoses_nonnegative"),
        db.CheckConstraint("lab_procedures_count >= 0", name="ck_patients_lab_procedures_nonnegative"),
        db.CheckConstraint("admission_source_id IS NULL OR admission_source_id >= 0", name="ck_patients_admission_source_nonnegative"),
        db.CheckConstraint("discharge_disposition_id IS NULL OR discharge_disposition_id >= 0", name="ck_patients_discharge_disposition_nonnegative"),
        db.CheckConstraint("number_inpatient IS NULL OR number_inpatient >= 0", name="ck_patients_number_inpatient_nonnegative"),
        db.CheckConstraint("number_emergency IS NULL OR number_emergency >= 0", name="ck_patients_number_emergency_nonnegative"),
        db.CheckConstraint("number_outpatient IS NULL OR number_outpatient >= 0", name="ck_patients_number_outpatient_nonnegative"),
        db.CheckConstraint("num_procedures IS NULL OR num_procedures >= 0", name="ck_patients_num_procedures_nonnegative"),
        db.CheckConstraint("num_medications IS NULL OR num_medications >= 0", name="ck_patients_num_medications_nonnegative"),
        db.CheckConstraint(
            "readmission_probability >= 0 AND readmission_probability <= 100",
            name="ck_patients_readmission_probability_range",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"Patient(id={self.id!r}, patient_identifier={self.patient_identifier!r}, "
            f"primary_diagnosis={self.primary_diagnosis!r})"
        )
