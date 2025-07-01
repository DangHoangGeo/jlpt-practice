import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') // 'vocab' or 'grammar'
    const filter = searchParams.get('filter') || 'all' // 'due', 'new', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = user.id
    
    if (!section || !['vocab', 'grammar'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 })
    }
    
    let query
    
    if (section === 'vocab') {
      query = supabase
        .from('vocab_questions')
        .select(`
          *,
          vocabulary_items!inner (
            id,
            term,
            reading,
            meaning_en,
            meaning_vi,
            example_jp,
            section
          )
        `)
    } else {
      query = supabase
        .from('grammar_questions')
        .select(`
          *,
          grammar_items!inner (
            id,
            pattern,
            description,
            example
          )
        `)
    }
    
    // Apply filtering based on user progress
    if (filter === 'due' || filter === 'new') {
      // Join with flashcard_progress to filter by review status
      const { data: progressData, error: progressError } = await supabase
        .from('flashcard_progress')
        .select('item_id, next_review, is_mastered')
        .eq('user_id', userId)
        .eq('item_type', section)
      
      if (progressError) {
        console.error('Progress fetch error:', progressError)
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
      }
      
      const progressMap = new Map(progressData.map(p => [p.item_id, p]))
      
      const { data: questionsData, error: questionsError } = await query.limit(limit * 3) // Get more to filter
      
      if (questionsError) {
        console.error('Questions fetch error:', questionsError)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
      let filteredQuestions = questionsData?.filter(q => {
        const itemId = section === 'vocab' ? q.vocabulary_item_id : q.grammar_item_id
        const progress = progressMap.get(itemId)
        
        if (filter === 'new') {
          return !progress // No progress record = new
        } else if (filter === 'due') {
          if (!progress) return true // New items are also due
          const today = new Date().toISOString().split('T')[0]
          return progress.next_review <= today && !progress.is_mastered
        }
        return true
      }) || []
      
      // Limit after filtering
      filteredQuestions = filteredQuestions.slice(0, limit)
      
      return NextResponse.json({ questions: filteredQuestions })
    } else {
      // Return all questions
      const { data, error } = await query.limit(limit)
      
      if (error) {
        console.error('Questions fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
      return NextResponse.json({ questions: data || [] })
    }
    
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
