"""orcamentos, ajustes em solicitacoes e vinculo com projetos

Revision ID: d3f1a7c2b9e4
Revises: a2016a1cf29e
Create Date: 2026-10-19 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd3f1a7c2b9e4'
down_revision: str | Sequence[str] | None = 'a2016a1cf29e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


request_status = postgresql.ENUM(
    'PENDING', 'QUOTED', 'REJECTED', name='request_status', create_type=False
)
quote_status = postgresql.ENUM(
    'IN_REVIEW', 'APPROVED', 'REJECTED', name='quote_status', create_type=False
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    request_status.create(bind, checkfirst=True)
    quote_status.create(bind, checkfirst=True)

    # --- requests -------------------------------------------------------
    op.add_column(
        'requests',
        sa.Column('service_id', sa.Integer(), nullable=True),
    )
    op.add_column(
        'requests',
        sa.Column('word_count', sa.Integer(), nullable=True),
    )
    op.add_column(
        'requests',
        sa.Column('public_token', sa.String(), nullable=True),
    )
    op.add_column(
        'requests',
        sa.Column(
            'status',
            request_status,
            nullable=False,
            server_default='PENDING',
        ),
    )
    op.add_column(
        'requests',
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
    )
    # Solicitações antigas ganham um token aleatório.
    op.execute(
        'UPDATE requests SET public_token = '
        'md5(random()::text || clock_timestamp()::text || id::text) '
        'WHERE public_token IS NULL'
    )
    op.alter_column('requests', 'public_token', nullable=False)
    op.create_index(
        op.f('ix_requests_public_token'),
        'requests',
        ['public_token'],
        unique=True,
    )
    op.create_foreign_key(
        'fk_requests_service_id_services',
        'requests',
        'services',
        ['service_id'],
        ['id'],
    )
    # Quem faz a solicitação é o cliente; o atendente é atribuído depois.
    op.alter_column(
        'requests',
        'employee_id',
        existing_type=sa.Integer(),
        nullable=True,
    )

    # --- request_files --------------------------------------------------
    op.add_column(
        'request_files',
        sa.Column(
            'original_name',
            sa.String(),
            nullable=False,
            server_default='arquivo',
        ),
    )
    op.alter_column('request_files', 'original_name', server_default=None)

    # --- quotes ---------------------------------------------------------
    op.create_table(
        'quotes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Numeric(12, 2), nullable=False),
        sa.Column('deadline', sa.Date(), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('observations', sa.String(), nullable=True),
        sa.Column(
            'status',
            quote_status,
            nullable=False,
            server_default='IN_REVIEW',
        ),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['request_id'], ['requests.id']),
        sa.ForeignKeyConstraint(['created_by_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['approved_by_id'], ['employees.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id'),
    )

    # --- projects -------------------------------------------------------
    op.add_column(
        'projects',
        sa.Column('quote_id', sa.Integer(), nullable=True),
    )
    op.create_unique_constraint(
        'uq_projects_quote_id', 'projects', ['quote_id']
    )
    op.create_foreign_key(
        'fk_projects_quote_id_quotes',
        'projects',
        'quotes',
        ['quote_id'],
        ['id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'fk_projects_quote_id_quotes', 'projects', type_='foreignkey'
    )
    op.drop_constraint('uq_projects_quote_id', 'projects', type_='unique')
    op.drop_column('projects', 'quote_id')

    op.drop_table('quotes')

    op.drop_column('request_files', 'original_name')

    op.execute('DELETE FROM requests WHERE employee_id IS NULL')
    op.alter_column(
        'requests',
        'employee_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.drop_constraint(
        'fk_requests_service_id_services', 'requests', type_='foreignkey'
    )
    op.drop_index(op.f('ix_requests_public_token'), table_name='requests')
    op.drop_column('requests', 'created_at')
    op.drop_column('requests', 'status')
    op.drop_column('requests', 'public_token')
    op.drop_column('requests', 'word_count')
    op.drop_column('requests', 'service_id')

    bind = op.get_bind()
    quote_status.drop(bind, checkfirst=True)
    request_status.drop(bind, checkfirst=True)
