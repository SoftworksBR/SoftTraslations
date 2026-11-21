"""Add stage-specific statuses for assignment acceptance and public stages.

Revision ID: e47c2a15d891
Revises: f3a91b7c2d60
"""

from typing import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = 'e47c2a15d891'
down_revision: str | None = 'f3a91b7c2d60'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column('project_stages', 'status', server_default=None)
    op.execute(
        """
        CREATE TYPE stage_status AS ENUM (
            'no_freelancer',
            'public',
            'ready',
            'in_progress',
            'testing',
            'done'
        )
        """
    )
    op.alter_column(
        'project_stages',
        'status',
        existing_type=postgresql.ENUM(
            'ready',
            'in_progress',
            'testing',
            'done',
            name='project_status',
            create_type=False,
        ),
        type_=postgresql.ENUM(
            'no_freelancer',
            'public',
            'ready',
            'in_progress',
            'testing',
            'done',
            name='stage_status',
            create_type=False,
        ),
        existing_nullable=False,
        postgresql_using='lower(status::text)::stage_status',
    )
    op.alter_column(
        'project_stages',
        'status',
        server_default=sa.text("'no_freelancer'::stage_status"),
    )
    op.execute(
        """
        UPDATE project_stages
        SET status = 'no_freelancer'
        WHERE freelancer_id IS NOT NULL AND status = 'ready'
        """
    )


def downgrade() -> None:
    op.alter_column('project_stages', 'status', server_default=None)
    op.alter_column(
        'project_stages',
        'status',
        existing_type=postgresql.ENUM(
            'no_freelancer',
            'public',
            'ready',
            'in_progress',
            'testing',
            'done',
            name='stage_status',
            create_type=False,
        ),
        type_=postgresql.ENUM(
            'ready',
            'in_progress',
            'testing',
            'done',
            name='project_status',
            create_type=False,
        ),
        existing_nullable=False,
        postgresql_using=(
            "CASE WHEN status::text IN ('no_freelancer', 'public') "
            "THEN 'ready' ELSE status::text END::project_status"
        ),
    )
    op.execute('DROP TYPE stage_status')
