import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

interface VocabularyItem {
  term: string
  reading: string
  meaning_en: string
  meaning_vi: string
  example_jp: string
}

interface GrammarItem {
  term: string
  reading: string
  meaning_en: string
  meaning_vi: string
  example_jp: string
  section: string
}

interface Question {
  vocabulary_item_id?: string
  grammar_item_id?: string
  question_text: string
  options: string[]
  answer_index: number
  explanation: string
}

interface Tip {
  section: string
  tip_text: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { section, source, raw_data } = body
    
    if (!section || !source || !raw_data) {
      return NextResponse.json(
        { error: 'Missing required fields: section, source, raw_data' }, 
        { status: 400 }
      )
    }
    
    // Insert into import_batches
    const { data: batchData, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        section,
        source,
        raw_data
      })
      .select('id')
      .single()
    
    if (batchError) {
      console.error('Batch insert error:', batchError)
      return NextResponse.json({ error: 'Failed to create import batch' }, { status: 500 })
    }
    
    const batchId = batchData.id
    
    // Process different section types
    switch (section) {
      case 'kanji':
      case 'word':
      case 'phrase':
        await processVocabularyItems(supabase, raw_data, section, batchId)
        break
        
      case 'grammar':
        await processGrammarItems(supabase, raw_data, batchId)
        break
        
      case 'vocab_questions':
        await processVocabQuestions(supabase, raw_data, batchId)
        break
        
      case 'grammar_questions':
        await processGrammarQuestions(supabase, raw_data, batchId)
        break
        
      case 'tips':
        await processTips(supabase, raw_data, batchId)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid section type' }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      batch_id: batchId,
      imported_count: Array.isArray(raw_data) ? raw_data.length : 1
    })
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processVocabularyItems(supabase: SupabaseClient, items: VocabularyItem[], section: string, batchId: string) {
  const vocabularyItems = items.map(item => ({
    term: item.term,
    reading: item.reading,
    meaning_en: item.meaning_en,
    meaning_vi: item.meaning_vi,
    example_jp: item.example_jp,
    section,
    import_batch: batchId
  }))
  
  const { error } = await supabase
    .from('vocabulary_items')
    .upsert(vocabularyItems, { 
      onConflict: 'term,section',
      ignoreDuplicates: false 
    })
  
  if (error) {
    throw new Error(`Failed to insert vocabulary items: ${error.message}`)
  }
}

async function processGrammarItems(supabase: SupabaseClient, items: GrammarItem[], batchId: string) {
  const grammarItems = items.map(item => ({
    term: item.term,
    reading: item.reading,
    meaning_en: item.meaning_en,
    meaning_vi: item.meaning_vi,
    example_jp: item.example_jp,
    section: item.section,
    import_batch: batchId
  }))
  
  const { error } = await supabase
    .from('grammar_items')
    .upsert(grammarItems, { 
      onConflict: 'term',
      ignoreDuplicates: false 
    })
  
  if (error) {
    throw new Error(`Failed to insert grammar items: ${error.message}`)
  }
}

async function processVocabQuestions(supabase: SupabaseClient, questions: Question[], batchId: string) {
  const { error } = await supabase
    .from('vocab_questions')
    .insert(questions.map(q => ({
      vocabulary_item_id: q.vocabulary_item_id,
      question_text: q.question_text,
      options: q.options,
      answer_index: q.answer_index,
      explanation: q.explanation,
      import_batch: batchId
    })))
  
  if (error) {
    throw new Error(`Failed to insert vocab questions: ${error.message}`)
  }
}

async function processGrammarQuestions(supabase: SupabaseClient, questions: Question[], batchId: string) {
  const { error } = await supabase
    .from('grammar_questions')
    .insert(questions.map(q => ({
      grammar_item_id: q.grammar_item_id,
      question_text: q.question_text,
      options: q.options,
      answer_index: q.answer_index,
      explanation: q.explanation,
      import_batch: batchId
    })))
  
  if (error) {
    throw new Error(`Failed to insert grammar questions: ${error.message}`)
  }
}

async function processTips(supabase: SupabaseClient, tips: Tip[], batchId: string) {
  const tipItems = tips.map(tip => ({
    section: tip.section,
    tip_text: tip.tip_text,
    import_batch: batchId
  }))
  
  const { error } = await supabase
    .from('section_tips')
    .insert(tipItems)
  
  if (error) {
    throw new Error(`Failed to insert tips: ${error.message}`)
  }
}
