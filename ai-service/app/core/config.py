from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "AI Career Coach Service"
    debug: bool = False
    version: str = "1.0.0"
    
    # Database
    redis_url: str = "redis://localhost:6379"
    
    # AI Models
    spacy_model: str = "en_core_web_sm"
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    
    # File Processing
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()
