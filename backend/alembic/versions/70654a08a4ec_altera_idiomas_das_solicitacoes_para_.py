"""Altera idiomas das solicitações para chaves estrangeiras.

Revision ID: 70654a08a4ec
Revises: 9bf3de2890be
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = '70654a08a4ec'
down_revision: Union[str, Sequence[str], None] = '9bf3de2890be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO idiomas (nome, codigo, ativo)
        VALUES
            ('Português', 'pt', true),
            ('Inglês', 'en', true),
            ('Espanhol', 'es', true),
            ('Alemão', 'de', true),
            ('Italiano', 'it', true),
            ('Francês', 'fr', true),
            ('Outro', 'other', true)
        ON CONFLICT (codigo) DO NOTHING
        """
    )

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

    op.execute(
        """
        UPDATE requests AS request
        SET idioma_origem_id = language.id
        FROM idiomas AS language
        WHERE language.codigo = CASE request.translate_from::text
            WHEN 'PORTUGUESE' THEN 'pt'
            WHEN 'ENGLISH' THEN 'en'
            WHEN 'SPANISH' THEN 'es'
            WHEN 'GERMAN' THEN 'de'
            WHEN 'ITALIAN' THEN 'it'
            WHEN 'FRANCH' THEN 'fr'
            WHEN 'OTHER' THEN 'other'
        END
        """
    )
    op.execute(
        """
        UPDATE requests AS request
        SET idioma_destino_id = language.id
        FROM idiomas AS language
        WHERE language.codigo = CASE request.translate_to::text
            WHEN 'PORTUGUESE' THEN 'pt'
            WHEN 'ENGLISH' THEN 'en'
            WHEN 'SPANISH' THEN 'es'
            WHEN 'GERMAN' THEN 'de'
            WHEN 'ITALIAN' THEN 'it'
            WHEN 'FRANCH' THEN 'fr'
            WHEN 'OTHER' THEN 'other'
        END
        """
    )

    # Os campos legados são removidos depois de converter seus valores.
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

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM requests AS request
                LEFT JOIN idiomas AS source_language
                  ON source_language.id = request.idioma_origem_id
                LEFT JOIN idiomas AS target_language
                  ON target_language.id = request.idioma_destino_id
                WHERE source_language.codigo NOT IN (
                    'pt', 'en', 'es', 'de', 'it', 'fr', 'other'
                )
                   OR target_language.codigo NOT IN (
                    'pt', 'en', 'es', 'de', 'it', 'fr', 'other'
                )
                   OR source_language.id IS NULL
                   OR target_language.id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Language IDs cannot be represented by the legacy enum';
            END IF;
        END
        $$;
        """
    )
    op.execute(
        """
        UPDATE requests AS request
        SET translate_from = CASE source_language.codigo
            WHEN 'pt' THEN 'PORTUGUESE'::translations
            WHEN 'en' THEN 'ENGLISH'::translations
            WHEN 'es' THEN 'SPANISH'::translations
            WHEN 'de' THEN 'GERMAN'::translations
            WHEN 'it' THEN 'ITALIAN'::translations
            WHEN 'fr' THEN 'FRANCH'::translations
            WHEN 'other' THEN 'OTHER'::translations
        END,
        translate_to = CASE target_language.codigo
            WHEN 'pt' THEN 'PORTUGUESE'::translations
            WHEN 'en' THEN 'ENGLISH'::translations
            WHEN 'es' THEN 'SPANISH'::translations
            WHEN 'de' THEN 'GERMAN'::translations
            WHEN 'it' THEN 'ITALIAN'::translations
            WHEN 'fr' THEN 'FRANCH'::translations
            WHEN 'other' THEN 'OTHER'::translations
        END
        FROM idiomas AS source_language, idiomas AS target_language
        WHERE source_language.id = request.idioma_origem_id
          AND target_language.id = request.idioma_destino_id
        """
    )

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
