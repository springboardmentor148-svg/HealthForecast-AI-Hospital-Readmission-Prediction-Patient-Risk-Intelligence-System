"""initial tables: patients, audit_logs

Revision ID: 0001
Revises:
Create Date: 2026-08-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("medical_record_number", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("age", sa.Text(), nullable=False),
        sa.Column("gender", sa.Text(), nullable=False),
        sa.Column("race", sa.Text(), nullable=False),
        sa.Column("admission_type", sa.Text(), nullable=False),
        sa.Column("discharge_disposition", sa.Text(), nullable=False),
        sa.Column("admission_source", sa.Text(), nullable=False),
        sa.Column("time_in_hospital", sa.Integer(), nullable=False),
        sa.Column("num_lab_procedures", sa.Integer(), nullable=False),
        sa.Column("num_procedures", sa.Integer(), nullable=False),
        sa.Column("num_medications", sa.Integer(), nullable=False),
        sa.Column("num_outpatient_visits", sa.Integer(), nullable=False),
        sa.Column("num_inpatient_visits", sa.Integer(), nullable=False),
        sa.Column("num_emergency_visits", sa.Integer(), nullable=False),
        sa.Column("primary_diagnosis", sa.Text(), nullable=False),
        sa.Column("secondary_diagnosis1", sa.Text(), nullable=True),
        sa.Column("secondary_diagnosis2", sa.Text(), nullable=True),
        sa.Column("glucose_test", sa.Text(), nullable=False),
        sa.Column("a1c_result", sa.Text(), nullable=False),
        sa.Column("medications", postgresql.JSONB(), nullable=False),
        sa.Column("department", sa.Text(), nullable=False),
        sa.Column("assigned_doctor", sa.Text(), nullable=False),
        sa.Column("assigned_doctor_id", sa.Text(), nullable=False),
        sa.Column("admission_date", sa.Date(), nullable=False),
        sa.Column("discharge_date", sa.Date(), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=False),
        sa.Column("risk_tier", sa.Text(), nullable=False),
        sa.Column("readmission_likelihood", sa.Text(), nullable=False),
        sa.Column("readmission_probability", sa.Float(), nullable=False),
        sa.Column("risk_factors", postgresql.JSONB(), nullable=False),
        sa.Column("care_recommendations", postgresql.JSONB(), nullable=False),
        sa.Column("discharge_readiness_score", sa.Float(), nullable=False),
        sa.Column("last_assessment_date", sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("medical_record_number", name="uq_patients_medical_record_number"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.Text(), nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("user_name", sa.Text(), nullable=False),
        sa.Column("user_role", sa.Text(), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("target_patient_id", sa.Text(), nullable=True),
        sa.Column("details", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("patients")
