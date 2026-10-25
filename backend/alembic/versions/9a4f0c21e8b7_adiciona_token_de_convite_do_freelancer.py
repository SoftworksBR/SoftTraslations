"""Adiciona token de convite de uso unico para o freelancer.

Revision ID: 9a4f0c21e8b7
Revises: 7e2c48d6a913
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '9a4f0c21e8b7'
down_revision: Union[str, Sequence[str], None] = '7e2c48d6a913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'employees',
        sa.Column('invite_token', sa.String(), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('invite_token_expires_at', sa.DateTime(), nullable=True),
    )
    op.create_unique_constraint(
        'uq_employees_invite_token', 'employees', ['invite_token']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_employees_invite_token', 'employees', type_='unique'
    )
    op.drop_column('employees', 'invite_token_expires_at')
    op.drop_column('employees', 'invite_token')
