"""Create freelancer source and target languages.

Revision ID: b7d3e5a1c9f2
Revises: a6c4e92f1b73
"""

from typing import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'b7d3e5a1c9f2'
down_revision: str | None = 'a6c4e92f1b73'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LANGUAGE_TABLES = (
    'freelancer_source_languages',
    'freelancer_target_languages',
)


def upgrade() -> None:
    for table_name in LANGUAGE_TABLES:
        op.create_table(
            table_name,
            sa.Column(
                'employee_id',
                sa.Integer(),
                sa.ForeignKey(
                    'freelancer_profiles.employee_id', ondelete='CASCADE'
                ),
                primary_key=True,
            ),
            sa.Column(
                'language_id',
                sa.Integer(),
                sa.ForeignKey('languages.id'),
                primary_key=True,
            ),
        )


def downgrade() -> None:
    for table_name in reversed(LANGUAGE_TABLES):
        op.drop_table(table_name)
