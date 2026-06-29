from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = ""

    # Embedding provider: "google" or "openai"
    embedding_provider: str = "google"
    google_api_key: str = ""
    openai_api_key: str = ""

    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768
    embedding_batch_size: int = 3
    embedding_batch_delay_seconds: float = 8.0
    embedding_cache_enabled: bool = True
    embedding_cache_db: bool = True
    embedding_cache_max_entries: int = 500
    hnsw_ef_search: int = 64
    llm_model: str = "gemini-2.0-flash-lite"
    cors_origins: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "https://juvenile-justice-intelligence-platf.vercel.app"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def embedding_configured(self) -> bool:
        if self.embedding_provider == "google":
            return bool(self.google_api_key)
        return bool(self.openai_api_key)


settings = Settings()
