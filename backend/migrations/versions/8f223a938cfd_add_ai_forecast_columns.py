"""add ai forecast columns

Revision ID: 8f223a938cfd
Revises: f1293a938cfd
Create Date: 2026-08-05 02:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8f223a938cfd'
down_revision = 'f1293a938cfd'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('treatment_effectiveness', sa.Column('predicted_treatment_effectiveness', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('treatment_effectiveness', sa.Column('predicted_recovery_days', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('treatment_effectiveness', sa.Column('expected_response_category', sa.Enum('poor', 'fair', 'good', 'excellent', name='expected_response_category_enum', native_enum=False, validate_strings=True), nullable=True))
    op.add_column('treatment_effectiveness', sa.Column('treatment_confidence', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('treatment_effectiveness', sa.Column('forecast_generated_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('treatment_effectiveness', 'forecast_generated_at')
    op.drop_column('treatment_effectiveness', 'treatment_confidence')
    op.drop_column('treatment_effectiveness', 'expected_response_category')
    op.drop_column('treatment_effectiveness', 'predicted_recovery_days')
    op.drop_column('treatment_effectiveness', 'predicted_treatment_effectiveness')
