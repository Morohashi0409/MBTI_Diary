from pydantic_settings import BaseSettings
import os
from pathlib import Path

# プロジェクトのベースディレクトリを取得
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """アプリケーション設定"""
    APP_NAME: str = "MBTI Diary API"
    DEBUG: bool = True
    
    # Firebase関連の設定
    FIREBASE_CREDENTIALS_PATH: str = os.environ.get(
        "FIREBASE_CREDENTIALS_PATH", 
        str(BASE_DIR / "firebase-credentials.json")
    )
    
    # Dify API関連の設定
    DIFY_API_KEY: str = os.environ.get("DIFY_API_KEY", "app-tfRmkpyv8gsTxJFpH9gOGR2H")
    
    class Config:
        env_file = ".env"

settings = Settings()