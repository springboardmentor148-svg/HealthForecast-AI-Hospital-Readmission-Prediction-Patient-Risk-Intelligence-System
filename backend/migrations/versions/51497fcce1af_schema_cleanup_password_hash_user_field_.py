"""schema cleanup: password_hash, user field, prediction history

Revision ID: 51497fcce1af
Revises: 4b48ee7e8d73
Create Date: 2026-07-25 01:20:21.814132

"""
from alembic import op
import sqlalchemy as sa
from werkzeug.security import generate_password_hash


# revision identifiers, used by Alembic.
revision = '51497fcce1af'
down_revision = '4b48ee7e8d73'
branch_labels = None
depends_on = None


def upgrade():
    password_hash = generate_password_hash("password123")

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password_hash', sa.String(length=255), nullable=True))
        batch_op.alter_column(
            'organization',
            new_column_name='department',
            existing_type=sa.String(length=255),
            existing_nullable=True,
        )

    op.execute(
        sa.text("UPDATE users SET password_hash = :password_hash").bindparams(password_hash=password_hash)
    )

    with op.batch_alter_table('prediction_history', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_prediction_history_prediction_id'))
        batch_op.create_index(batch_op.f('ix_prediction_history_prediction_id'), ['prediction_id'], unique=False)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'password_hash',
            existing_type=sa.String(length=255),
            nullable=False,
        )


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'department',
            new_column_name='organization',
            existing_type=sa.String(length=255),
            existing_nullable=True,
        )
        batch_op.drop_column('password_hash')

    with op.batch_alter_table('prediction_history', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_prediction_history_prediction_id'))
        batch_op.create_index(batch_op.f('ix_prediction_history_prediction_id'), ['prediction_id'], unique=1)
