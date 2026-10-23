"""Guarda apenas o hash do token de convite, nao o valor puro.

Revision ID: c1d4e7f2a830
Revises: 9a4f0c21e8b7
"""

from typing import Sequence, Union

from alembic import op

revision: str = 'c1d4e7f2a830'
down_revision: Union[str, Sequence[str], None] = '9a4f0c21e8b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        'uq_employees_invite_token', 'employees', type_='unique'
    )
    op.alter_column(
        'employees', 'invite_token', new_column_name='invite_token_hash'
    )
    op.create_unique_constraint(
        'uq_employees_invite_token_hash', 'employees', ['invite_token_hash']
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_employees_invite_token_hash', 'employees', type_='unique'
    )
    op.alter_column(
        'employees', 'invite_token_hash', new_column_name='invite_token'
    )
    op.create_unique_constraint(
        'uq_employees_invite_token', 'employees', ['invite_token']
    )
