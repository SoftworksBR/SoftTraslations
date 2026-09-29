"""adiciona id em path_stages para preservar a ordem das etapas na trilha

Revision ID: f4d7c2a891be
Revises: c8b3e6a10d2f
Create Date: 2026-09-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f4d7c2a891be'
down_revision: Union[str, Sequence[str], None] = 'c8b3e6a10d2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # SERIAL preenche automaticamente os IDs das linhas já existentes, na
    # ordem física em que elas já estão gravadas na tabela.
    op.execute('ALTER TABLE path_stages ADD COLUMN id SERIAL')

    op.drop_constraint('path_stages_pkey', 'path_stages', type_='primary')
    op.create_primary_key('path_stages_pkey', 'path_stages', ['id'])
    op.create_unique_constraint(
        'uq_path_stages_path_stage', 'path_stages', ['path_id', 'stage_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'uq_path_stages_path_stage', 'path_stages', type_='unique'
    )
    op.drop_constraint('path_stages_pkey', 'path_stages', type_='primary')
    op.create_primary_key(
        'path_stages_pkey', 'path_stages', ['path_id', 'stage_id']
    )
    op.drop_column('path_stages', 'id')
