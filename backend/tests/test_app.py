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
            'translate_from',
            'translate_to',
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


def test_translations_enum_contains_supported_service_languages():
    expected_values = {
        'sq-AL',
        'de-DE',
        'ar-EG',
        'bg-BG',
        'ca',
        'zh-Hans-HK',
        'zh-Hans',
        'zh-Hant',
        'zh-TW',
        'ko-KR',
        'ha',
        'hr-HR',
        'da-DK',
        'sk-SK',
        'sl-SI',
        'es-AR',
        'es-ES',
        'es-LA',
        'es-MX',
        'fi-FI',
        'fr-CA',
        'fr-FR',
        'el-GR',
        'he',
        'hi-IN',
        'nl-NL',
        'hu-HU',
        'en-AU',
        'en-CA',
        'en-US',
        'en-GB',
        'it-IT',
        'ja-JP',
        'lo-LA',
        'la',
        'lv-LV',
        'sgn-BR',
        'lt-LT',
        'ms',
        'mn',
        'nb-NO',
        'fa-IR',
        'pl-PL',
        'pt-AO',
        'pt-BR',
        'pt-MZ',
        'pt-PT',
        'ro',
        'ru-RU',
        'sr-Cyrl',
        'sr-Latn',
        'so',
        'sv-SE',
        'th',
        'cs-CZ',
        'tr-TR',
        'uk-UA',
        'umb',
        'ur-PK',
        'vi',
    }

    assert expected_values <= {
        translation.value for translation in Translations
    }
