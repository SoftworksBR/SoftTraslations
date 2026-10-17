
"""Rename translation tables and columns to English."""

from alembic import op

revision = 'a2016a1cf29e'
down_revision = '70654a08a4ec'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename tables first. PostgreSQL preserves existing rows and relationships.
    op.rename_table('idiomas', 'languages')
    op.rename_table('servicos', 'services')
    op.rename_table('precos_traducao', 'translation_prices')
    # Rename sequences used by auto-incrementing primary keys.
    op.execute(
        'ALTER SEQUENCE idiomas_id_seq RENAME TO languages_id_seq'
    )
    op.execute(
        'ALTER SEQUENCE servicos_id_seq RENAME TO services_id_seq'
    )
    op.execute(
        'ALTER SEQUENCE precos_traducao_id_seq '
        'RENAME TO translation_prices_id_seq'
    )

    # Rename language columns.
    op.alter_column('languages', 'nome', new_column_name='name')
    op.alter_column('languages', 'codigo', new_column_name='code')
    op.alter_column('languages', 'ativo', new_column_name='is_active')

    # The language code is optional because it is not supplied by the frontend.
    op.alter_column('languages', 'code', nullable=True)

    # Rename service columns.
    op.alter_column('services', 'nome', new_column_name='name')
    op.alter_column('services', 'descricao', new_column_name='description')
    op.alter_column('services', 'ativo', new_column_name='is_active')
    op.alter_column('services', 'criado_em', new_column_name='created_at')

    # Rename translation price columns.
    op.alter_column(
        'translation_prices', 'servico_id', new_column_name='service_id'
    )
    op.alter_column(
        'translation_prices',
        'idioma_origem_id',
        new_column_name='source_language_id',
    )
    op.alter_column(
        'translation_prices',
        'idioma_destino_id',
        new_column_name='target_language_id',
    )
    op.alter_column(
        'translation_prices',
        'preco_por_palavra',
        new_column_name='price_per_word',
    )
    op.alter_column('translation_prices', 'ativo', new_column_name='is_active')

    # Rename request columns.
    op.alter_column(
        'requests', 'idioma_origem_id', new_column_name='source_language_id'
    )
    op.alter_column(
        'requests', 'idioma_destino_id', new_column_name='target_language_id'
    )

    # Rename existing constraints to follow the English naming convention.
    op.execute(
        'ALTER TABLE languages '
        'RENAME CONSTRAINT idiomas_pkey TO languages_pkey'
    )
    op.execute(
        'ALTER TABLE languages '
        'RENAME CONSTRAINT idiomas_codigo_key TO languages_code_key'
    )
    op.execute(
        'ALTER TABLE services '
        'RENAME CONSTRAINT servicos_pkey TO services_pkey'
    )
    op.execute(
        'ALTER TABLE services '
        'RENAME CONSTRAINT servicos_nome_key TO services_name_key'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT precos_traducao_pkey TO translation_prices_pkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT uq_preco_servico_idiomas '
        'TO uq_translation_price_languages'
    )

    # Rename foreign-key constraints.
    op.execute(
        'ALTER TABLE requests '
        'RENAME CONSTRAINT fk_requests_idioma_origem_id_idiomas '
        'TO fk_requests_source_language_id_languages'
    )
    op.execute(
        'ALTER TABLE requests '
        'RENAME CONSTRAINT fk_requests_idioma_destino_id_idiomas '
        'TO fk_requests_target_language_id_languages'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT precos_traducao_servico_id_fkey '
        'TO translation_prices_service_id_fkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT precos_traducao_idioma_origem_id_fkey '
        'TO translation_prices_source_language_id_fkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT precos_traducao_idioma_destino_id_fkey '
        'TO translation_prices_target_language_id_fkey'
    )


def downgrade() -> None:
    # Restore the original constraint names.
    op.execute(
        'ALTER TABLE requests '
        'RENAME CONSTRAINT fk_requests_source_language_id_languages '
        'TO fk_requests_idioma_origem_id_idiomas'
    )
    op.execute(
        'ALTER TABLE requests '
        'RENAME CONSTRAINT fk_requests_target_language_id_languages '
        'TO fk_requests_idioma_destino_id_idiomas'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT translation_prices_service_id_fkey '
        'TO precos_traducao_servico_id_fkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT translation_prices_source_language_id_fkey '
        'TO precos_traducao_idioma_origem_id_fkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT translation_prices_target_language_id_fkey '
        'TO precos_traducao_idioma_destino_id_fkey'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT uq_translation_price_languages '
        'TO uq_preco_servico_idiomas'
    )
    op.execute(
        'ALTER TABLE translation_prices '
        'RENAME CONSTRAINT translation_prices_pkey TO precos_traducao_pkey'
    )
    op.execute(
        'ALTER TABLE services '
        'RENAME CONSTRAINT services_name_key TO servicos_nome_key'
    )
    op.execute(
        'ALTER TABLE services '
        'RENAME CONSTRAINT services_pkey TO servicos_pkey'
    )
    op.execute(
        'ALTER TABLE languages '
        'RENAME CONSTRAINT languages_code_key TO idiomas_codigo_key'
    )
    op.execute(
        'ALTER TABLE languages '
        'RENAME CONSTRAINT languages_pkey TO idiomas_pkey'
    )

    # Restore request columns.
    op.alter_column(
        'requests', 'target_language_id', new_column_name='idioma_destino_id'
    )
    op.alter_column(
        'requests', 'source_language_id', new_column_name='idioma_origem_id'
    )

    # Restore translation price columns.
    op.alter_column('translation_prices', 'is_active', new_column_name='ativo')
    op.alter_column(
        'translation_prices', 'price_per_word', new_column_name='preco_por_palavra'
    )
    op.alter_column(
        'translation_prices',
        'target_language_id',
        new_column_name='idioma_destino_id',
    )
    op.alter_column(
        'translation_prices',
        'source_language_id',
        new_column_name='idioma_origem_id',
    )
    op.alter_column(
        'translation_prices', 'service_id', new_column_name='servico_id'
    )

    # Restore service columns.
    op.alter_column('services', 'created_at', new_column_name='criado_em')
    op.alter_column('services', 'is_active', new_column_name='ativo')
    op.alter_column('services', 'description', new_column_name='descricao')
    op.alter_column('services', 'name', new_column_name='nome')

    # Restore language columns and required code constraint.
    op.alter_column('languages', 'code', nullable=False)
    op.alter_column('languages', 'is_active', new_column_name='ativo')
    op.alter_column('languages', 'code', new_column_name='codigo')
    op.alter_column('languages', 'name', new_column_name='nome')

    # Restore the original sequence names.
    op.execute(
        'ALTER SEQUENCE languages_id_seq RENAME TO idiomas_id_seq'
    )
    op.execute(
        'ALTER SEQUENCE services_id_seq RENAME TO servicos_id_seq'
    )
    op.execute(
        'ALTER SEQUENCE translation_prices_id_seq '
        'RENAME TO precos_traducao_id_seq'
    )
    # Restore original table names.
    op.rename_table('translation_prices', 'precos_traducao')
    op.rename_table('services', 'servicos')
    op.rename_table('languages', 'idiomas')
