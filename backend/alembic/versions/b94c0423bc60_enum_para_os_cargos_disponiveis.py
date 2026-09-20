"""enum para os cargos disponiveis

Revision ID: b94c0423bc60
Revises: 34538850aabc
Create Date: 2026-09-19 07:47:19.478780

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b94c0423bc60'
down_revision: Union[str, Sequence[str], None] = '34538850aabc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    roles_enum = sa.Enum(
        'ADMIN',
        'PROJETOS',
        'ATENDIMENTO',
        'FREELANCER',
        'ORCAMENTO',
        name='roles'
    )

    roles_enum.create(op.get_bind(), checkfirst=True)

    op.alter_column(
        'employees',
        'role',
        existing_type=sa.VARCHAR(),
        type_=roles_enum,
        existing_nullable=False,
        postgresql_using='role::text::roles'
    )

def downgrade() -> None:
    roles_enum = sa.Enum(
        'ADMIN',
        'PROJETOS',
        'ATENDIMENTO',
        'FREELANCER',
        'ORCAMENTO',
        name='roles'
    )

    op.alter_column(
        'employees',
        'role',
        existing_type=roles_enum,
        type_=sa.VARCHAR(),
        existing_nullable=False
    )

    roles_enum.drop(op.get_bind(), checkfirst=True)