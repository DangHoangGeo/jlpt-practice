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
    const filter = searchParams.get('filter') || 'all' // 'due', 'new', 'all', 'difficult', 'ai-generated'
    const search = searchParams.get('search') || '' // search term
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
      
      // Apply search filter if provided
      if (search) {
        query = query.or(
          `vocabulary_items.term.ilike.%${search}%,vocabulary_items.reading.ilike.%${search}%,vocabulary_items.meaning_en.ilike.%${search}%`,
          { foreignTable: 'vocabulary_items' }
        )
      }
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
      
      // Apply search filter if provided
      if (search) {
        query = query.or(
          `grammar_items.term.ilike.%${search}%,grammar_items.reading.ilike.%${search}%,grammar_items.meaning_en.ilike.%${search}%`,
          { foreignTable: 'grammar_items' }
        )
      }
    }
    
    // Apply filtering based on user progress
    if (filter === 'due' || filter === 'new' || filter === 'difficult' || filter === 'ai-generated') {
      console.log('Filtering by:', filter, 'for section:', section, 'user:', userId)
      
      // Get quiz progress from user_progress table (not flashcard_progress)
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('item_id, next_review_at, mastery_level, correct_count, incorrect_count, last_reviewed_at')
        .eq('user_id', userId)
        .eq('item_type', section)
      
      if (progressError) {
        console.error('Progress fetch error:', progressError)
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
      }
      
      console.log('Quiz progress data:', progressData?.length, 'records')
      const progressMap = new Map(progressData.map(p => [p.item_id, p]))
      
      // Get AI-generated questions if filter is ai-generated
      if (filter === 'ai-generated') {
        const { data: aiQuestions, error: aiError } = await supabase
          .from('ai_generated_questions')
          .select('*')
          .eq('user_id', userId)
          .eq('item_type', section)
          .limit(limit)
        
        if (aiError) {
          console.error('AI questions fetch error:', aiError)
          return NextResponse.json({ error: 'Failed to fetch AI questions' }, { status: 500 })
        }
        
        return NextResponse.json({ questions: aiQuestions || [] })
      }
      
      const { data: questionsData, error: questionsError } = await query.limit(limit * 5) // Get more to filter and randomize
      
      if (questionsError) {
        console.error('Questions fetch error:', questionsError)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
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
          const isDue = progress.next_review_at <= today && progress.mastery_level !== 'mastered'
          console.log(`Due check: next_review_at=${progress.next_review_at}, today=${today}, mastery_level=${progress.mastery_level}, result=${isDue}`)
          return isDue
        } else if (filter === 'difficult') {
          if (!progress) return false // Need progress data to determine difficulty
          const totalAttempts = progress.correct_count + progress.incorrect_count
          const accuracy = totalAttempts > 0 ? progress.correct_count / totalAttempts : 1
          const isDifficult = accuracy < 0.6 && totalAttempts >= 3 // Less than 60% accuracy with at least 3 attempts
          console.log(`Difficult check: accuracy=${accuracy}, attempts=${totalAttempts}, result=${isDifficult}`)
          return isDifficult
        }
        return true
      }) || []
      
      console.log('Filtered questions:', filteredQuestions.length, 'after filtering')
      
      // Randomize the questions to avoid same order every time
      filteredQuestions = filteredQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
      
      console.log('Final questions:', filteredQuestions.length, 'after randomization and limit')
      console.log('Sample question:', filteredQuestions[0] ? JSON.stringify(filteredQuestions[0], null, 2) : 'none')
      
      return NextResponse.json({ questions: filteredQuestions })
    } else {
      // Return all questions with randomization
      console.log('Fetching all questions for section:', section, 'limit:', limit)
      const { data, error } = await query.limit(limit * 3) // Get more for randomization
      
      if (error) {
        console.error('Questions fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      
      // Randomize and limit the results
      const randomizedQuestions = (data || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
      
      console.log('All questions data:', randomizedQuestions?.length, 'records found after randomization')
      return NextResponse.json({ questions: randomizedQuestions })
    }
    
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
