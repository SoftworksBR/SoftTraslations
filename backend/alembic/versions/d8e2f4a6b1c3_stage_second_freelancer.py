"""Add an optional second freelancer to project stages.

Revision ID: d8e2f4a6b1c3
Revises: b7d3e5a1c9f2
"""

from typing import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = 'd8e2f4a6b1c3'
down_revision: str | None = 'b7d3e5a1c9f2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

COLLABORATION_STATUS = postgresql.ENUM(
    'invited', 'accepted', name='stage_collaboration_status'
)


def upgrade() -> None:
    COLLABORATION_STATUS.create(op.get_bind())
    op.add_column(
        'project_stages',
        sa.Column('second_freelancer_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_project_stages_second_freelancer',
        'project_stages',
        'employees',
        ['second_freelancer_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.add_column(
        'project_stages',
        sa.Column(
            'second_status',
            postgresql.ENUM(
                name='stage_collaboration_status', create_type=False
            ),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column('project_stages', 'second_status')
    op.drop_constraint(
        'fk_project_stages_second_freelancer',
        'project_stages',
        type_='foreignkey',
    )
    op.drop_column('project_stages', 'second_freelancer_id')
    COLLABORATION_STATUS.drop(op.get_bind())
