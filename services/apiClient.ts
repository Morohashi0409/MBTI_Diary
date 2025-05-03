import Constants from 'expo-constants';

export type DiaryEntryParams = {
  content: string;
  userId: string;
};

export type RegisterUserParams = {
  username: string;
  mbti: string;
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

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';
  }

  async analyzeAndSaveDiary(params: DiaryEntryParams): Promise<DiaryAnalysisResponse> {
    try {
      const url = `${this.baseUrl}/diary/analyze-and-save?user_id=${params.userId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  async getUserDiaries(userId: string, limit: number = 10): Promise<DiaryAnalysisResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/diary/user/${userId}?limit=${limit}`);
      
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
}

export const apiClient = new ApiClient();