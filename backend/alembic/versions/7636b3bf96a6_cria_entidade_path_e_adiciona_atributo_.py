"""cria entidade path e adiciona atributo employee

Revision ID: 7636b3bf96a6
Revises: c5e1a7d93f42
Create Date: 2026-09-28 15:40:57.144427

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '7636b3bf96a6'
down_revision: Union[str, Sequence[str], None] = 'c5e1a7d93f42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    employee_status = postgresql.ENUM(
        'available', 'busy', 'pending', name='employee_status'
    )
    employee_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'employees',
        sa.Column(
            'status',
            employee_status,
            nullable=False,
            server_default='available',
        ),
    )
    op.alter_column('employees', 'status', server_default=None)

    op.create_table(
        'paths',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('stages', sa.Column('path_id', sa.Integer(), nullable=True))

    op.execute(
        "INSERT INTO paths (name) "
        "SELECT 'Stage ' || id::text FROM stages"
    )
    op.execute(
        "UPDATE stages SET path_id = paths.id "
        "FROM paths WHERE paths.name = 'Stage ' || stages.id::text"
    )
    op.create_foreign_key(
        'fk_stages_path_id_paths', 'stages', 'paths', ['path_id'], ['id']
    )

    op.create_table(
        'path_projects',
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['path_id'], ['paths.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('path_id', 'project_id'),
    )
    op.execute(
        'INSERT INTO path_projects (path_id, project_id) '
        'SELECT stages.path_id, project_stages.project_id '
        'FROM project_stages JOIN stages '
        'ON stages.id = project_stages.stage_id'
    )
    op.drop_table('project_stages')
    op.alter_column('stages', 'path_id', nullable=False)


def downgrade() -> None:
    op.create_table(
        'project_stages',
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.ForeignKeyConstraint(['stage_id'], ['stages.id']),
        sa.PrimaryKeyConstraint('project_id', 'stage_id'),
    )

    op.execute(
        'INSERT INTO project_stages (project_id, stage_id) '
        'SELECT path_projects.project_id, stages.id '
        'FROM path_projects JOIN stages '
        'ON stages.path_id = path_projects.path_id'
    )
    op.drop_table('path_projects')
    op.drop_constraint('fk_stages_path_id_paths', 'stages', type_='foreignkey')
    op.drop_column('stages', 'path_id')
    op.drop_table('paths')

    op.drop_column('employees', 'status')
    sa.Enum(name='employee_status').drop(op.get_bind(), checkfirst=True)
