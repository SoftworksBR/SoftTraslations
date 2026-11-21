"""Allow quote decisions made by clients."""

from typing import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'c28f41a97e63'
down_revision: str | None = '1a2ad26eb7eb'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        'ck_quotes_approval_consistency', 'quotes', type_='check'
    )
    op.create_check_constraint(
        'ck_quotes_approval_consistency',
        'quotes',
        "(status = 'in_review' AND approved_by_id IS NULL "
        'AND approved_at IS NULL) OR '
        "(status IN ('approved', 'rejected') AND approved_at IS NOT NULL)",
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "UPDATE quotes SET approved_by_id = created_by_id "
            "WHERE status IN ('approved', 'rejected') "
            'AND approved_by_id IS NULL'
        )
    )
    op.drop_constraint(
        'ck_quotes_approval_consistency', 'quotes', type_='check'
    )
    op.create_check_constraint(
        'ck_quotes_approval_consistency',
        'quotes',
        "(status = 'in_review' AND approved_by_id IS NULL "
        'AND approved_at IS NULL) OR '
        "(status IN ('approved', 'rejected') AND "
        'approved_by_id IS NOT NULL AND approved_at IS NOT NULL)',
    )
