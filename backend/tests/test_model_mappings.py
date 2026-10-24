from src.enums.enums import AccountStatus
from src.models.employee_model import Employee


def test_employee_password_attribute_maps_to_password_hash_column():
    assert Employee.password.property.columns[0].name == 'password_hash'


def test_account_status_values_match_migration_enum():
    assert {status.value for status in AccountStatus} == {'active', 'disabled'}
