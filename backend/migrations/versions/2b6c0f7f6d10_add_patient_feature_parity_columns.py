"""add patient feature parity columns

Revision ID: 2b6c0f7f6d10
Revises: f1293a938cfd
Create Date: 2026-08-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "2b6c0f7f6d10"
down_revision = "8f223a938cfd"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.add_column(sa.Column("number_inpatient", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("number_emergency", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("number_outpatient", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("num_procedures", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("diag_3", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("a1c_result", sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column("max_glu_serum", sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column("insulin_usage", sa.String(length=16), nullable=True))

        batch_op.create_check_constraint(
            "ck_patients_number_inpatient_nonnegative",
            "number_inpatient IS NULL OR number_inpatient >= 0",
        )
        batch_op.create_check_constraint(
            "ck_patients_number_emergency_nonnegative",
            "number_emergency IS NULL OR number_emergency >= 0",
        )
        batch_op.create_check_constraint(
            "ck_patients_number_outpatient_nonnegative",
            "number_outpatient IS NULL OR number_outpatient >= 0",
        )
        batch_op.create_check_constraint(
            "ck_patients_num_procedures_nonnegative",
            "num_procedures IS NULL OR num_procedures >= 0",
        )


def downgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.drop_constraint("ck_patients_num_procedures_nonnegative", type_="check")
        batch_op.drop_constraint("ck_patients_number_outpatient_nonnegative", type_="check")
        batch_op.drop_constraint("ck_patients_number_emergency_nonnegative", type_="check")
        batch_op.drop_constraint("ck_patients_number_inpatient_nonnegative", type_="check")
        batch_op.drop_column("insulin_usage")
        batch_op.drop_column("max_glu_serum")
        batch_op.drop_column("a1c_result")
        batch_op.drop_column("diag_3")
        batch_op.drop_column("num_procedures")
        batch_op.drop_column("number_outpatient")
        batch_op.drop_column("number_emergency")
        batch_op.drop_column("number_inpatient")
