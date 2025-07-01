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
        error: 'AI study planning is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const { 
      vocabulary_grammar_score = 17,
      reading_score = 21,
      days_remaining = 4,
      hours_per_day = 8,
      weak_areas = []
    } = body

    // Get user's current weak areas if not provided
    let weakAreas = weak_areas
    if (weakAreas.length === 0) {
      const { data: weaknessReport } = await supabase
        .from('weakness_reports')
        .select('analysis_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (weaknessReport?.analysis_data?.focus_areas) {
        weakAreas = weaknessReport.analysis_data.focus_areas
      }
    }

    // Generate emergency study plan
    const studyPlan = await geminiService.generateEmergencyStudyPlan(
      {
        vocabulary_grammar: vocabulary_grammar_score,
        reading: reading_score
      },
      days_remaining,
      hours_per_day,
      weakAreas
    )

    // Save the study plan for user reference
    try {
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'emergency_study_plan_generated',
          details: {
            plan: studyPlan,
            input_scores: { vocabulary_grammar: vocabulary_grammar_score, reading: reading_score },
            days_remaining,
            hours_per_day,
            weak_areas: weakAreas
          }
        })
    } catch (logError) {
      console.error('Error logging study plan generation:', logError)
    }

    return NextResponse.json({ 
      study_plan: studyPlan,
      generated_at: new Date().toISOString(),
      user_context: {
        vocabulary_grammar_score,
        reading_score,
        days_remaining,
        hours_per_day,
        weak_areas: weakAreas
      }
    })

  } catch (error) {
    console.error('Error generating emergency study plan:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate emergency study plan' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the latest study plan
    const { data, error } = await supabase
      .from('activity_log')
      .select('details, timestamp')
      .eq('user_id', user.id)
      .eq('activity_type', 'emergency_study_plan_generated')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({ error: 'No study plan found' }, { status: 404 })
    }

    return NextResponse.json({ 
      study_plan: data.details?.plan,
      generated_at: data.timestamp,
      user_context: {
        vocabulary_grammar_score: data.details?.input_scores?.vocabulary_grammar,
        reading_score: data.details?.input_scores?.reading,
        days_remaining: data.details?.days_remaining,
        hours_per_day: data.details?.hours_per_day,
        weak_areas: data.details?.weak_areas
      }
    })

  } catch (error) {
    console.error('Error fetching study plan:', error)
    return NextResponse.json({ error: 'Failed to fetch study plan' }, { status: 500 })
  }
}
