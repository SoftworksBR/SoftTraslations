"""Create payment invoices."""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '20261110_invoice'
down_revision: str | None = 'f3a91b7c2d60'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'payment_invoices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('invoice_number', sa.String(length=30), nullable=False),
        sa.Column('freelancer_id', sa.Integer(), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('issued_on', sa.Date(), nullable=False),
        sa.Column('emailed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['freelancer_id'], ['employees.id'], ondelete='RESTRICT'
        ),
        sa.ForeignKeyConstraint(
            ['created_by_id'], ['employees.id'], ondelete='RESTRICT'
        ),
        sa.ForeignKeyConstraint(
            ['project_id'], ['projects.id'], ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['stage_id'], ['project_stages.id'], ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number'),
    )


def downgrade() -> None:
    op.drop_table('payment_invoices')
