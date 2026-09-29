"""adiciona tipo do freelancer para employees

Revision ID: 9a21f5c8d3b7
Revises: b608d6cbc575
Create Date: 2026-09-29 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '9a21f5c8d3b7'
down_revision: Union[str, Sequence[str], None] = 'b608d6cbc575'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    freelancer_type = postgresql.ENUM(
        'tradutor',
        'revisor',
        'formatador',
        'interprete',
        name='freelancer_type',
    )
    freelancer_type.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'employees',
        sa.Column('freelancer_type', freelancer_type, nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employees', 'freelancer_type')
    sa.Enum(name='freelancer_type').drop(op.get_bind(), checkfirst=True)
