"""Adiciona campos opcionais de perfil (nascimento, telefone, foto).

Revision ID: 7e2c48d6a913
Revises: d3f91a7c5b2e
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '7e2c48d6a913'
down_revision: Union[str, Sequence[str], None] = 'd3f91a7c5b2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'employees', sa.Column('birth_date', sa.Date(), nullable=True)
    )
    op.add_column('employees', sa.Column('phone', sa.String(), nullable=True))
    op.add_column(
        'employees', sa.Column('photo_path', sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('employees', 'photo_path')
    op.drop_column('employees', 'phone')
    op.drop_column('employees', 'birth_date')
