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
            term,
            reading,
            meaning_en,
            meaning_vi,
            example_jp,
            section
          )
        `)
    }
    
    // Apply filtering based on user progress
    if (filter === 'due' || filter === 'new') {
      console.log('Filtering by:', filter, 'for section:', section, 'user:', userId)
      
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
      
      console.log('Progress data:', progressData?.length, 'records')
      const progressMap = new Map(progressData.map(p => [p.item_id, p]))
      
      const { data: questionsData, error: questionsError } = await query.limit(limit * 3) // Get more to filter
      
      if (questionsError) {
        console.error('Questions fetch error:', questionsError)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
      console.log('Questions data:', questionsData?.length, 'records found')
      console.log('Sample question structure:', questionsData?.[0] ? JSON.stringify(questionsData[0], null, 2) : 'none')
      console.log('Progress map keys:', Array.from(progressMap.keys()))
      
      let filteredQuestions = questionsData?.filter(q => {
        const itemId = section === 'vocab' ? q.vocabulary_item_id : q.grammar_item_id
        const progress = progressMap.get(itemId)
        
        console.log(`Question ${q.id}: itemId=${itemId}, hasProgress=${!!progress}`)
        if (progress) {
          console.log(`Progress for ${itemId}:`, progress)
        }
        
        if (filter === 'new') {
          const result = !progress // No progress record = new
          console.log(`New filter result: ${result}`)
          return result
        } else if (filter === 'due') {
          if (!progress) {
            console.log(`No progress, marking as due`)
            return true // New items are also due
          }
          const today = new Date().toISOString().split('T')[0]
          const isDue = progress.next_review <= today && !progress.is_mastered
          console.log(`Due check: next_review=${progress.next_review}, today=${today}, is_mastered=${progress.is_mastered}, result=${isDue}`)
          return isDue
        }
        return true
      }) || []
      
      console.log('Filtered questions:', filteredQuestions.length, 'after filtering')
      
      // Limit after filtering
      filteredQuestions = filteredQuestions.slice(0, limit)
      
      console.log('Final questions:', filteredQuestions.length, 'after limit')
      console.log('Sample question:', filteredQuestions[0] ? JSON.stringify(filteredQuestions[0], null, 2) : 'none')
      
      return NextResponse.json({ questions: filteredQuestions })
    } else {
      // Return all questions
      console.log('Fetching all questions for section:', section, 'limit:', limit)
      const { data, error } = await query.limit(limit)
      
      if (error) {
        console.error('Questions fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
      console.log('All questions data:', data?.length, 'records found')
      return NextResponse.json({ questions: data || [] })
    }
    
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
