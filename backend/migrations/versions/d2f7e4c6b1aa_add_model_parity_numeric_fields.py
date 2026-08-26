"""add model parity numeric fields

Revision ID: d2f7e4c6b1aa
Revises: 2b6c0f7f6d10
Create Date: 2026-08-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d2f7e4c6b1aa"
down_revision = "2b6c0f7f6d10"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.add_column(sa.Column("admission_source_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("discharge_disposition_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("num_medications", sa.Integer(), nullable=True))

        batch_op.create_check_constraint(
            "ck_patients_admission_source_nonnegative",
            "admission_source_id IS NULL OR admission_source_id >= 0",
        )
        batch_op.create_check_constraint(
            "ck_patients_discharge_disposition_nonnegative",
            "discharge_disposition_id IS NULL OR discharge_disposition_id >= 0",
        )
        batch_op.create_check_constraint(
            "ck_patients_num_medications_nonnegative",
            "num_medications IS NULL OR num_medications >= 0",
        )


def downgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.drop_constraint("ck_patients_num_medications_nonnegative", type_="check")
        batch_op.drop_constraint("ck_patients_discharge_disposition_nonnegative", type_="check")
        batch_op.drop_constraint("ck_patients_admission_source_nonnegative", type_="check")
        batch_op.drop_column("num_medications")
        batch_op.drop_column("discharge_disposition_id")
        batch_op.drop_column("admission_source_id")
