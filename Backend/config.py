from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RestaurantFlow API"
    app_env: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"
    database_url: str = (
        "postgresql+asyncpg://postgres:password@localhost:5432/restaurant_flow"
    )
    database_echo: bool = False
    portal_enabled: bool = False
    portal_secret_key: str | None = None
    portal_api_url: str = "https://api.useportal.co"
    portal_sender_id: str = "restaurantflow-backend"
    restaurant_id: int = 1

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_portal_configuration(self) -> "Settings":
        if self.portal_enabled and not self.portal_secret_key:
            raise ValueError("PORTAL_SECRET_KEY is required when PORTAL_ENABLED=true")
        return self


settings = Settings()
