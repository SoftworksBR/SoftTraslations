import pytest
from pydantic import ValidationError

from src.enums.enums import Status, Translations
from src.main import app
from src.schemas.stage_schema import StageCreate


def test_stage_create_requires_name():
    with pytest.raises(ValidationError):
        StageCreate(freelancer_id=1, status=Status.READY)


def test_get_routes_expose_search_filters_as_query_parameters():
    expected_parameters = {
        '/employee/': {'username', 'email', 'role'},
        '/projects/': {
            'name',
            'status',
            'stage_name',
            'freelancer_name',
            'creator_name',
        },
        '/requests/': {
            'username',
            'email',
            'phone',
            'company',
            'source_language_id',
            'target_language_id',
            'service_id',
            'status',
        },
        '/quotes/': {
            'status',
            'request_id',
            'client_name',
            'available_for_project',
        },
        '/stages/': {
            'name',
            'status',
            'project_name',
            'freelancer_name',
        },
    }

    schema = app.openapi()

    for path, expected in expected_parameters.items():
        actual = {
            parameter['name']
            for parameter in schema['paths'][path]['get']['parameters']
        }
        assert expected <= actual
