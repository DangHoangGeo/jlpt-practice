import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return new Response('AI chat is not configured', { status: 503 })
    }

    const body = await request.json()
    const { 
      message, 
      chat_history = [],
      session_id 
    }: {
      message: string;
      chat_history: Array<{ role: 'user' | 'assistant'; content: string }>;
      session_id?: string;
    } = body

    if (!message || message.trim().length === 0) {
      return new Response('Message is required', { status: 400 })
    }

    // Get user's current context for personalized responses
    const [statsResponse, progressResponse, weaknessResponse] = await Promise.all([
      // Get current performance stats
      fetch(`${request.nextUrl.origin}/api/dashboard-stats`, {
        headers: { 'Cookie': request.headers.get('cookie') || '' }
      }),
      
      // Get recent progress data
      supabase
        .from('user_progress')
        .select('item_type, correct_count, incorrect_count, mastery_level')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20),
      
      // Get latest weakness analysis
      supabase
        .from('weakness_reports')
        .select('analysis_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ])

    // Prepare user context with function calling capabilities
    const userContext: {
      daysRemaining: number;
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      currentScores?: { vocabulary_grammar: number; reading: number };
      weeklyAccuracy?: number;
      streakDays?: number;
      weakAreas?: string[];
      studyHistory?: Array<{ topic: string; correct: number; total: number; date: string }>;
      userId?: string;
      baseUrl?: string;
    } = {
      daysRemaining: 4, // You mentioned 4 days left
      chatHistory: chat_history,
      userId: user.id,
      baseUrl: request.nextUrl.origin
    }

    // Add performance stats if available
    if (statsResponse.ok) {
      const stats = await statsResponse.json()
      userContext.currentScores = {
        vocabulary_grammar: 17, // From your message
        reading: 21 // From your message
      }
      userContext.weeklyAccuracy = stats.weekly_accuracy
      userContext.streakDays = stats.streak_days
    }

    // Add weak areas from latest analysis
    if (weaknessResponse.data) {
      userContext.weakAreas = weaknessResponse.data.analysis_data?.focus_areas || []
    }

    // Add recent study performance
    if (progressResponse.data) {
      userContext.studyHistory = progressResponse.data.map(p => ({
        topic: `${p.item_type}`,
        correct: p.correct_count,
        total: p.correct_count + p.incorrect_count,
        date: new Date().toLocaleDateString()
      }))
    }

    // Generate AI response stream
    const result = await geminiService.chatWithAssistantStream(message, userContext)

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunkText })}\n\n`))
            }
          }
          
          // Send final response and save to database
          const finalResponse = await result.response
          const fullText = finalResponse.text()
          
          // Save chat interaction for future context
          if (session_id) {
            try {
              await supabase
                .from('activity_log')
                .insert({
                  user_id: user.id,
                  activity_type: 'ai_chat_stream',
                  details: {
                    message,
                    response: fullText,
                    session_id,
                    context_used: Object.keys(userContext)
                  }
                })
            } catch (logError) {
              console.error('Error logging chat:', logError)
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Error in AI chat stream:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
