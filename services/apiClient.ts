import Constants from 'expo-constants';
import { getAuthToken } from './firebaseService';

export type DiaryEntryParams = {
  content: string;
};

export type RegisterUserParams = {
  username: string;
  mbti: string;
  firebaseUid: string;
};

export type RegisterUserResponse = {
  userId: string;
  username: string;
  mbti: string;
};

export type DiaryAnalysisResponse = {
  id: string;
  content: string;
  dimensions: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
  feedback: string;
  summary: string;
  created_at: string;
};

export type GrowthAdvice = {
  id: number;
  title: string;
  description: string;
};

export type GrowthAdviceResponse = {
  advice: GrowthAdvice[];
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    // 環境に応じてAPIエンドポイントを選択
    if (__DEV__) {
      // 開発環境用
      // this.baseUrl = 'http://0.0.0.0:8000/api/v1';
      
      // 本番環境のエンドポイントを開発中も使用することでFirebase認証の問題を解決
      this.baseUrl = 'https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1';
    } else {
      // 本番環境用
      this.baseUrl = 'https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1';
    }
    
    console.log('APIクライアント初期化 - ベースURL:', this.baseUrl);
  }

  // 認証ヘッダーを生成する内部メソッド
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async analyzeAndSaveDiary(params: DiaryEntryParams): Promise<DiaryAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/diary/analyze-and-save`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: params.content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '日記の分析・保存に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('日記分析エラー:', error);
      throw new Error('日記の分析・保存に失敗しました。もう一度お試しください。');
    }
  }

  async createUserAccount(params: RegisterUserParams): Promise<RegisterUserResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー登録に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      throw new Error('ユーザー登録に失敗しました。もう一度お試しください。');
    }
  }
  
  // 日記の履歴を取得するメソッド
  async getUserDiaries(limit: number = 10): Promise<DiaryAnalysisResponse[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/diary/user?limit=${limit}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '日記の取得に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('日記取得エラー:', error);
      throw new Error('日記の取得に失敗しました。もう一度お試しください。');
    }
  }

  // のびしろ情報を取得するメソッド
  async getGrowthAdvice(): Promise<GrowthAdviceResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/diary/user/growth`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'のびしろ情報の取得に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('のびしろ情報取得エラー:', error);
      throw new Error('のびしろ情報の取得に失敗しました。もう一度お試しください。');
    }
  }
}

export const apiClient = new ApiClient();