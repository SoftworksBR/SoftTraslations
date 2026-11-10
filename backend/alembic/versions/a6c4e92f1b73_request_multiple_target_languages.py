"""Allow requests to have multiple target languages.

Revision ID: a6c4e92f1b73
Revises: e47c2a15d891
"""

from typing import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'a6c4e92f1b73'
down_revision: str | None = 'e47c2a15d891'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'request_target_languages',
        sa.Column(
            'request_id',
            sa.Integer(),
            sa.ForeignKey('requests.id', ondelete='CASCADE'),
            primary_key=True,
        ),
        sa.Column(
            'language_id',
            sa.Integer(),
            sa.ForeignKey('languages.id'),
            primary_key=True,
        ),
    )
    op.execute(
        """
        INSERT INTO request_target_languages (request_id, language_id)
        SELECT id, target_language_id
        FROM requests
        """
    )
    op.drop_column('requests', 'target_language_id')


def downgrade() -> None:
    op.add_column(
        'requests',
        sa.Column('target_language_id', sa.Integer(), nullable=True),
    )
    op.execute(
        """
        UPDATE requests
        SET target_language_id = (
            SELECT MIN(language_id)
            FROM request_target_languages
            WHERE request_id = requests.id
        )
        """
    )
    op.alter_column(
        'requests',
        'target_language_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.drop_table('request_target_languages')
    op.create_foreign_key(
        'requests_target_language_id_fkey',
        'requests',
        'languages',
        ['target_language_id'],
        ['id'],
    )
