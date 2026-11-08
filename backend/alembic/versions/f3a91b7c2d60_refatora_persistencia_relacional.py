"""Refactor persistence and customer records with transactional audit outbox.

Revision ID: f3a91b7c2d60
Revises: d3f1a7c2b9e4
"""

from typing import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = 'f3a91b7c2d60'
down_revision: str | None = 'd3f1a7c2b9e4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:  # noqa: PLR0915
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM employees WHERE role::text = 'ORCAMENTO'
            ) THEN
                RAISE EXCEPTION
                    'An employee uses the removed ORCAMENTO role; map it '
                    'to an approved role before this migration';
            END IF;
            IF EXISTS (
                SELECT 1 FROM requests
                WHERE source_language_id = target_language_id
            ) THEN
                RAISE EXCEPTION
                    'A request has identical source and target languages; '
                    'correct it before adding the language-pair constraint';
            END IF;
            IF EXISTS (
                SELECT 1 FROM requests WHERE word_count < 1
            ) THEN
                RAISE EXCEPTION
                    'A request has an invalid word count; correct it before '
                    'adding the word-count constraint';
            END IF;
            IF EXISTS (SELECT 1 FROM quotes WHERE value < 0) THEN
                RAISE EXCEPTION
                    'A quote has a negative value; resolve it before '
                    'adding the monetary constraint';
            END IF;
            IF EXISTS (
                SELECT 1 FROM quotes
                WHERE (status = 'IN_REVIEW'
                    AND (approved_by_id IS NOT NULL
                         OR approved_at IS NOT NULL))
                   OR (status IN ('APPROVED', 'REJECTED')
                    AND (approved_by_id IS NULL OR approved_at IS NULL))
            ) THEN
                RAISE EXCEPTION
                    'Quote approval metadata is inconsistent; resolve it '
                    'before adding the approval constraint';
            END IF;
            IF EXISTS (
                SELECT 1 FROM translation_prices WHERE price_per_word < 0
            ) THEN
                RAISE EXCEPTION
                    'A translation price is negative; resolve it before '
                    'adding the monetary constraint';
            END IF;
        END
        $$;
        """
    )

    op.execute(
        'CREATE TYPE employee_role AS ENUM '
        "('admin', 'projetos', 'atendimento', 'freelancer')"
    )
    op.execute(
        'ALTER TABLE employees ALTER COLUMN role TYPE employee_role '
        'USING lower(role::text)::employee_role'
    )
    op.execute('DROP TYPE roles')
    op.execute("CREATE TYPE account_status AS ENUM ('active', 'disabled')")
    op.alter_column(
        'employees',
        'password',
        new_column_name='password_hash',
        existing_type=sa.String(),
    )
    op.add_column(
        'employees',
        sa.Column(
            'account_status',
            postgresql.ENUM(
                'active',
                'disabled',
                name='account_status',
                create_type=False,
            ),
            nullable=False,
            server_default='active',
        ),
    )
    op.add_column(
        'employees',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
    )
    op.alter_column(
        'employees',
        'created_at',
        type_=sa.DateTime(timezone=True),
        existing_type=sa.DateTime(),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )

    op.create_table(
        'freelancer_profiles',
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('specialization', sa.String(), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('bio', sa.String(), nullable=True),
        sa.Column(
            'is_available',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.CheckConstraint(
            'hourly_rate IS NULL OR hourly_rate >= 0',
            name='ck_freelancer_profiles_nonnegative_rate',
        ),
        sa.ForeignKeyConstraint(
            ['employee_id'], ['employees.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('employee_id'),
    )
    op.execute(
        """
        INSERT INTO freelancer_profiles (employee_id)
        SELECT id FROM employees WHERE role = 'freelancer'
        """
    )
    op.alter_column('freelancer_profiles', 'is_available', server_default=None)

    op.rename_table('empresas', 'companies')
    op.alter_column(
        'departamentos',
        'empresa_id',
        new_column_name='company_id',
        existing_type=sa.Integer(),
    )
    op.alter_column(
        'companies',
        'criada_em',
        type_=sa.DateTime(timezone=True),
        existing_type=sa.DateTime(),
        postgresql_using="criada_em AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        'requests',
        'company',
        new_column_name='company_name',
        existing_type=sa.String(),
    )
    op.alter_column(
        'requests',
        'created_at',
        type_=sa.DateTime(timezone=True),
        existing_type=sa.DateTime(),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.create_check_constraint(
        'ck_requests_distinct_languages',
        'requests',
        'source_language_id <> target_language_id',
    )
    op.create_check_constraint(
        'ck_requests_positive_word_count',
        'requests',
        'word_count IS NULL OR word_count >= 1',
    )

    op.execute('ALTER TYPE request_status RENAME TO request_status_legacy')
    op.execute(
        "CREATE TYPE request_status AS ENUM ('pending', 'quoted', 'rejected')"
    )
    op.alter_column('requests', 'status', server_default=None)
    op.alter_column(
        'requests',
        'status',
        type_=postgresql.ENUM(
            'pending', 'quoted', 'rejected', name='request_status'
        ),
        existing_nullable=False,
        postgresql_using='lower(status::text)::request_status',
    )
    op.alter_column('requests', 'status', server_default='pending')
    op.execute('DROP TYPE request_status_legacy')

    op.execute('ALTER TYPE quote_status RENAME TO quote_status_legacy')
    op.execute(
        'CREATE TYPE quote_status AS ENUM '
        "('in_review', 'approved', 'rejected')"
    )
    op.alter_column('quotes', 'status', server_default=None)
    op.alter_column(
        'quotes',
        'status',
        type_=postgresql.ENUM(
            'in_review', 'approved', 'rejected', name='quote_status'
        ),
        existing_nullable=False,
        postgresql_using='lower(status::text)::quote_status',
    )
    op.alter_column('quotes', 'status', server_default='in_review')
    op.execute('DROP TYPE quote_status_legacy')
    op.add_column(
        'quotes',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
    )
    op.alter_column(
        'quotes',
        'created_at',
        type_=sa.DateTime(timezone=True),
        existing_type=sa.DateTime(),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        'quotes',
        'approved_at',
        type_=sa.DateTime(timezone=True),
        existing_type=sa.DateTime(),
        postgresql_using="approved_at AT TIME ZONE 'UTC'",
    )
    op.create_check_constraint(
        'ck_quotes_value_nonnegative', 'quotes', 'value >= 0'
    )
    op.create_check_constraint(
        'ck_quotes_approval_consistency',
        'quotes',
        "(status = 'in_review' AND approved_by_id IS NULL "
        'AND approved_at IS NULL) OR '
        "(status IN ('approved', 'rejected') AND "
        'approved_by_id IS NOT NULL AND approved_at IS NOT NULL)',
    )

    op.execute(
        'CREATE TYPE project_status AS ENUM '
        "('ready', 'in_progress', 'testing', 'done')"
    )
    op.alter_column(
        'projects',
        'status',
        type_=postgresql.ENUM(
            'ready',
            'in_progress',
            'testing',
            'done',
            name='project_status',
        ),
        existing_type=postgresql.ENUM(
            'READY', 'IN_PROGRESS', 'TESTING', 'DONE', name='status'
        ),
        postgresql_using='lower(status::text)::project_status',
    )

    op.rename_table('path_projects', 'legacy_path_projects')
    op.rename_table('path_stages', 'legacy_path_stages')

    op.create_table(
        'stage_templates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        """
        INSERT INTO stage_templates (id, name)
        SELECT id, name FROM stages ORDER BY id
        """
    )
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('stage_templates', 'id'),
            COALESCE((SELECT max(id) FROM stage_templates), 1),
            EXISTS (SELECT 1 FROM stage_templates)
        )
        """
    )

    op.create_table(
        'path_stages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('stage_template_id', sa.Integer(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['path_id'], ['paths.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['stage_template_id'],
            ['stage_templates.id'],
            ondelete='RESTRICT',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('id', 'path_id'),
        sa.UniqueConstraint('path_id', 'sequence'),
        sa.UniqueConstraint('path_id', 'stage_template_id'),
        sa.CheckConstraint('sequence > 0', name='ck_path_stages_sequence'),
    )
    op.execute(
        """
        INSERT INTO path_stages (path_id, stage_template_id, sequence)
        SELECT path_id, stage_id,
            row_number() OVER (PARTITION BY path_id ORDER BY stage_id)
        FROM legacy_path_stages
        """
    )

    op.create_table(
        'project_paths',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ['project_id'], ['projects.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['path_id'], ['paths.id'], ondelete='RESTRICT'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('id', 'path_id'),
        sa.UniqueConstraint('project_id', 'sequence'),
        sa.UniqueConstraint('project_id', 'path_id'),
        sa.CheckConstraint('sequence > 0', name='ck_project_paths_sequence'),
    )
    op.execute(
        """
        INSERT INTO project_paths (project_id, path_id, sequence)
        SELECT project_id, path_id,
            row_number() OVER (PARTITION BY project_id ORDER BY path_id)
        FROM legacy_path_projects
        """
    )

    op.create_table(
        'project_stages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_path_id', sa.Integer(), nullable=False),
        sa.Column('path_stage_id', sa.Integer(), nullable=False),
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('freelancer_id', sa.Integer(), nullable=True),
        sa.Column(
            'status',
            postgresql.ENUM(
                'ready',
                'in_progress',
                'testing',
                'done',
                name='project_status',
                create_type=False,
            ),
            nullable=False,
            server_default='ready',
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['freelancer_id'], ['employees.id'], ondelete='SET NULL'
        ),
        sa.ForeignKeyConstraint(
            ['project_path_id', 'path_id'],
            ['project_paths.id', 'project_paths.path_id'],
            ondelete='CASCADE',
            name='fk_project_stages_project_path',
        ),
        sa.ForeignKeyConstraint(
            ['path_stage_id', 'path_id'],
            ['path_stages.id', 'path_stages.path_id'],
            ondelete='RESTRICT',
            name='fk_project_stages_path_stage',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_path_id', 'path_stage_id'),
        sa.CheckConstraint(
            'completed_at IS NULL OR started_at IS NOT NULL',
            name='ck_project_stages_completion_requires_start',
        ),
        sa.CheckConstraint(
            'started_at IS NULL OR completed_at IS NULL '
            'OR completed_at >= started_at',
            name='ck_project_stages_valid_dates',
        ),
    )
    op.execute(
        """
        INSERT INTO project_stages
            (project_path_id, path_stage_id, path_id, freelancer_id, status)
        SELECT project_path.id, path_stage.id, path_stage.path_id,
               stage.freelancer_id, lower(stage.status::text)::project_status
        FROM project_paths AS project_path
        JOIN path_stages AS path_stage
          ON path_stage.path_id = project_path.path_id
        JOIN stages AS stage
          ON stage.id = path_stage.stage_template_id
        """
    )
    op.alter_column('project_stages', 'status', server_default=None)

    op.create_table(
        'files',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('original_name', sa.String(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=True),
        sa.Column('project_stage_id', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('uploaded_by_id', sa.Integer(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.ForeignKeyConstraint(
            ['request_id'], ['requests.id'], ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['project_stage_id'],
            ['project_stages.id'],
            ondelete='RESTRICT',
        ),
        sa.ForeignKeyConstraint(
            ['uploaded_by_id'], ['employees.id'], ondelete='SET NULL'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            '(request_id IS NOT NULL) <> (project_stage_id IS NOT NULL)',
            name='ck_files_exactly_one_context',
        ),
        sa.CheckConstraint(
            'size_bytes IS NULL OR size_bytes >= 0',
            name='ck_files_nonnegative_size',
        ),
    )
    op.execute(
        """
        INSERT INTO files (id, file_path, original_name, request_id)
        SELECT id, file_path, original_name, request_id
        FROM request_files ORDER BY id
        """
    )
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('files', 'id'),
            COALESCE((SELECT max(id) FROM files), 1),
            EXISTS (SELECT 1 FROM files)
        )
        """
    )

    op.drop_table('legacy_path_stages')
    op.drop_table('legacy_path_projects')
    op.drop_table('request_files')
    op.drop_table('stage_files')
    op.drop_table('stages')

    op.execute('DROP TYPE status')

    op.create_table(
        'outbox_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_type', sa.String(120), nullable=False),
        sa.Column('aggregate_type', sa.String(80), nullable=False),
        sa.Column('aggregate_id', sa.Integer(), nullable=False),
        sa.Column(
            'payload',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            'event_id',
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'attempts', sa.Integer(), nullable=False, server_default='0'
        ),
        sa.Column(
            'next_attempt_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_by', sa.String(80), nullable=True),
        sa.Column('last_error', sa.String(500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id'),
    )
    op.create_index(
        'ix_outbox_events_pending',
        'outbox_events',
        ['processed_at', 'next_attempt_at'],
    )

    op.create_index(
        'ix_departamentos_company_id', 'departamentos', ['company_id']
    )
    op.create_index(
        'ix_contatos_departamento_id', 'contatos', ['departamento_id']
    )
    op.create_index('ix_requests_employee_id', 'requests', ['employee_id'])
    op.create_index('ix_requests_service_id', 'requests', ['service_id'])
    op.create_index(
        'ix_requests_source_language_id',
        'requests',
        ['source_language_id'],
    )
    op.create_index(
        'ix_requests_target_language_id',
        'requests',
        ['target_language_id'],
    )
    op.create_index(
        'ix_requests_status_created_at',
        'requests',
        ['status', 'created_at'],
    )
    op.create_index('ix_quotes_created_by_id', 'quotes', ['created_by_id'])
    op.create_index('ix_quotes_approved_by_id', 'quotes', ['approved_by_id'])
    op.create_index('ix_quotes_status', 'quotes', ['status'])
    op.create_index('ix_projects_creator_id', 'projects', ['creator_id'])
    op.create_index('ix_projects_status', 'projects', ['status'])
    op.create_index(
        'ix_translation_prices_source_language_id',
        'translation_prices',
        ['source_language_id'],
    )
    op.create_index(
        'ix_translation_prices_target_language_id',
        'translation_prices',
        ['target_language_id'],
    )
    op.create_index(
        'ix_path_stages_stage_template_id',
        'path_stages',
        ['stage_template_id'],
    )
    op.create_index('ix_project_paths_path_id', 'project_paths', ['path_id'])
    op.create_index(
        'ix_project_stages_freelancer_status',
        'project_stages',
        ['freelancer_id', 'status'],
    )
    op.create_index(
        'ix_project_stages_path_stage_id',
        'project_stages',
        ['path_stage_id'],
    )
    op.create_index('ix_files_request_id', 'files', ['request_id'])
    op.create_index('ix_files_project_stage_id', 'files', ['project_stage_id'])

    op.add_column(
        'employees',
        sa.Column('first_name', sa.String(), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('last_name', sa.String(), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('birth_date', sa.Date(), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('photo_url', sa.String(), nullable=True),
    )
    op.add_column(
        'employees',
        sa.Column('phone', sa.String(), nullable=True),
    )

    op.add_column(
        'freelancer_profiles',
        sa.Column(
            'profile_completed',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.execute(
        """
        UPDATE freelancer_profiles AS profile
        SET profile_completed = employee.status <> 'pending'
        FROM employees AS employee
        WHERE employee.id = profile.employee_id
        """
    )
    op.alter_column(
        'freelancer_profiles',
        'profile_completed',
        server_default=None,
    )

    op.alter_column(
        'companies',
        'razao_social',
        new_column_name='name',
        existing_type=sa.String(),
    )
    op.alter_column(
        'companies',
        'cnpj',
        new_column_name='tax_id',
        existing_type=sa.String(),
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'empresas_cnpj_key'
                  AND conrelid = 'companies'::regclass
            ) THEN
                ALTER TABLE companies
                RENAME CONSTRAINT empresas_cnpj_key TO companies_tax_id_key;
            ELSIF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'companies_cnpj_key'
                  AND conrelid = 'companies'::regclass
            ) THEN
                ALTER TABLE companies
                RENAME CONSTRAINT companies_cnpj_key TO companies_tax_id_key;
            END IF;
        END
        $$;
        """
    )
    op.alter_column('companies', 'tax_id', nullable=True)
    op.alter_column(
        'companies',
        'criada_em',
        new_column_name='created_at',
        existing_type=sa.DateTime(timezone=True),
    )
    op.add_column(
        'companies',
        sa.Column('primary_email', sa.String(), nullable=True),
    )
    op.add_column(
        'companies',
        sa.Column('website', sa.String(), nullable=True),
    )
    op.add_column(
        'companies',
        sa.Column('primary_phone', sa.String(), nullable=True),
    )
    op.add_column(
        'companies',
        sa.Column('general_info', sa.String(), nullable=True),
    )
    op.add_column(
        'companies',
        sa.Column(
            'is_legal_entity',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.alter_column('companies', 'is_legal_entity', server_default=None)

    op.create_table(
        'company_employees',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('general_info', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ['company_id'], ['companies.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_company_employees_company_id',
        'company_employees',
        ['company_id'],
    )
    op.execute(
        """
        INSERT INTO company_employees (
            company_id, first_name, last_name, email, phone, general_info
        )
        SELECT department.company_id,
               split_part(btrim(contact.nome), ' ', 1),
               COALESCE(
                   NULLIF(
                       btrim(substr(
                           btrim(contact.nome),
                           length(split_part(btrim(contact.nome), ' ', 1)) + 1
                       )),
                       ''
                   ),
                   ''
               ),
               contact.email,
               contact.telefone,
               NULLIF(
                   concat_ws(
                       E'\\n',
                       CASE WHEN department.nome <> ''
                           THEN 'Department: ' || department.nome
                       END,
                       CASE WHEN contact.cargo IS NOT NULL
                           THEN 'Position: ' || contact.cargo
                       END
                   ),
                   ''
               )
        FROM contatos AS contact
        JOIN departamentos AS department
          ON department.id = contact.departamento_id
        ORDER BY contact.id
        """
    )
    op.drop_table('contatos')
    op.drop_table('departamentos')

    op.create_table(
        'people',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('general_info', sa.String(), nullable=True),
        sa.Column(
            'is_natural_person',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.alter_column('people', 'is_natural_person', server_default=None)


def downgrade() -> None:  # noqa: PLR0915
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM people) THEN
                RAISE EXCEPTION
                    'Person records cannot be represented by the old schema';
            END IF;
            IF EXISTS (
                SELECT 1 FROM companies
                WHERE primary_email IS NOT NULL
                   OR website IS NOT NULL
                   OR primary_phone IS NOT NULL
                   OR general_info IS NOT NULL
                   OR is_legal_entity IS DISTINCT FROM true
            ) THEN
                RAISE EXCEPTION
                    'Company profile fields cannot be represented by the '
                    'old schema';
            END IF;
            IF EXISTS (SELECT 1 FROM companies WHERE tax_id IS NULL) THEN
                RAISE EXCEPTION
                    'Companies without a tax ID cannot be represented by '
                    'the old schema';
            END IF;
            IF EXISTS (
                SELECT 1 FROM employees
                WHERE first_name IS NOT NULL OR last_name IS NOT NULL
                   OR birth_date IS NOT NULL OR photo_url IS NOT NULL
                   OR phone IS NOT NULL
            ) THEN
                RAISE EXCEPTION
                    'Employee profile fields cannot be represented by the '
                    'old schema';
            END IF;
        END
        $$;
        """
    )

    op.create_table(
        'departamentos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'contatos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('telefone', sa.String(), nullable=False),
        sa.Column('cargo', sa.String(), nullable=True),
        sa.Column('departamento_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['departamento_id'], ['departamentos.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        """
        WITH company_departments AS (
            INSERT INTO departamentos (nome, company_id)
            SELECT 'Company employees', company.id
            FROM companies AS company
            WHERE EXISTS (
                SELECT 1 FROM company_employees AS employee
                WHERE employee.company_id = company.id
            )
            RETURNING id, company_id
        )
        INSERT INTO contatos (nome, email, telefone, cargo, departamento_id)
        SELECT concat_ws(' ', employee.first_name, employee.last_name),
               employee.email,
               COALESCE(employee.phone, ''),
               employee.general_info,
               department.id
        FROM company_employees AS employee
        JOIN company_departments AS department
          ON department.company_id = employee.company_id
        """
    )
    op.drop_index(
        'ix_company_employees_company_id', table_name='company_employees'
    )
    op.drop_table('company_employees')
    op.drop_table('people')
    op.create_index(
        'ix_departamentos_company_id',
        'departamentos',
        ['company_id'],
    )
    op.create_index(
        'ix_contatos_departamento_id',
        'contatos',
        ['departamento_id'],
    )

    op.drop_column('companies', 'is_legal_entity')
    op.drop_column('companies', 'general_info')
    op.drop_column('companies', 'primary_phone')
    op.drop_column('companies', 'website')
    op.drop_column('companies', 'primary_email')
    op.alter_column('companies', 'tax_id', nullable=False)
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'companies_tax_id_key'
                  AND conrelid = 'companies'::regclass
            ) THEN
                ALTER TABLE companies
                RENAME CONSTRAINT companies_tax_id_key TO companies_cnpj_key;
            END IF;
        END
        $$;
        """
    )
    op.alter_column(
        'companies',
        'created_at',
        new_column_name='criada_em',
        existing_type=sa.DateTime(timezone=True),
    )
    op.alter_column(
        'companies',
        'tax_id',
        new_column_name='cnpj',
        existing_type=sa.String(),
    )
    op.alter_column(
        'companies',
        'name',
        new_column_name='razao_social',
        existing_type=sa.String(),
    )

    op.drop_column('employees', 'phone')
    op.drop_column('employees', 'photo_url')
    op.drop_column('employees', 'birth_date')
    op.drop_column('employees', 'last_name')
    op.drop_column('employees', 'first_name')
    op.drop_column('freelancer_profiles', 'profile_completed')
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM outbox_events) THEN
                RAISE EXCEPTION
                    'Cannot downgrade while outbox history exists; export '
                    'and reconcile the events first';
            END IF;
            IF EXISTS (
                SELECT 1 FROM freelancer_profiles
                WHERE specialization IS NOT NULL OR hourly_rate IS NOT NULL
                   OR bio IS NOT NULL OR is_available IS DISTINCT FROM true
            ) THEN
                RAISE EXCEPTION
                    'Freelancer profile data cannot be represented by the '
                    'previous schema';
            END IF;
            IF EXISTS (
                SELECT 1 FROM employees WHERE account_status <> 'active'
            ) THEN
                RAISE EXCEPTION
                    'Disabled accounts cannot be represented by the '
                    'previous schema';
            END IF;
            IF EXISTS (
                SELECT 1
                FROM stage_templates AS template
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM project_stages AS execution
                    JOIN path_stages AS path_stage
                      ON path_stage.id = execution.path_stage_id
                    WHERE path_stage.stage_template_id = template.id
                      AND execution.freelancer_id IS NOT NULL
                )
            ) THEN
                RAISE EXCEPTION
                    'New or unassigned stage templates cannot be represented '
                    'by the previous schema';
            END IF;
            IF EXISTS (
                SELECT 1
                FROM project_stages AS execution
                JOIN path_stages AS path_stage
                  ON path_stage.id = execution.path_stage_id
                GROUP BY path_stage.stage_template_id
                HAVING count(
                    DISTINCT (execution.status, execution.freelancer_id)
                ) > 1
            ) THEN
                RAISE EXCEPTION
                    'Project stage state diverged between projects; the old '
                    'shared-stage model cannot represent it';
            END IF;
            IF EXISTS (
                SELECT 1 FROM files
                WHERE mime_type IS NOT NULL OR size_bytes IS NOT NULL
                   OR uploaded_by_id IS NOT NULL
            ) THEN
                RAISE EXCEPTION
                    'File metadata cannot be represented by the previous '
                    'schema';
            END IF;
        END
        $$;
        """
    )

    op.execute(
        """
        CREATE TYPE status AS ENUM
        ('READY', 'IN_PROGRESS', 'TESTING', 'DONE')
        """
    )
    op.execute(
        """
        CREATE TABLE stages (
            id serial PRIMARY KEY,
            name varchar NOT NULL,
            freelancer_id integer NOT NULL REFERENCES employees(id),
            status status NOT NULL
        )
        """
    )
    op.execute(
        """
        INSERT INTO stages (id, name, freelancer_id, status)
        SELECT template.id, template.name,
               (SELECT min(execution.freelancer_id)
                FROM project_stages execution
                JOIN path_stages path_stage
                  ON path_stage.id = execution.path_stage_id
                WHERE path_stage.stage_template_id = template.id),
               upper((SELECT min(execution.status::text)
                      FROM project_stages execution
                      JOIN path_stages path_stage
                        ON path_stage.id = execution.path_stage_id
                      WHERE path_stage.stage_template_id = template.id)
               )::status
        FROM stage_templates AS template
        """
    )
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('stages', 'id'),
            COALESCE((SELECT max(id) FROM stages), 1),
            EXISTS (SELECT 1 FROM stages)
        )
        """
    )

    op.create_table(
        'path_stages_legacy',
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['path_id'], ['paths.id']),
        sa.ForeignKeyConstraint(['stage_id'], ['stages.id']),
        sa.PrimaryKeyConstraint('path_id', 'stage_id'),
    )
    op.execute(
        """
        INSERT INTO path_stages_legacy (path_id, stage_id)
        SELECT path_id, stage_template_id FROM path_stages
        """
    )
    op.create_table(
        'path_projects_legacy',
        sa.Column('path_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['path_id'], ['paths.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('path_id', 'project_id'),
    )
    op.execute(
        """
        INSERT INTO path_projects_legacy (path_id, project_id)
        SELECT path_id, project_id FROM project_paths
        """
    )

    op.create_table(
        'request_files',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('original_name', sa.String(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['requests.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        """
        INSERT INTO request_files (id, file_path, original_name, request_id)
        SELECT id, file_path, original_name, request_id
        FROM files WHERE request_id IS NOT NULL
        """
    )
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('request_files', 'id'),
            COALESCE((SELECT max(id) FROM request_files), 1),
            EXISTS (SELECT 1 FROM request_files)
        )
        """
    )
    op.create_table(
        'stage_files',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['stage_id'], ['stages.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        """
        INSERT INTO stage_files (file_path, stage_id)
        SELECT file.file_path, path_stage.stage_template_id
        FROM files AS file
        JOIN project_stages AS execution
          ON execution.id = file.project_stage_id
        JOIN path_stages AS path_stage
          ON path_stage.id = execution.path_stage_id
        WHERE file.project_stage_id IS NOT NULL
        """
    )
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('stage_files', 'id'),
            COALESCE((SELECT max(id) FROM stage_files), 1),
            EXISTS (SELECT 1 FROM stage_files)
        )
        """
    )

    for index_name, table_name in (
        ('ix_departamentos_company_id', 'departamentos'),
        ('ix_contatos_departamento_id', 'contatos'),
        ('ix_requests_employee_id', 'requests'),
        ('ix_requests_service_id', 'requests'),
        ('ix_requests_source_language_id', 'requests'),
        ('ix_requests_target_language_id', 'requests'),
        ('ix_requests_status_created_at', 'requests'),
        ('ix_quotes_created_by_id', 'quotes'),
        ('ix_quotes_approved_by_id', 'quotes'),
        ('ix_quotes_status', 'quotes'),
        ('ix_projects_creator_id', 'projects'),
        ('ix_projects_status', 'projects'),
        ('ix_translation_prices_source_language_id', 'translation_prices'),
        ('ix_translation_prices_target_language_id', 'translation_prices'),
        ('ix_path_stages_stage_template_id', 'path_stages'),
        ('ix_project_paths_path_id', 'project_paths'),
        ('ix_project_stages_freelancer_status', 'project_stages'),
        ('ix_project_stages_path_stage_id', 'project_stages'),
        ('ix_files_request_id', 'files'),
        ('ix_files_project_stage_id', 'files'),
    ):
        op.drop_index(index_name, table_name=table_name)

    op.drop_table('files')
    op.drop_table('project_stages')
    op.drop_table('project_paths')
    op.drop_table('path_stages')
    op.rename_table('path_stages_legacy', 'path_stages')
    op.rename_table('path_projects_legacy', 'path_projects')
    op.drop_table('stage_templates')

    op.drop_table('outbox_events')
    op.drop_constraint(
        'ck_quotes_approval_consistency', 'quotes', type_='check'
    )
    op.drop_constraint('ck_quotes_value_nonnegative', 'quotes', type_='check')
    op.drop_constraint(
        'ck_requests_positive_word_count', 'requests', type_='check'
    )
    op.drop_constraint(
        'ck_requests_distinct_languages', 'requests', type_='check'
    )
    op.drop_column('quotes', 'updated_at')
    op.drop_column('employees', 'updated_at')
    op.drop_column('employees', 'account_status')
    op.drop_table('freelancer_profiles')

    op.execute(
        """
        CREATE TYPE roles AS ENUM
        ('ADMIN', 'PROJETOS', 'ATENDIMENTO', 'FREELANCER', 'ORCAMENTO')
        """
    )
    op.alter_column(
        'employees',
        'role',
        type_=postgresql.ENUM(
            'ADMIN',
            'PROJETOS',
            'ATENDIMENTO',
            'FREELANCER',
            'ORCAMENTO',
            name='roles',
        ),
        postgresql_using='upper(role::text)::roles',
    )
    op.execute('DROP TYPE employee_role')
    op.alter_column(
        'employees',
        'password_hash',
        new_column_name='password',
        existing_type=sa.String(),
    )

    op.execute('ALTER TYPE request_status RENAME TO request_status_current')
    op.execute(
        "CREATE TYPE request_status AS ENUM ('PENDING', 'QUOTED', 'REJECTED')"
    )
    op.alter_column('requests', 'status', server_default=None)
    op.alter_column(
        'requests',
        'status',
        type_=postgresql.ENUM(
            'PENDING', 'QUOTED', 'REJECTED', name='request_status'
        ),
        postgresql_using='upper(status::text)::request_status',
    )
    op.alter_column('requests', 'status', server_default='PENDING')
    op.execute('DROP TYPE request_status_current')

    op.execute('ALTER TYPE quote_status RENAME TO quote_status_current')
    op.execute(
        'CREATE TYPE quote_status AS ENUM '
        "('IN_REVIEW', 'APPROVED', 'REJECTED')"
    )
    op.alter_column('quotes', 'status', server_default=None)
    op.alter_column(
        'quotes',
        'status',
        type_=postgresql.ENUM(
            'IN_REVIEW', 'APPROVED', 'REJECTED', name='quote_status'
        ),
        postgresql_using='upper(status::text)::quote_status',
    )
    op.alter_column('quotes', 'status', server_default='IN_REVIEW')
    op.execute('DROP TYPE quote_status_current')

    op.execute('ALTER TYPE project_status RENAME TO project_status_current')
    op.alter_column(
        'projects',
        'status',
        type_=postgresql.ENUM(
            'READY', 'IN_PROGRESS', 'TESTING', 'DONE', name='status'
        ),
        postgresql_using='upper(status::text)::status',
    )
    op.alter_column(
        'stages',
        'status',
        type_=postgresql.ENUM(
            'READY', 'IN_PROGRESS', 'TESTING', 'DONE', name='status'
        ),
        postgresql_using='upper(status::text)::status',
    )
    op.execute('DROP TYPE project_status_current')

    op.alter_column(
        'quotes',
        'created_at',
        type_=sa.DateTime(),
        existing_type=sa.DateTime(timezone=True),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        'quotes',
        'approved_at',
        type_=sa.DateTime(),
        existing_type=sa.DateTime(timezone=True),
        postgresql_using="approved_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        'requests',
        'created_at',
        type_=sa.DateTime(),
        existing_type=sa.DateTime(timezone=True),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        'employees',
        'created_at',
        type_=sa.DateTime(),
        existing_type=sa.DateTime(timezone=True),
        postgresql_using="created_at AT TIME ZONE 'UTC'",
    )
    op.alter_column(
        'companies',
        'criada_em',
        type_=sa.DateTime(),
        existing_type=sa.DateTime(timezone=True),
        postgresql_using="criada_em AT TIME ZONE 'UTC'",
    )

    op.alter_column(
        'requests',
        'company_name',
        new_column_name='company',
        existing_type=sa.String(),
    )
    op.alter_column(
        'departamentos',
        'company_id',
        new_column_name='empresa_id',
        existing_type=sa.Integer(),
    )
    op.rename_table('companies', 'empresas')
