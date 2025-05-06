import requests
import logging
import json
from typing import Dict, Any, List
import uuid

logger = logging.getLogger(__name__)

class DifyAPIService:
    """Dify APIとの連携を行うサービスクラス"""
    
    def __init__(self, api_key: str = "app-tfRmkpyv8gsTxJFpH9gOGR2H"):
        self.api_key = api_key
        self.base_url = "https://api.dify.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        logger.info(f"Dify API初期化完了: ワークフローAPIを使用")
    
    def analyze_diary(self, content: str) -> Dict[str, Any]:
        """
        日記の内容をDify APIに送信してMBTI分析を行う
        
        Args:
            content: 日記の内容
            
        Returns:
            Dict[str, Any]: MBTIの次元スコア (E, N, F, J), フィードバック, 要約を含む辞書
        """
        try:
            # ユーザーIDを生成（セッション追跡用）
            user_id = f"mbti-diary-{uuid.uuid4()}"
            
            # Dify workflows/run エンドポイントを使用
            result = self._call_workflow_endpoint(content, user_id, "analysis")
            return result
            
        except Exception as e:
            logger.error(f"Dify API呼び出し中にエラーが発生しました: {str(e)}")
            # エラー時はデフォルト値を返す
            return {
                "dimensions": {
                    "EI": 50.0,  # デフォルト値
                    "SN": 50.0,
                    "TF": 50.0,
                    "JP": 50.0
                },
                "feedback": f"分析中にエラーが発生しました: {str(e)}",
                "summary": "分析結果を取得できませんでした。もう一度お試しください。"
            }
    
    def get_growth_advice(self, user_id: str) -> Dict[str, Any]:
        """
        ユーザーののびしろ情報をDify APIから取得する
        
        Args:
            user_id: ユーザーID
            
        Returns:
            Dict[str, Any]: のびしろアドバイス情報を含む辞書
        """
        try:
            # Dify workflows/run エンドポイントを使用
            result = self._call_workflow_endpoint("", user_id, "growth")
            
            # レスポンスの変換処理
            return {
                "advice": [
                    {
                        "id": 1,
                        "title": result.get("message1", "内向的な特性を活かす"),
                        "description": result.get("content1", "深い思考と自己理解を大切にしながら、時には小さな社交の機会も取り入れてみましょう。"),
                    },
                    {
                        "id": 2,
                        "title": result.get("message2", "直感力の向上"),
                        "description": result.get("content2", "パターンや関連性を見出す習慣をつけることで、より創造的な問題解決が可能になります。"),
                    },
                    {
                        "id": 3,
                        "title": result.get("message3", "バランスの取れた判断"),
                        "description": result.get("content3", "論理的思考と感情的な理解のバランスを意識することで、より良い決断ができるようになります。"),
                    }
                ]
            }
            
        except Exception as e:
            logger.error(f"Dify APIのびしろ情報取得中にエラーが発生しました: {str(e)}")
            # エラー時はデフォルト値を返す
            return {
                "advice": [
                    {
                        "id": 1,
                        "title": "内向的な特性を活かす",
                        "description": "深い思考と自己理解を大切にしながら、時には小さな社交の機会も取り入れてみましょう。",
                    },
                    {
                        "id": 2,
                        "title": "直感力の向上",
                        "description": "パターンや関連性を見出す習慣をつけることで、より創造的な問題解決が可能になります。",
                    },
                    {
                        "id": 3,
                        "title": "バランスの取れた判断",
                        "description": "論理的思考と感情的な理解のバランスを意識することで、より良い決断ができるようになります。",
                    }
                ]
            }
    
    def _call_workflow_endpoint(self, content: str, user_id: str, request_type: str = "analysis") -> Dict[str, Any]:
        """Workflows APIエンドポイントを呼び出す"""
        endpoint = f"{self.base_url}/workflows/run"
        
        # リクエストタイプに応じた入力を作成
        inputs = {
            "type": request_type
        }
        
        # 分析リクエストの場合はコンテンツを追加
        if request_type == "analysis":
            inputs["text"] = content
        # のびしろリクエストの場合はuser_idを追加
        elif request_type == "growth":
            inputs["user_id"] = user_id
        
        payload = {
            "inputs": inputs,
            "response_mode": "blocking",
            "user": user_id
        }
        
        logger.info(f"Dify API Workflows エンドポイントに接続: {endpoint}, タイプ: {request_type}")
        response = requests.post(endpoint, json=payload, headers=self.headers, timeout=60)
        
        if response.status_code == 200:
            logger.info("Dify API呼び出し成功")
            response_data = response.json()
            
            # レスポンスからデータを取得
            result_data = response_data.get("data", {})
            outputs = result_data.get("outputs", {})
            
            if request_type == "analysis":
                # 分析リクエストの場合
                e_score = outputs.get("E", 50.0)
                n_score = outputs.get("N", 50.0)
                f_score = outputs.get("F", 50.0)
                j_score = outputs.get("J", 50.0)
                feedback = outputs.get("feedback", "フィードバックが生成されませんでした")
                summary = outputs.get("summary", "要約が生成されませんでした")
                
                logger.debug(f"分析結果: E={e_score}, N={n_score}, F={f_score}, J={j_score}")
                logger.debug(f"フィードバック: {feedback}")
                logger.debug(f"要約: {summary}")
                
                # 結果を返す
                return {
                    "dimensions": {
                        "EI": float(e_score),
                        "SN": float(n_score),
                        "TF": float(f_score),
                        "JP": float(j_score)
                    },
                    "feedback": feedback,
                    "summary": summary
                }
            elif request_type == "growth":
                # のびしろリクエストの場合
                message1 = outputs.get("message1", "内向的な特性を活かす")
                content1 = outputs.get("content1", "深い思考と自己理解を大切にしながら、時には小さな社交の機会も取り入れてみましょう。")
                message2 = outputs.get("message2", "直感力の向上")
                content2 = outputs.get("content2", "パターンや関連性を見出す習慣をつけることで、より創造的な問題解決が可能になります。")
                message3 = outputs.get("message3", "バランスの取れた判断")
                content3 = outputs.get("content3", "論理的思考と感情的な理解のバランスを意識することで、より良い決断ができるようになります。")
                
                logger.debug(f"のびしろ情報取得成功: {message1}, {message2}, {message3}")
                
                # 結果を返す
                return {
                    "message1": message1,
                    "content1": content1,
                    "message2": message2,
                    "content2": content2,
                    "message3": message3,
                    "content3": content3
                }
            else:
                # その他のリクエストタイプの場合
                return outputs
        else:
            logger.error(f"Dify API呼び出しエラー: {response.status_code}, {response.text}")
            raise Exception(f"Dify API呼び出しエラー: {response.status_code}, {response.text}")