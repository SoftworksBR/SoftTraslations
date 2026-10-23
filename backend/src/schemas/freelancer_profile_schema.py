from zoneinfo import available_timezones

from pydantic import BaseModel, Field, field_validator


class FreelancerProfileSchema(BaseModel):
    salutation: str = Field(min_length=1)
    academic_title: str = Field(min_length=1)
    job_function: str = Field(min_length=1)
    timezone: str = 'America/Sao_Paulo'
    source_language_ids: list[int] = Field(min_length=1)
    target_language_ids: list[int] = Field(min_length=1)
    native_language_ids: list[int] = Field(min_length=1)
    service_ids: list[int] = Field(min_length=1)

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        if value not in available_timezones():
            raise ValueError('Invalid timezone')

        return value
