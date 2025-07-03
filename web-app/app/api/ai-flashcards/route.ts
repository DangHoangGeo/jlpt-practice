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
        error: 'AI flashcard generation is not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      section,
      count = 10,
      difficulty = 'medium',
      focus_areas = []
    } = body

    // Validate required fields
    if (!section || !['vocab', 'grammar'].includes(section)) {
      return NextResponse.json({ 
        error: 'section must be either "vocab" or "grammar"' 
      }, { status: 400 })
    }

    if (count < 1 || count > 20) {
      return NextResponse.json({ 
        error: 'count must be between 1 and 20' 
      }, { status: 400 })
    }

    // Get user's learning data for personalization
    let userItems = []
    
    if (section === 'vocab') {
      // Get user's difficult vocabulary items
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          item_id,
          interval,
          easiness,
          vocabulary_items!inner (
            term,
            reading,
            meaning_en,
            meaning_vi,
            example_jp
          )
        `)
        .eq('user_id', user.id)
        .eq('item_type', 'vocab')
        .lt('easiness', 2.5)
        .limit(count)

      if (progressData && progressData.length > 0) {
        userItems = progressData.map(p => ({
          term: p.vocabulary_items[0].term,
          reading: p.vocabulary_items[0].reading,
          meaning_en: p.vocabulary_items[0].meaning_en,
          meaning_vi: p.vocabulary_items[0].meaning_vi,
          example_jp: p.vocabulary_items[0].example_jp,
          type: 'vocab' as const,
          difficulty: p.easiness < 2.0 ? 'hard' : p.easiness < 2.5 ? 'medium' : 'easy'
        }))
      } else {
        // If no user progress data, get sample items from database
        const { data: sampleItems } = await supabase
          .from('vocabulary_items')
          .select('term, reading, meaning_en, meaning_vi, example_jp')
          .order('created_at', { ascending: false })
          .limit(count)

        if (sampleItems) {
          userItems = sampleItems.map(item => ({
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            meaning_vi: item.meaning_vi,
            example_jp: item.example_jp,
            type: 'vocab' as const,
            difficulty: difficulty as 'easy' | 'medium' | 'hard'
          }))
        }
      }
    } else {
      // Get user's difficult grammar items
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          item_id,
          interval,
          easiness,
          grammar_items!inner (
            term,
            reading,
            meaning_en,
            meaning_vi,
            example_jp
          )
        `)
        .eq('user_id', user.id)
        .eq('item_type', 'grammar')
        .lt('easiness', 2.5)
        .limit(count)

      if (progressData && progressData.length > 0) {
        userItems = progressData.map(p => ({
          term: p.grammar_items[0].term,
          reading: p.grammar_items[0].reading,
          meaning_en: p.grammar_items[0].meaning_en,
          meaning_vi: p.grammar_items[0].meaning_vi,
          example_jp: p.grammar_items[0].example_jp,
          type: 'grammar' as const,
          difficulty: p.easiness < 2.0 ? 'hard' : p.easiness < 2.5 ? 'medium' : 'easy'
        }))
      } else {
        // If no user progress data, get sample items from database
        const { data: sampleItems } = await supabase
          .from('grammar_items')
          .select('term, reading, meaning_en, meaning_vi, example_jp')
          .order('created_at', { ascending: false })
          .limit(count)

        if (sampleItems) {
          userItems = sampleItems.map(item => ({
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            meaning_vi: item.meaning_vi,
            example_jp: item.example_jp,
            type: 'grammar' as const,
            difficulty: difficulty as 'easy' | 'medium' | 'hard'
          }))
        }
      }
    }

    if (userItems.length === 0) {
      return NextResponse.json({ 
        error: 'No items available for flashcard generation' 
      }, { status: 404 })
    }

    // Generate new vocabulary/grammar items using AI
    const newItems = await geminiService.generateNewStudyItems(
      'N1', // userLevel - could be made dynamic
      section,
      count,
      difficulty as 'easy' | 'medium' | 'hard',
      focus_areas
    )

    // Store generated items in database
    const itemInserts = newItems.map((item: {
      term: string;
      reading?: string;
      meaning_en: string;
      meaning_vi?: string;
      example_jp?: string;
      type: string;
    }) => ({
      term: item.term,
      reading: item.reading || '',
      meaning_en: item.meaning_en,
      meaning_vi: item.meaning_vi || '',
      example_jp: item.example_jp || '',
      section: section === 'vocab' ? 'word' : 'grammar',
      // Mark as AI-generated for tracking
      source: 'ai-generated'
    }))

    let insertedItems = []
    
    if (section === 'vocab') {
      const { data: inserted, error: insertError } = await supabase
        .from('vocabulary_items')
        .insert(itemInserts)
        .select('*')

      if (insertError) {
        console.warn('Failed to store generated vocabulary items:', insertError)
        // Return generated items without storing
        insertedItems = newItems.map((item: {
          term: string;
          reading?: string;
          meaning_en: string;
          meaning_vi?: string;
          example_jp?: string;
        }, index: number) => ({
          id: `ai-generated-vocab-${Date.now()}-${index}`,
          ...item,
          section: 'word'
        }))
      } else {
        insertedItems = inserted || []
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('grammar_items')
        .insert(itemInserts)
        .select('*')

      if (insertError) {
        console.warn('Failed to store generated grammar items:', insertError)
        // Return generated items without storing
        insertedItems = newItems.map((item: {
          term: string;
          reading?: string;
          meaning_en: string;
          meaning_vi?: string;
          example_jp?: string;
        }, index: number) => ({
          id: `ai-generated-grammar-${Date.now()}-${index}`,
          ...item,
          section: 'grammar'
        }))
      } else {
        insertedItems = inserted || []
      }
    }

    // Format as flashcards
    const flashcards = insertedItems.map((item: {
      id: string;
      term: string;
      reading?: string;
      meaning_en: string;
      meaning_vi?: string;
      example_jp?: string;
      section: string;
    }) => ({
      id: item.id,
      term: item.term,
      reading: item.reading,
      meaning_en: item.meaning_en,
      meaning_vi: item.meaning_vi,
      example_jp: item.example_jp,
      section: item.section,
      progress: null // New items have no progress yet
    }))

    return NextResponse.json({ 
      success: true,
      flashcards,
      generated_count: flashcards.length,
      source: 'ai-generated'
    })

  } catch (error) {
    console.error('Error generating AI flashcards:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate flashcards' 
    }, { status: 500 })
  }
}
