from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    groq_api_key: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "all-MiniLM-L6-v2"
    llm_model: str = "llama-3.3-70b-versatile"
    chunk_size: int = 1000
    chunk_overlap: int = 200

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()