import { DiaryEntry, AnalysisResult, ApiResponse } from '@/types';

// Mock API to simulate the diary analysis endpoint
export async function POST(request: Request) {
  try {
    // Get the diary entry from the request
    const { content } = await request.json() as { content: string };
    
    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Diary content is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate random MBTI scores for demo purposes
    // In a real app, this would be calculated by AI
    const response: ApiResponse = {
      dimensions: {
        EI: Math.random() * 100, // 0-100 where 0 is fully E, 100 is fully I
        SN: Math.random() * 100,
        TF: Math.random() * 100,
        JP: Math.random() * 100,
      },
      feedback: "Based on your diary entry, you seem to exhibit traits associated with introversion, as you mention enjoying quiet reflection. Your writing shows a balance between sensing (focusing on concrete details) and intuition (exploring possibilities). There's a stronger tendency toward feeling-based decision making over thinking-based approaches. You also appear to have a slight preference for perceiving over judging, as you mention flexibility in your daily routine.",
      summary: "Your writing suggests an INFP profile - someone who is introspective, values authenticity, and tends to see possibilities in situations.",
    };
    
    return Response.json(response);
  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}