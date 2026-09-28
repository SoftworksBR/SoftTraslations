"""cria empresas, departamentos e contatos

Revision ID: c5e1a7d93f42
Revises: bc003363b4ba
Create Date: 2026-09-25 20:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c5e1a7d93f42'
down_revision: Union[str, Sequence[str], None] = 'bc003363b4ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'empresas',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('razao_social', sa.String(), nullable=False),
        sa.Column('cnpj', sa.String(), nullable=False),
        sa.Column(
            'criada_em',
            sa.DateTime(),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cnpj'),
    )
    op.create_table(
        'departamentos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('empresa_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['empresa_id'], ['empresas.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'contatos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('telefone', sa.String(), nullable=False),
        sa.Column('cargo', sa.String(), nullable=True),
        sa.Column('departamento_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['departamento_id'], ['departamentos.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('contatos')
    op.drop_table('departamentos')
    op.drop_table('empresas')
