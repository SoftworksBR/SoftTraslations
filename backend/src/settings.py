from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env', env_file_encoding='utf-8'
    )

    DATABASE_URL: str = ''
    SECRET_KEY: str = ''
    ALGORITHM: str = ''
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ACCESS_TOKEN_COOKIE_NAME: str = 'softtranslations_access_token'
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal['lax', 'strict', 'none'] = 'lax'
    CORS_ORIGINS: str = 'http://localhost:8081,http://127.0.0.1:8081'

    @model_validator(mode='after')
    def validate_cookie_settings(self):
        if self.COOKIE_SAMESITE == 'none' and not self.COOKIE_SECURE:
            raise ValueError(
                "COOKIE_SECURE must be true when COOKIE_SAMESITE is 'none'"
            )
        return self
