import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      activity_type,
      item_id,
      item_type,
      details,
      session_id,
      response_time_ms,
      confidence_level
    } = body

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
    }

    // Generate session_id if not provided
    const actualSessionId = session_id || uuidv4()

    // Log the activity
    const { data: logData, error: logError } = await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        activity_type,
        item_id,
        item_type,
        details: details || {},
        session_id: actualSessionId,
        response_time_ms,
        confidence_level
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging activity:', logError)
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
    }

    // Update user progress if this is a quiz answer or flashcard review
    if (activity_type === 'quiz_answer' || activity_type === 'flashcard_review') {
      if (!item_id || !item_type) {
        return NextResponse.json({ error: 'item_id and item_type required for progress tracking' }, { status: 400 })
      }

      const isCorrect = details?.correct === true
      
      // Get existing progress or create new entry
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_id', item_id)
        .eq('item_type', item_type)
        .single()

      if (existingProgress) {
        // Update existing progress
        const newCorrectCount = existingProgress.correct_count + (isCorrect ? 1 : 0)
        const newIncorrectCount = existingProgress.incorrect_count + (isCorrect ? 0 : 1)
        const totalAttempts = newCorrectCount + newIncorrectCount
        const accuracy = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0

        // Determine mastery level based on performance
        let masteryLevel = existingProgress.mastery_level
        if (accuracy >= 0.9 && totalAttempts >= 5) {
          masteryLevel = 'mastered'
        } else if (accuracy >= 0.7 && totalAttempts >= 3) {
          masteryLevel = 'review'
        } else if (totalAttempts >= 1) {
          masteryLevel = 'learning'
        }

        // Calculate next review date (simplified spaced repetition)
        const nextReviewAt = new Date()
        if (isCorrect) {
          const multiplier = masteryLevel === 'mastered' ? 7 : masteryLevel === 'review' ? 3 : 1
          nextReviewAt.setDate(nextReviewAt.getDate() + multiplier)
        } else {
          nextReviewAt.setDate(nextReviewAt.getDate() + 1) // Review again tomorrow if incorrect
        }

        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            correct_count: newCorrectCount,
            incorrect_count: newIncorrectCount,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: nextReviewAt.toISOString(),
            mastery_level: masteryLevel,
            difficulty_rating: 1 - accuracy // Higher difficulty for lower accuracy
          })
          .eq('user_id', user.id)
          .eq('item_id', item_id)
          .eq('item_type', item_type)

        if (updateError) {
          console.error('Error updating progress:', updateError)
        }
      } else {
        // Create new progress entry
        const nextReviewAt = new Date()
        nextReviewAt.setDate(nextReviewAt.getDate() + (isCorrect ? 3 : 1))

        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            item_id,
            item_type,
            correct_count: isCorrect ? 1 : 0,
            incorrect_count: isCorrect ? 0 : 1,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: nextReviewAt.toISOString(),
            mastery_level: 'learning',
            difficulty_rating: isCorrect ? 0.3 : 0.7
          })

        if (insertError) {
          console.error('Error creating progress:', insertError)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      activity_id: logData.id,
      session_id: actualSessionId 
    })

  } catch (error) {
    console.error('Error in activity logging:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const activityType = searchParams.get('activity_type')
    const itemType = searchParams.get('item_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sessionId = searchParams.get('session_id')

    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching activity log:', error)
      return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
    }

    return NextResponse.json({ activities: data })

  } catch (error) {
    console.error('Error in activity log retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
