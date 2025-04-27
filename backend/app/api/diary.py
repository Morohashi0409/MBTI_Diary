from fastapi import APIRouter, HTTPException
from app.models.diary import DiaryEntry, DiaryAnalysis
import random

router = APIRouter()

@router.post("/diary/analyze", response_model=DiaryAnalysis)
async def analyze_diary(entry: DiaryEntry):
    """日記を分析してMBTIスコアを返す"""
    try:
        # デモ用のランダムスコア生成
        analysis = DiaryAnalysis(
            dimensions={
                "EI": random.uniform(0, 100),
                "SN": random.uniform(0, 100),
                "TF": random.uniform(0, 100),
                "JP": random.uniform(0, 100)
            },
            feedback="あなたの日記からは、内向的な傾向が見られます。また、直感的な思考パターンも観察されます。感情に基づく意思決定を重視する傾向があり、柔軟な対応を好む特徴が示されています。",
            summary="あなたの文章からは、INFPタイプの特徴が見られます。内省的で、真摯さを重んじ、状況に応じて柔軟に対応できる傾向があります。"
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail="分析中にエラーが発生しました")