"""Adiciona o valor under_review ao enum employee_status.

Revision ID: 4b6d9f1c7a25
Revises: c1d4e7f2a830
"""

from typing import Sequence, Union

from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = '4b6d9f1c7a25'
down_revision: Union[str, Sequence[str], None] = 'c1d4e7f2a830'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE nao pode rodar dentro da mesma transacao
    # que a migration abre por padrao.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE employee_status ADD VALUE 'under_review'")


def downgrade() -> None:
    # O Postgres nao permite remover um valor de ENUM diretamente: o tipo
    # precisa ser reconstruido sem esse valor. Isso falha se alguma linha
    # ainda estiver com status='under_review' no momento do downgrade.
    op.execute('ALTER TYPE employee_status RENAME TO employee_status_old')

    employee_status = postgresql.ENUM(
        'available',
        'busy',
        'pending',
        name='employee_status',
    )
    employee_status.create(op.get_bind())

    op.execute(
        'ALTER TABLE employees ALTER COLUMN status '
        'TYPE employee_status USING status::text::employee_status'
    )
    op.execute('DROP TYPE employee_status_old')
