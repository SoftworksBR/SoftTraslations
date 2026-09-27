"""renames empresa/departamento/contato tables and columns to english

Revision ID: d8f4b2c17a91
Revises: c5e1a7d93f42
Create Date: 2026-09-27 20:40:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd8f4b2c17a91'
down_revision: Union[str, Sequence[str], None] = 'c5e1a7d93f42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.rename_table('empresas', 'companies')
    op.alter_column('companies', 'razao_social', new_column_name='name')
    op.alter_column('companies', 'criada_em', new_column_name='created_at')

    op.rename_table('departamentos', 'departments')
    op.alter_column('departments', 'nome', new_column_name='name')
    op.alter_column(
        'departments', 'empresa_id', new_column_name='company_id'
    )

    op.rename_table('contatos', 'contacts')
    op.alter_column('contacts', 'nome', new_column_name='name')
    op.alter_column('contacts', 'telefone', new_column_name='phone')
    op.alter_column('contacts', 'cargo', new_column_name='job_title')
    op.alter_column(
        'contacts', 'departamento_id', new_column_name='department_id'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'contacts', 'department_id', new_column_name='departamento_id'
    )
    op.alter_column('contacts', 'job_title', new_column_name='cargo')
    op.alter_column('contacts', 'phone', new_column_name='telefone')
    op.alter_column('contacts', 'name', new_column_name='nome')
    op.rename_table('contacts', 'contatos')

    op.alter_column(
        'departments', 'company_id', new_column_name='empresa_id'
    )
    op.alter_column('departments', 'name', new_column_name='nome')
    op.rename_table('departments', 'departamentos')

    op.alter_column('companies', 'created_at', new_column_name='criada_em')
    op.alter_column('companies', 'name', new_column_name='razao_social')
    op.rename_table('companies', 'empresas')
