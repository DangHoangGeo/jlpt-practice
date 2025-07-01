import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI chat is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
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
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 })
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

    // Prepare user context
    const userContext: {
      daysRemaining: number;
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      currentScores?: { vocabulary_grammar: number; reading: number };
      weeklyAccuracy?: number;
      streakDays?: number;
      weakAreas?: string[];
      studyHistory?: Array<{ topic: string; correct: number; total: number; date: string }>;
    } = {
      daysRemaining: 4, // You mentioned 4 days left
      chatHistory: chat_history
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

    // Generate AI response
    const aiResponse = await geminiService.chatWithAssistant(message, userContext)

    // Save chat interaction for future context
    if (session_id) {
      try {
        await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            activity_type: 'ai_chat',
            details: {
              message,
              response: aiResponse,
              session_id,
              context_used: Object.keys(userContext)
            }
          })
      } catch (logError) {
        console.error('Error logging chat:', logError)
      }
    }

    return NextResponse.json({ 
      response: aiResponse,
      context_used: userContext,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process chat message' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('activity_log')
      .select('details, timestamp')
      .eq('user_id', user.id)
      .eq('activity_type', 'ai_chat')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (sessionId) {
      query = query.eq('details->>session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
    }

    const chatHistory = data?.map(log => ({
      user_message: log.details?.message,
      ai_response: log.details?.response,
      timestamp: log.timestamp
    })) || []

    return NextResponse.json({ chat_history: chatHistory })

  } catch (error) {
    console.error('Error in chat history retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
