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
        error: 'AI question generation is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      item_type = 'vocab', // 'vocab' or 'grammar'
      difficulty = 'medium', // 'easy', 'medium', 'hard'
      count = 5,
      focus_areas = [], // specific weak areas to focus on
      use_user_weak_items = true
    } = body

    // Get user's weak items if requested
    let targetItems: Array<{
      id: string;
      term: string;
      reading: string;
      meaning_en: string;
      type: 'vocab' | 'grammar';
      difficulty?: 'easy' | 'medium' | 'hard';
    }> = []
    
    if (use_user_weak_items) {
      // Get items where user has low accuracy or hasn't mastered
      const { data: weakProgressItems } = await supabase
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
        .eq('item_type', item_type)
        .or('mastery_level.eq.learning,mastery_level.eq.new')
        .order('difficulty_rating', { ascending: false })
        .limit(20)

      if (weakProgressItems && weakProgressItems.length > 0) {
        // Get the actual items data
        const itemIds = weakProgressItems.map(p => p.item_id)
        
        if (item_type === 'vocab') {
          const { data: vocabItems } = await supabase
            .from('vocabulary_items')
            .select('id, term, reading, meaning_en')
            .in('id', itemIds)
          
          targetItems = vocabItems?.map(item => ({
            id: item.id,
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            type: 'vocab'
          })) || []
        } else {
          const { data: grammarItems } = await supabase
            .from('grammar_items')
            .select('id, term, reading, meaning_en')
            .in('id', itemIds)
          
          targetItems = grammarItems?.map(item => ({
            id: item.id,
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            type: 'grammar'
          })) || []
        }
      }
    }

    // If no weak items or not using them, get random items
    if (targetItems.length === 0) {
      if (item_type === 'vocab') {
        const { data: vocabItems } = await supabase
          .from('vocabulary_items')
          .select('id, term, reading, meaning_en')
          .order('created_at', { ascending: false })
          .limit(count * 2) // Get more than needed for variety

        targetItems = vocabItems?.slice(0, count).map(item => ({
          id: item.id,
          term: item.term,
          reading: item.reading,
          meaning_en: item.meaning_en,
          type: 'vocab'
        })) || []
      } else {
        const { data: grammarItems } = await supabase
          .from('grammar_items')
          .select('id, term, reading, meaning_en')
          .order('created_at', { ascending: false })
          .limit(count * 2)

        targetItems = grammarItems?.slice(0, count).map(item => ({
          id: item.id,
          term: item.term,
          reading: item.reading,
          meaning_en: item.meaning_en,
          type: 'grammar'
        })) || []
      }
    }

    if (targetItems.length === 0) {
      return NextResponse.json({ 
        error: `No ${item_type} items found to generate questions from` 
      }, { status: 404 })
    }

    // Use only the items we need for generation
    const itemsForGeneration = targetItems.slice(0, count)

    // Generate questions using Gemini
    const generatedQuestions = await geminiService.generatePracticeQuestions(
      itemsForGeneration,
      count,
      difficulty as 'easy' | 'medium' | 'hard'
    )

    // Save generated questions to database
    const questionsToSave = generatedQuestions.map((q: {
      question_text: string;
      options: string[];
      answer_index: number;
      explanation: string;
      difficulty_level: string;
    }, index: number) => ({
      user_id: user.id,
      item_id: itemsForGeneration[index]?.id || null,
      item_type,
      question_text: q.question_text,
      options: q.options,
      answer_index: q.answer_index,
      explanation: q.explanation,
      difficulty_level: q.difficulty_level || difficulty,
      generation_prompt: `Generate ${count} unique JLPT N1 ${item_type} questions`,
      ai_model: 'gemini-1.5-pro'
    }))

    const { data: savedQuestions, error: saveError } = await supabase
      .from('ai_generated_questions')
      .insert(questionsToSave)
      .select()

    if (saveError) {
      console.error('Error saving AI questions:', saveError)
      // Still return the questions even if saving fails
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
          activity_type: 'ai_questions_generated',
          details: {
            item_type,
            difficulty,
            count: generatedQuestions.length,
            focus_areas,
            weak_items_used: use_user_weak_items
          }
        })
      })
    } catch (logError) {
      console.error('Error logging AI question generation:', logError)
    }

    return NextResponse.json({ 
      success: true,
      questions: generatedQuestions,
      saved_questions: savedQuestions || [],
      items_used: itemsForGeneration
    })

  } catch (error) {
    console.error('Error generating AI questions:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate questions' 
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
    const itemType = searchParams.get('item_type')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('ai_generated_questions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching AI questions:', error)
      return NextResponse.json({ error: 'Failed to fetch AI questions' }, { status: 500 })
    }

    return NextResponse.json({ questions: data })

  } catch (error) {
    console.error('Error in AI questions retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
