"""torna freelancer_id opcional e adiciona freelancer_type em stages

Revision ID: c8b3e6a10d2f
Revises: 9a21f5c8d3b7
Create Date: 2026-09-29 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c8b3e6a10d2f'
down_revision: Union[str, Sequence[str], None] = '9a21f5c8d3b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# O tipo 'freelancer_type' já existe no banco (criado na migration
# 9a21f5c8d3b7, para employees.freelancer_type). Aqui só reaproveitamos
# o mesmo tipo para a coluna nova em stages: create_type=False evita que
# o Alembic tente criar/derrubar esse tipo automaticamente, já que ele
# é compartilhado entre as duas tabelas.
freelancer_type_enum = postgresql.ENUM(
    'tradutor',
    'revisor',
    'formatador',
    'interprete',
    name='freelancer_type',
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'stages',
        'freelancer_id',
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.add_column(
        'stages',
        sa.Column('freelancer_type', freelancer_type_enum, nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('stages', 'freelancer_type')
    op.alter_column(
        'stages',
        'freelancer_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
