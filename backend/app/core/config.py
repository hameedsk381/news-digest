from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agentic News Digest"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "news_digest")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    
    @property
    def GROQ_API_KEYS(self) -> list[str]:
        if not self.GROQ_API_KEY:
            return []
        return [k.strip() for k in self.GROQ_API_KEY.split(",") if k.strip()]

    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-gov-digest")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq") # 'groq' or 'ollama'

    # Pydantic V2 Config
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore" # Crucial to avoid crashing on extra env vars
    )

    @property
    def DATABASE_URL(self) -> str:
        # Check if we should use SQLite
        env_db_url = os.getenv("DATABASE_URL")
        if env_db_url and "sqlite" in env_db_url:
            return env_db_url
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
