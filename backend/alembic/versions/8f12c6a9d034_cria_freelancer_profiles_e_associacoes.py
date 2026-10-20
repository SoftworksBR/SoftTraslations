"""Cria freelancer_profiles e as associacoes com idiomas e servicos.

Revision ID: 8f12c6a9d034
Revises: 4b6d9f1c7a25
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '8f12c6a9d034'
down_revision: Union[str, Sequence[str], None] = '4b6d9f1c7a25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'freelancer_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('salutation', sa.String(), nullable=False),
        sa.Column('academic_title', sa.String(), nullable=False),
        sa.Column('job_function', sa.String(), nullable=False),
        sa.Column(
            'timezone',
            sa.String(),
            nullable=False,
            server_default='America/Sao_Paulo',
        ),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id'),
    )

    for table_name in (
        'freelancer_profile_source_languages',
        'freelancer_profile_target_languages',
        'freelancer_profile_native_languages',
    ):
        op.create_table(
            table_name,
            sa.Column('freelancer_profile_id', sa.Integer(), nullable=False),
            sa.Column('language_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(
                ['freelancer_profile_id'], ['freelancer_profiles.id']
            ),
            sa.ForeignKeyConstraint(['language_id'], ['languages.id']),
            sa.PrimaryKeyConstraint('freelancer_profile_id', 'language_id'),
        )

    op.create_table(
        'freelancer_profile_services',
        sa.Column('freelancer_profile_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['freelancer_profile_id'], ['freelancer_profiles.id']
        ),
        sa.ForeignKeyConstraint(['service_id'], ['services.id']),
        sa.PrimaryKeyConstraint('freelancer_profile_id', 'service_id'),
    )


def downgrade() -> None:
    op.drop_table('freelancer_profile_services')
    op.drop_table('freelancer_profile_native_languages')
    op.drop_table('freelancer_profile_target_languages')
    op.drop_table('freelancer_profile_source_languages')
    op.drop_table('freelancer_profiles')
