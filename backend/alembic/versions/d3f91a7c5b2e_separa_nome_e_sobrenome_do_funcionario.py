"""Separa nome e sobrenome do funcionário, substituindo username.

Revision ID: d3f91a7c5b2e
Revises: d3f1a7c2b9e4
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'd3f91a7c5b2e'
down_revision: Union[str, Sequence[str], None] = 'd3f1a7c2b9e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'employees', sa.Column('first_name', sa.String(), nullable=True)
    )
    op.add_column(
        'employees', sa.Column('last_name', sa.String(), nullable=True)
    )

    # Dado existente preservado: separa pelo primeiro espaço. Sem espaço,
    # o nome inteiro vira first_name e last_name fica vazio (não nulo).
    op.execute(
        """
        UPDATE employees SET
            first_name = split_part(username, ' ', 1),
            last_name = CASE
                WHEN position(' ' in username) = 0 THEN ''
                ELSE substring(username from position(' ' in username) + 1)
            END
        """
    )

    op.alter_column('employees', 'first_name', nullable=False)
    op.alter_column(
        'employees', 'last_name', nullable=False, server_default=''
    )
    op.alter_column('employees', 'last_name', server_default=None)

    op.drop_column('employees', 'username')


def downgrade() -> None:
    op.add_column(
        'employees', sa.Column('username', sa.String(), nullable=True)
    )

    op.execute(
        """
        UPDATE employees SET
            username = trim(trailing ' ' from (first_name || ' ' || last_name))
        """
    )

    op.alter_column('employees', 'username', nullable=False)

    op.drop_column('employees', 'last_name')
    op.drop_column('employees', 'first_name')
