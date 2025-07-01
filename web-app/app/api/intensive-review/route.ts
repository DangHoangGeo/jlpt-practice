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
        error: 'AI intensive review is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const { 
      session_length = 30,
      focus_type = 'weakest' // 'weakest', 'recent_mistakes', 'specific_items'
    } = body

    // Get user's weak items based on focus type
    let weakItems: Array<{
      term: string;
      reading: string;
      meaning: string;
      type: 'vocab' | 'grammar';
      mistakeCount: number;
    }> = []

    if (focus_type === 'weakest') {
      // Get items with lowest accuracy and highest mistake count
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          item_id,
          item_type,
          correct_count,
          incorrect_count,
          mastery_level
        `)
        .eq('user_id', user.id)
        .gt('incorrect_count', 2)
        .order('incorrect_count', { ascending: false })
        .limit(10)

      if (progressData) {
        // Get vocabulary items
        const vocabIds = progressData.filter(p => p.item_type === 'vocab').map(p => p.item_id)
        const grammarIds = progressData.filter(p => p.item_type === 'grammar').map(p => p.item_id)

        const [vocabItems, grammarItems] = await Promise.all([
          vocabIds.length > 0 ? supabase
            .from('vocabulary_items')
            .select('id, term, reading, meaning_en')
            .in('id', vocabIds) : Promise.resolve({ data: [] }),
          grammarIds.length > 0 ? supabase
            .from('grammar_items')
            .select('id, term, reading, meaning_en')
            .in('id', grammarIds) : Promise.resolve({ data: [] })
        ])

        // Combine items with mistake counts
        const vocabWithMistakes = vocabItems.data?.map(item => {
          const progress = progressData.find(p => p.item_id === item.id)
          return {
            term: item.term,
            reading: item.reading,
            meaning: item.meaning_en,
            type: 'vocab' as const,
            mistakeCount: progress?.incorrect_count || 0
          }
        }) || []

        const grammarWithMistakes = grammarItems.data?.map(item => {
          const progress = progressData.find(p => p.item_id === item.id)
          return {
            term: item.term,
            reading: item.reading,
            meaning: item.meaning_en,
            type: 'grammar' as const,
            mistakeCount: progress?.incorrect_count || 0
          }
        }) || []

        weakItems = [...vocabWithMistakes, ...grammarWithMistakes]
          .sort((a, b) => b.mistakeCount - a.mistakeCount)
          .slice(0, 8)
      }
    }

    if (weakItems.length === 0) {
      return NextResponse.json({ 
        error: 'No weak items found. Complete some practice sessions first to identify weak areas.' 
      }, { status: 400 })
    }

    // Generate intensive review session
    const reviewSession = await geminiService.generateIntensiveReview(
      weakItems,
      session_length
    )

    // Save the review session
    try {
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'intensive_review_generated',
          details: {
            session_length,
            focus_type,
            items_count: weakItems.length,
            review_session: reviewSession,
            target_items: weakItems
          }
        })
    } catch (logError) {
      console.error('Error logging intensive review:', logError)
    }

    return NextResponse.json({ 
      review_session: reviewSession,
      target_items: weakItems,
      generated_at: new Date().toISOString(),
      session_info: {
        length: session_length,
        focus_type,
        items_count: weakItems.length
      }
    })

  } catch (error) {
    console.error('Error generating intensive review:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate intensive review' 
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
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get recent intensive review sessions
    const { data, error } = await supabase
      .from('activity_log')
      .select('details, timestamp')
      .eq('user_id', user.id)
      .eq('activity_type', 'intensive_review_generated')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching review sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch review sessions' }, { status: 500 })
    }

    const reviewSessions = data?.map(log => ({
      review_session: log.details?.review_session,
      target_items: log.details?.target_items,
      session_info: {
        length: log.details?.session_length,
        focus_type: log.details?.focus_type,
        items_count: log.details?.items_count
      },
      generated_at: log.timestamp
    })) || []

    return NextResponse.json({ review_sessions: reviewSessions })

  } catch (error) {
    console.error('Error in intensive review retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
