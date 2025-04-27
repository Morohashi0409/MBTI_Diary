from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.diary import router as diary_router
from app.api.users import router as users_router

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