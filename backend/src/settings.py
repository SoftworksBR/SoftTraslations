from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env', env_file_encoding='utf-8'
    )

    DATABASE_URL: str = ''
    INITIAL_ADMIN_USERNAME: str = ''
    INITIAL_ADMIN_EMAIL: str = ''
    INITIAL_ADMIN_PASSWORD: str = ''
    MONGODB_URI: str = 'mongodb://localhost:27017'
    MONGODB_DATABASE: str = 'softtranslations'
    MONGODB_TIMEOUT_MS: int = 1000
    OUTBOX_POLL_INTERVAL_SECONDS: int = 5
    OUTBOX_BATCH_SIZE: int = 25
    SECRET_KEY: str = ''
    ALGORITHM: str = ''
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ACCESS_TOKEN_COOKIE_NAME: str = 'softtranslations_access_token'
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: Literal['lax', 'strict', 'none'] = 'lax'
    CORS_ORIGINS: str = 'http://localhost:8081,http://127.0.0.1:8081'
    UPLOAD_DIR: str = 'uploads'
    MAX_UPLOAD_MB: int = 10
    MAX_FILES_PER_REQUEST: int = 10

    @model_validator(mode='after')
    def validate_cookie_settings(self):
        if self.COOKIE_SAMESITE == 'none' and not self.COOKIE_SECURE:
            raise ValueError(
                "COOKIE_SECURE must be true when COOKIE_SAMESITE is 'none'"
            )
        return self
