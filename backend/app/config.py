from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Konfigurasi aplikasi, dibaca dari environment variable / file .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    app_name: str = "SIBI Translator API"
    environment: str = "development"

    database_url: str = "postgresql://sibi_user:sibi_pass@localhost:5432/sibi_translator"

    model_path: str = "app/models/artifacts/sibi_gcn_model_standalone.pt"
    device: str = "cpu"

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def sync_database_url(self) -> str:
        """Menjamin kompatibilitas URL PostgreSQL di cloud (mis. Railway menyediakan 'postgres://')."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
