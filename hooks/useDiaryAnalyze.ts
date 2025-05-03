import { useState } from 'react';
import { apiClient, DiaryAnalysisResponse } from '@/services/apiClient';
import { AnalysisResult, MBTIDimension } from '@/types';
import { getUserProfile } from '@/services/userStorage';

export const useDiaryAnalyze = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResult, setStreamedResult] = useState<Partial<AnalysisResult> | null>(null);

  const mapApiResponseToAnalysisResult = (apiResponse: DiaryAnalysisResponse): AnalysisResult => {
    const dimensions: MBTIDimension[] = [
      {
        name: 'Extraversion vs. Introversion',
        score: apiResponse.dimensions.EI,
        label1: 'Extraversion (E)',
        label2: 'Introversion (I)',
      },
      {
        name: 'Sensing vs. Intuition',
        score: apiResponse.dimensions.SN,
        label1: 'Sensing (S)',
        label2: 'Intuition (N)',
      },
      {
        name: 'Thinking vs. Feeling',
        score: apiResponse.dimensions.TF,
        label1: 'Thinking (T)',
        label2: 'Feeling (F)',
      },
      {
        name: 'Judging vs. Perceiving',
        score: apiResponse.dimensions.JP,
        label1: 'Judging (J)',
        label2: 'Perceiving (P)',
      },
    ];

    return {
      dimensions,
      feedback: apiResponse.feedback,
      summary: apiResponse.summary,
      timestamp: new Date(apiResponse.created_at),
    };
  };

  const analyzeDiary = async (content: string): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setStreamedResult(null);
    setIsStreaming(false);
    
    try {
      // ユーザープロファイルを取得してユーザーIDを抽出
      const userProfile = await getUserProfile();
      if (!userProfile || !userProfile.userId) {
        throw new Error('ユーザープロフィールが見つかりません。再ログインしてください。');
      }
      
      // 新しいAPIを呼び出す（ユーザーIDを含める）
      const apiResponse = await apiClient.analyzeAndSaveDiary({ 
        content,
        userId: userProfile.userId
      });
      
      // 結果を変換して保存
      const result = mapApiResponseToAnalysisResult(apiResponse);
      setResult(result);

      // ストリーミング表示をシミュレート
      setIsStreaming(true);
      
      setTimeout(() => {
        setStreamedResult(prev => ({ 
          ...prev, 
          dimensions: result.dimensions.slice(0, 1),
          timestamp: new Date() 
        }));
      }, 500);
      
      setTimeout(() => {
        setStreamedResult(prev => ({ 
          ...prev, 
          dimensions: result.dimensions.slice(0, 2) 
        }));
      }, 1000);
      
      setTimeout(() => {
        setStreamedResult(prev => ({ 
          ...prev, 
          dimensions: result.dimensions.slice(0, 4),
          feedback: result.feedback.substring(0, result.feedback.length / 2) 
        }));
      }, 1500);
      
      setTimeout(() => {
        setStreamedResult(result);
        setIsStreaming(false);
        setIsLoading(false);
      }, 2000);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      setIsLoading(false);
      setIsStreaming(false);
      return null;
    }
  };

  return {
    analyzeDiary,
    isLoading,
    error,
    result,
    isStreaming,
    streamedResult,
  };
};