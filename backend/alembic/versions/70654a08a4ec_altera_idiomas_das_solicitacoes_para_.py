
"""Altera idiomas das solicitações para chaves estrangeiras.

Revision ID: 70654a08a4ec
Revises: 9bf3de2890be
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '70654a08a4ec'
down_revision: Union[str, Sequence[str], None] = '9bf3de2890be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adiciona as novas colunas.
    op.add_column(
        'requests',
        sa.Column('idioma_origem_id', sa.Integer(), nullable=True),
    )
    op.add_column(
        'requests',
        sa.Column('idioma_destino_id', sa.Integer(), nullable=True),
    )

    # Cria as chaves estrangeiras com nomes explícitos.
    op.create_foreign_key(
        'fk_requests_idioma_origem_id_idiomas',
        'requests',
        'idiomas',
        ['idioma_origem_id'],
        ['id'],
    )
    op.create_foreign_key(
        'fk_requests_idioma_destino_id_idiomas',
        'requests',
        'idiomas',
        ['idioma_destino_id'],
        ['id'],
    )

    # O banco local não possui solicitações, então podemos remover
    # as colunas antigas sem precisar converter registros.
    op.drop_column('requests', 'translate_from')
    op.drop_column('requests', 'translate_to')

    # Após a remoção das colunas antigas, torna os novos campos obrigatórios.
    op.alter_column(
        'requests',
        'idioma_origem_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.alter_column(
        'requests',
        'idioma_destino_id',
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    # Restaura as colunas antigas.
    translations_enum = postgresql.ENUM(
        'PORTUGUESE',
        'ENGLISH',
        'SPANISH',
        'GERMAN',
        'ITALIAN',
        'FRANCH',
        'OTHER',
        name='translations',
        create_type=False,
    )
    translations_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'requests',
        sa.Column('translate_from', translations_enum, nullable=True),
    )
    op.add_column(
        'requests',
        sa.Column('translate_to', translations_enum, nullable=True),
    )

    # Remove as novas chaves estrangeiras e colunas.
    op.drop_constraint(
        'fk_requests_idioma_destino_id_idiomas',
        'requests',
        type_='foreignkey',
    )
    op.drop_constraint(
        'fk_requests_idioma_origem_id_idiomas',
        'requests',
        type_='foreignkey',
    )
    op.drop_column('requests', 'idioma_destino_id')
    op.drop_column('requests', 'idioma_origem_id')

    # O downgrade restaura as colunas antigas vazias, pois não há
    # conversão automática entre IDs e valores do enum.
    op.alter_column(
        'requests',
        'translate_from',
        existing_type=translations_enum,
        nullable=False,
    )
    op.alter_column(
        'requests',
        'translate_to',
        existing_type=translations_enum,
        nullable=False,
    )
