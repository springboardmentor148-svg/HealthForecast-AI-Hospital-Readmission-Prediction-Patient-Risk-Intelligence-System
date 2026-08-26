"""add_notifications_table

Revision ID: f1293a938cfd
Revises: c9101b819b63
Create Date: 2026-08-05 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1293a938cfd'
down_revision = 'c9101b819b63'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('notification_type', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('read_status', sa.Boolean(), nullable=False),
    sa.Column('related_entity', sa.String(length=100), nullable=True),
    sa.Column('related_entity_id', sa.String(length=64), nullable=True),
    sa.Column('recipient_user_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notifications_created_at'), ['created_at'], unique=False)
        batch_op.create_index(batch_op.f('ix_notifications_recipient_user_id'), ['recipient_user_id'], unique=False)


def downgrade():
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_notifications_recipient_user_id'))
        batch_op.drop_index(batch_op.f('ix_notifications_created_at'))

    op.drop_table('notifications')
