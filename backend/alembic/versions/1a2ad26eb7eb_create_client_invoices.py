
"""Create client invoices."""

from typing import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = '1a2ad26eb7eb'
down_revision: str | None = '20261110_invoice'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'client_invoices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('invoice_number', sa.String(length=30), nullable=False),
        sa.Column('quote_id', sa.Integer(), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('client_name', sa.String(length=255), nullable=False),
        sa.Column('client_email', sa.String(length=255), nullable=False),
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
            ['created_by_id'], ['employees.id'], ondelete='RESTRICT'
        ),
        sa.ForeignKeyConstraint(
            ['quote_id'], ['quotes.id'], ondelete='RESTRICT'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number'),
        sa.UniqueConstraint('quote_id'),
    )


def downgrade() -> None:
    op.drop_table('client_invoices')
