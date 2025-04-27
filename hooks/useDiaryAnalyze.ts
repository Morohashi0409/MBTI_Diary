import { useState } from 'react';
import { apiClient } from '@/services/apiClient';
import { AnalysisResult, ApiResponse, MBTIDimension } from '@/types';

export const useDiaryAnalyze = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResult, setStreamedResult] = useState<Partial<AnalysisResult> | null>(null);

  const mapApiResponseToAnalysisResult = (apiResponse: ApiResponse): AnalysisResult => {
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
      timestamp: new Date(),
    };
  };

  const analyzeDiary = async (content: string): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setStreamedResult(null);
    setIsStreaming(false);
    
    try {
      // For demonstration, we'll simulate streaming by using regular API call
      // In a real app, you would use EventSource or WebSockets for streaming
      const response = await apiClient.analyzeDiary({ content });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze diary');
      }
      
      // Simulate streaming by setting the state directly
      // In a real app with streaming, you'd receive chunks of data
      setIsStreaming(true);
      
      // In a real app, we'd parse the streaming response
      // For now, we'll just simulate with a timeout
      
      // Mock response for demo purposes
      const mockResponse: ApiResponse = {
        dimensions: {
          EI: Math.random() * 100, // 0-100 where 0 is fully E, 100 is fully I
          SN: Math.random() * 100,
          TF: Math.random() * 100,
          JP: Math.random() * 100,
        },
        feedback: "Based on your diary entry, you seem to exhibit traits associated with introversion, as you mention enjoying quiet reflection. Your writing shows a balance between sensing (focusing on concrete details) and intuition (exploring possibilities). There's a stronger tendency toward feeling-based decision making over thinking-based approaches. You also appear to have a slight preference for perceiving over judging, as you mention flexibility in your daily routine.",
        summary: "Your writing suggests an INFP profile - someone who is introspective, values authenticity, and tends to see possibilities in situations.",
      };
      
      const result = mapApiResponseToAnalysisResult(mockResponse);
      setResult(result);

      // Mock streaming with timeouts
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
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