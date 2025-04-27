from pydantic import BaseModel
from typing import Dict

class DiaryEntry(BaseModel):
    """日記エントリーのモデル"""
    content: str

class DiaryAnalysis(BaseModel):
    """MBTI分析結果のモデル"""
    dimensions: Dict[str, float]  # EI, SN, TF, JP のスコア
    feedback: str  # 詳細なフィードバック
    summary: str   # 要約