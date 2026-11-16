"""Store the manager's reason when a stage delivery is rejected."""

from typing import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = '20261116_rejection_comment'
down_revision: str | None = '20261110_invoice'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'project_stages',
        sa.Column('rejection_comment', sa.String(length=1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('project_stages', 'rejection_comment')
