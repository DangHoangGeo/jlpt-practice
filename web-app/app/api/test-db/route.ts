import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'vocab'
    const limit = parseInt(searchParams.get('limit') || '5')
    
    console.log('Testing section:', section, 'limit:', limit)
    
    // Test direct table access first
    if (section === 'vocab') {
      // Test vocabulary items
      const { data: vocabItems, error: vocabError } = await supabase
        .from('vocabulary_items')
        .select('*')
        .limit(3)
      
      console.log('Vocabulary items:', vocabItems?.length, 'records')
      if (vocabError) console.error('Vocab items error:', vocabError)
      
      // Test vocabulary questions
      const { data: vocabQuestions, error: vocabQuestionsError } = await supabase
        .from('vocab_questions')
        .select('*')
        .limit(3)
      
      console.log('Vocabulary questions:', vocabQuestions?.length, 'records')
      if (vocabQuestionsError) console.error('Vocab questions error:', vocabQuestionsError)
      
      // Test the join query
      const { data: joinedData, error: joinError } = await supabase
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
        .limit(limit)
      
      console.log('Joined data:', joinedData?.length, 'records')
      if (joinError) console.error('Join error:', joinError)
      
      return NextResponse.json({
        section: 'vocab',
        vocabulary_items: vocabItems?.length || 0,
        vocab_questions: vocabQuestions?.length || 0,
        joined_data: joinedData?.length || 0,
        sample_joined: joinedData?.[0] || null,
        errors: {
          vocabError,
          vocabQuestionsError,
          joinError
        }
      })
      
    } else {
      // Test grammar items
      const { data: grammarItems, error: grammarError } = await supabase
        .from('grammar_items')
        .select('*')
        .limit(3)
      
      console.log('Grammar items:', grammarItems?.length, 'records')
      if (grammarError) console.error('Grammar items error:', grammarError)
      
      // Test grammar questions
      const { data: grammarQuestions, error: grammarQuestionsError } = await supabase
        .from('grammar_questions')
        .select('*')
        .limit(3)
      
      console.log('Grammar questions:', grammarQuestions?.length, 'records')
      if (grammarQuestionsError) console.error('Grammar questions error:', grammarQuestionsError)
      
      // Test the join query
      const { data: joinedData, error: joinError } = await supabase
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
        .limit(limit)
      
      console.log('Joined data:', joinedData?.length, 'records')
      if (joinError) console.error('Join error:', joinError)
      
      return NextResponse.json({
        section: 'grammar',
        grammar_items: grammarItems?.length || 0,
        grammar_questions: grammarQuestions?.length || 0,
        joined_data: joinedData?.length || 0,
        sample_joined: joinedData?.[0] || null,
        errors: {
          grammarError,
          grammarQuestionsError,
          joinError
        }
      })
    }
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
