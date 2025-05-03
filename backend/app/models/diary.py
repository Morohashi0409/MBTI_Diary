from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
from uuid import uuid4

class DiaryEntry(BaseModel):
    """日記エントリーのモデル"""
    content: str

class DiaryAnalysis(BaseModel):
    """MBTI分析結果のモデル"""
    dimensions: Dict[str, float]  # EI, SN, TF, JP のスコア
    feedback: str  # 詳細なフィードバック
    summary: str   # 要約

class DiaryRecord(BaseModel):
    """データベースに保存される日記レコードのモデル"""
    id: str
    user_id: str
    content: str
    dimensions: Dict[str, float]
    feedback: str
    summary: str
    created_at: datetime
    
    @classmethod
    def create(cls, user_id: str, content: str, analysis: DiaryAnalysis):
        """新しい日記レコードを作成する"""
        return cls(
            id=str(uuid4()),
            user_id=user_id,
            content=content,
            dimensions=analysis.dimensions,
            feedback=analysis.feedback,
            summary=analysis.summary,
            created_at=datetime.now()
        )

class DiaryResponse(BaseModel):
    """APIレスポンス用の日記モデル"""
    id: str
    content: str
    dimensions: Dict[str, float]
    feedback: str
    summary: str
    created_at: datetime