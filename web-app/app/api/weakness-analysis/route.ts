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
        error: 'AI analysis is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const { report_type = 'on_demand', days_back = 30 } = body

    // Get user's recent activity data
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days_back)

    const { data: activityData } = await supabase
      .from('activity_log')
      .select(`
        activity_type,
        item_id,
        item_type,
        details,
        timestamp
      `)
      .eq('user_id', user.id)
      .in('activity_type', ['quiz_answer', 'flashcard_review'])
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100)

    if (!activityData || activityData.length === 0) {
      return NextResponse.json({ 
        error: 'Not enough activity data to generate analysis. Complete some quizzes or flashcard reviews first.' 
      }, { status: 400 })
    }

    // Get user's overall progress data
    const { data: progressData } = await supabase
      .from('user_progress')
      .select(`
        item_id,
        item_type,
        correct_count,
        incorrect_count,
        mastery_level,
        difficulty_rating
      `)
      .eq('user_id', user.id)
      .order('difficulty_rating', { ascending: false })
      .limit(50)

    if (!progressData || progressData.length === 0) {
      return NextResponse.json({ 
        error: 'No progress data found. Complete some practice sessions first.' 
      }, { status: 400 })
    }

    // Get item details for context
    const vocabItemIds = progressData.filter(p => p.item_type === 'vocab').map(p => p.item_id)
    const grammarItemIds = progressData.filter(p => p.item_type === 'grammar').map(p => p.item_id)

    const [vocabItems, grammarItems] = await Promise.all([
      vocabItemIds.length > 0 ? supabase
        .from('vocabulary_items')
        .select('id, term, reading, meaning_en, section')
        .in('id', vocabItemIds) : Promise.resolve({ data: [] }),
      grammarItemIds.length > 0 ? supabase
        .from('grammar_items')
        .select('id, term, reading, meaning_en')
        .in('id', grammarItemIds) : Promise.resolve({ data: [] })
    ])

    // Create lookup maps
    const itemLookup = new Map()
    vocabItems.data?.forEach(item => itemLookup.set(item.id, { ...item, type: 'vocab' }))
    grammarItems.data?.forEach(item => itemLookup.set(item.id, { ...item, type: 'grammar' }))

    // Format activity data for AI analysis
    const formattedActivityData = activityData.map(activity => ({
      item_type: activity.item_type,
      correct: activity.details?.correct === true,
      item_term: itemLookup.get(activity.item_id)?.term || 'Unknown',
      timestamp: activity.timestamp
    }))

    // Format progress data for AI analysis
    const formattedProgressData = progressData.map(progress => {
      const item = itemLookup.get(progress.item_id)
      return {
        item_type: progress.item_type,
        item_term: item?.term || 'Unknown',
        correct_count: progress.correct_count,
        incorrect_count: progress.incorrect_count,
        mastery_level: progress.mastery_level,
        accuracy: progress.correct_count / Math.max(1, progress.correct_count + progress.incorrect_count),
        section: item?.section || 'unknown'
      }
    })

    // Generate AI analysis
    const analysis = await geminiService.analyzeWeaknesses(
      formattedActivityData,
      formattedProgressData
    )

    // Save the analysis report
    const { data: savedReport, error: saveError } = await supabase
      .from('weakness_reports')
      .insert({
        user_id: user.id,
        report_type,
        analysis_data: analysis,
        recommendations: analysis.recommendations || [],
        focus_areas: analysis.focus_areas || [],
        generated_by: 'gemini-1.5-pro'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving weakness report:', saveError)
      // Still return the analysis even if saving fails
    }

    // Log the activity
    try {
      await fetch(`${request.nextUrl.origin}/api/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          activity_type: 'weakness_analysis_generated',
          details: {
            report_type,
            days_analyzed: days_back,
            activities_analyzed: activityData.length,
            progress_items_analyzed: progressData.length
          }
        })
      })
    } catch (logError) {
      console.error('Error logging weakness analysis:', logError)
    }

    return NextResponse.json({ 
      success: true,
      analysis,
      report_id: savedReport?.id,
      data_analyzed: {
        activities: activityData.length,
        progress_items: progressData.length,
        days_back
      }
    })

  } catch (error) {
    console.error('Error generating weakness analysis:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate weakness analysis' 
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
    const reportType = searchParams.get('report_type')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('weakness_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching weakness reports:', error)
      return NextResponse.json({ error: 'Failed to fetch weakness reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: data })

  } catch (error) {
    console.error('Error in weakness reports retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { report_id, is_read } = body

    if (!report_id) {
      return NextResponse.json({ error: 'report_id is required' }, { status: 400 })
    }

    // Update report read status
    const { data, error } = await supabase
      .from('weakness_reports')
      .update({ is_read })
      .eq('id', report_id)
      .eq('user_id', user.id) // Ensure user can only update their own reports
      .select()
      .single()

    if (error) {
      console.error('Error updating weakness report:', error)
      return NextResponse.json({ error: 'Failed to update weakness report' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Report not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      report: data 
    })

  } catch (error) {
    console.error('Error in weakness report update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
