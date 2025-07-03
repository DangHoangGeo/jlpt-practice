import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Get due items count
    const { count: vocabDueCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('item_type', 'vocab')
      .lte('next_review_at', today)
      .neq('mastery_level', 'mastered')

    const { count: grammarDueCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('item_type', 'grammar')
      .lte('next_review_at', today)
      .neq('mastery_level', 'mastered')

    // Get mastered items count
    const { count: vocabMasteredCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('item_type', 'vocab')
      .eq('mastery_level', 'mastered')

    const { count: grammarMasteredCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('item_type', 'grammar')
      .eq('mastery_level', 'mastered')

    // Get today's and weekly study count
    const { count: todayStudyCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('activity_type', ['quiz_answer', 'flashcard_review'])
      .gte('timestamp', today)

    // Get weekly study count
    const { count: weeklyStudyCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('activity_type', ['quiz_answer', 'flashcard_review'])
      .gte('timestamp', weekAgo.toISOString())

    // Calculate weekly accuracy
    const { data: weeklyActivities } = await supabase
      .from('activity_log')
      .select('details')
      .eq('user_id', user.id)
      .in('activity_type', ['quiz_answer', 'flashcard_review'])
      .gte('timestamp', weekAgo.toISOString())

    let correctAnswers = 0
    let totalAnswers = 0
    weeklyActivities?.forEach(activity => {
      if (activity.details && typeof activity.details.correct === 'boolean') {
        totalAnswers++
        if (activity.details.correct) {
          correctAnswers++
        }
      }
    })

    const weeklyAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

    // Calculate streak (simplified - consecutive days with activity)
    let streakDays = 0
    const currentDate = new Date()
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(currentDate)
      checkDate.setDate(checkDate.getDate() - i)
      const dateString = checkDate.toISOString().split('T')[0]
      
      const { count } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('activity_type', ['quiz_answer', 'flashcard_review'])
        .gte('timestamp', dateString)
        .lt('timestamp', new Date(checkDate.getTime() + 24 * 60 * 60 * 1000).toISOString())

      if (count && count > 0) {
        streakDays++
      } else {
        break // Streak broken
      }
    }

    return NextResponse.json({
      vocab_due: vocabDueCount || 0,
      grammar_due: grammarDueCount || 0,
      vocab_mastered: vocabMasteredCount || 0,
      grammar_mastered: grammarMasteredCount || 0,
      streak_days: streakDays,
      total_studied_today: todayStudyCount || 0,
      weekly_studied: weeklyStudyCount || 0,
      weekly_accuracy: Math.round(weeklyAccuracy)
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
