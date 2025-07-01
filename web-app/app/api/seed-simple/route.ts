import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { section, data, admin_key } = body
    
    // Simple admin key check
    if (admin_key !== 'seed-initial-data-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!section || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    const supabase = await createClient()
    let insertedCount = 0
    
    try {
      if (section === 'vocabulary' || section === 'word') {
        // Insert vocabulary items
        for (const item of data) {
          const { error } = await supabase
            .from('vocabulary_items')
            .insert({
              term: item.term,
              reading: item.reading || '',
              meaning_en: item.meaning_en,
              meaning_vi: item.meaning_vi || '',
              example_jp: item.example_jp || '',
              section: 'word'
            })
          
          if (!error) insertedCount++
        }
      } else if (section === 'grammar') {
        // Insert grammar items
        for (const item of data) {
          const { error } = await supabase
            .from('grammar_items')
            .insert({
              term: item.term,
              reading: item.reading || '',
              meaning_en: item.meaning_en,
              meaning_vi: item.meaning_vi || '',
              example_jp: item.example_jp || '',
              section: 'grammar'
            })
          
          if (!error) insertedCount++
        }
      } else if (section === 'tips') {
        // Insert tips
        for (const item of data) {
          const { error } = await supabase
            .from('tips')
            .insert({
              section: item.section,
              tip_text: item.tip_text
            })
          
          if (!error) insertedCount++
        }
      } else if (section === 'vocab_questions') {
        // Insert vocabulary questions
        for (const item of data) {
          // Parse options if it's a string
          let options = item.options
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options)
            } catch {
              console.error('Failed to parse options:', options)
              continue
            }
          }
          
          const { error } = await supabase
            .from('vocab_questions')
            .insert({
              vocabulary_item_id: item.vocabulary_item_id,
              question_text: item.question_text,
              options: options,
              answer_index: parseInt(item.answer_index),
              explanation: item.explanation
            })
          
          if (!error) insertedCount++
        }
      } else if (section === 'grammar_questions') {
        // Insert grammar questions
        for (const item of data) {
          // Parse options if it's a string
          let options = item.options
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options)
            } catch {
              console.error('Failed to parse options:', options)
              continue
            }
          }
          
          const { error } = await supabase
            .from('grammar_questions')
            .insert({
              grammar_item_id: item.grammar_item_id,
              question_text: item.question_text,
              options: options,
              answer_index: parseInt(item.answer_index),
              explanation: item.explanation
            })
          
          if (!error) insertedCount++
        }
      } else {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
      }
      
      return NextResponse.json({ 
        success: true, 
        imported_count: insertedCount,
        total_items: data.length 
      })
      
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Database error', 
        imported_count: insertedCount,
        details: dbError 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
