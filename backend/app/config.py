from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """アプリケーション設定"""
    APP_NAME: str = "MBTI Diary API"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()