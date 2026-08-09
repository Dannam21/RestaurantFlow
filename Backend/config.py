from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RestaurantFlow API"
    app_env: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"
    frontend_urls: str | None = None
    database_url: str = (
        "postgresql+asyncpg://postgres:password@localhost:5432/restaurant_flow"
    )
    database_echo: bool = False
    portal_enabled: bool = False
    portal_secret_key: str | None = None
    portal_api_url: str = "https://api.useportal.co"
    portal_sender_id: str = "restaurantflow-backend"
    restaurant_id: int = 1
    ai_enabled: bool = False
    anthropic_api_key: str | None = None
    ai_model: str = "claude-haiku-4-5-20251001"
    ai_timeout_seconds: float = 15.0
    monitoring_enabled: bool = True
    predictor_interval_seconds: int = Field(default=30, ge=1)
    supervisor_interval_seconds: int = Field(default=60, ge=1)
    ready_warning_minutes: int = Field(default=5, ge=1)
    delay_warning_minutes: int = Field(default=5, ge=1)
    alert_dedup_minutes: int = Field(default=10, ge=1)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_portal_configuration(self) -> "Settings":
        is_production = self.app_env.lower() == "production"
        if is_production and self.portal_enabled and not self.portal_secret_key:
            raise ValueError("PORTAL_SECRET_KEY is required when PORTAL_ENABLED=true")
        if is_production and self.ai_enabled and not self.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when AI_ENABLED=true")
        return self

    @property
    def cors_origins(self) -> list[str]:
        configured = self.frontend_urls or self.frontend_url
        return [origin.strip() for origin in configured.split(",") if origin.strip()]


settings = Settings()
