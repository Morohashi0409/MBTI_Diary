from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
import os
import logging

from app.api.diary import router as diary_router
from app.api.users import router as users_router
# データベースモジュールをインポート - アプリの起動時に初期化される
from app.database import db
from app.config import settings

# ロガーのセットアップ
logger = logging.getLogger(__name__)

# Firebase Admin SDKの初期化
try:
    # Firebase認証情報パスの取得
    firebase_cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-credentials.json")
    logger.info(f"Firebase認証情報ファイルパス: {firebase_cred_path}")
    
    if not os.path.exists(firebase_cred_path):
        logger.error(f"Firebase認証情報ファイルが見つかりません: {firebase_cred_path}")
        raise FileNotFoundError(f"Firebase認証情報ファイルが見つかりません: {firebase_cred_path}")
    
    # Firebase Admin SDKの初期化
    cred = credentials.Certificate(firebase_cred_path)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDKが正常に初期化されました")
except Exception as e:
    logger.error(f"Firebase Admin SDKの初期化エラー: {str(e)}")
    # アプリケーションの起動は継続するが、認証機能は動作しない
    logger.error("Firebase認証が無効な状態でアプリケーションを起動します")

app = FastAPI(title="MBTI Diary API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンに制限すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(diary_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")