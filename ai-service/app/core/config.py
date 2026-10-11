import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "InsighterTrading AI Engine"
    app_version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:5173")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
