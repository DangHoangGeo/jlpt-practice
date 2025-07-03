import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SupabaseClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get pending missing questions for the user
    const { data: missingQuestions, error } = await supabase
      .from('missing_questions_queue')
      .select(`
        *,
        vocabulary_items!left (
          term,
          reading,
          meaning_en,
          meaning_vi,
          example_jp
        ),
        grammar_items!left (
          term,
          reading,
          meaning_en,
          meaning_vi,
          example_jp
        )
      `)
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('requested_at', { ascending: true })
    
    if (error) {
      console.error('Missing questions fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch missing questions' }, { status: 500 })
    }
    
    return NextResponse.json({ missing_questions: missingQuestions || [] })
    
  } catch (error) {
    console.error('Missing questions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
    const { item_id, item_type, priority = 3 } = body
    
    if (!item_id || !item_type) {
      return NextResponse.json({ error: 'item_id and item_type are required' }, { status: 400 })
    }
    
    // Add to queue
    const { data: queueItem, error: queueError } = await supabase
      .from('missing_questions_queue')
      .insert({
        user_id: user.id,
        item_id,
        item_type,
        priority
      })
      .select()
      .single()
    
    if (queueError) {
      // If already exists, update priority
      if (queueError.code === '23505') {
        const { data: updatedItem, error: updateError } = await supabase
          .from('missing_questions_queue')
          .update({ priority, status: 'pending' })
          .eq('user_id', user.id)
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .select()
          .single()
        
        if (updateError) {
          console.error('Queue update error:', updateError)
          return NextResponse.json({ error: 'Failed to update queue item' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, queue_item: updatedItem })
      } else {
        console.error('Queue insertion error:', queueError)
        return NextResponse.json({ error: 'Failed to add to queue' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true, queue_item: queueItem })
    
  } catch (error) {
    console.error('Missing questions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { queue_id, generate_now = false } = body
    
    if (!queue_id) {
      return NextResponse.json({ error: 'queue_id is required' }, { status: 400 })
    }
    
    if (generate_now) {
      return await generateQuestionForItem(supabase, user.id, queue_id)
    }
    
    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
    
  } catch (error) {
    console.error('Missing questions PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateQuestionForItem(supabase: SupabaseClient, userId: string, queueId: string) {
  // Get the queue item with item details
  const { data: queueItem, error: queueError } = await supabase
    .from('missing_questions_queue')
    .select(`
      *,
      vocabulary_items!left (
        term,
        reading,
        meaning_en,
        meaning_vi,
        example_jp,
        section
      ),
      grammar_items!left (
        term,
        reading,
        meaning_en,
        meaning_vi,
        example_jp,
        section
      )
    `)
    .eq('id', queueId)
    .eq('user_id', userId)
    .single()
  
  if (queueError) {
    return NextResponse.json({ error: 'Queue item not found' }, { status: 404 })
  }
  
  // Update status to generating
  await supabase
    .from('missing_questions_queue')
    .update({ status: 'generating' })
    .eq('id', queueId)
  
  try {
    const item = queueItem.item_type === 'vocab' ? queueItem.vocabulary_items : queueItem.grammar_items
    
    if (!item) {
      throw new Error('Item data not found')
    }
    
    // Generate question using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
    
    const prompt = `
Create a multiple choice question for this Japanese ${queueItem.item_type} item:

Term: ${item.term}
Reading: ${item.reading}
English Meaning: ${item.meaning_en}
Vietnamese Meaning: ${item.meaning_vi || 'N/A'}
Example: ${item.example_jp}
JLPT Section: ${item.section || 'N/A'}

Create a question that tests understanding of this ${queueItem.item_type === 'vocab' ? 'vocabulary' : 'grammar'} item.
The question should be clear and have 4 plausible options.

Return ONLY a JSON object in this exact format:
{
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer_index": 0,
  "explanation": "Why this is the correct answer"
}

Make sure the correct answer is at the index specified in answer_index (0-3).
`
    
    const response = await model.generateContent(prompt)
    const generatedQuestion = JSON.parse(response.response.text())
    
    // Insert the generated question into the appropriate table
    let questionData
    if (queueItem.item_type === 'vocab') {
      const { data: newQuestion, error: insertError } = await supabase
        .from('vocab_questions')
        .insert({
          vocabulary_item_id: queueItem.item_id,
          question: generatedQuestion.question,
          option_a: generatedQuestion.options[0],
          option_b: generatedQuestion.options[1],
          option_c: generatedQuestion.options[2],
          option_d: generatedQuestion.options[3],
          answer_index: generatedQuestion.answer_index,
          explanation: generatedQuestion.explanation
        })
        .select()
        .single()
      
      if (insertError) {
        throw insertError
      }
      questionData = newQuestion
    } else {
      const { data: newQuestion, error: insertError } = await supabase
        .from('grammar_questions')
        .insert({
          grammar_item_id: queueItem.item_id,
          question: generatedQuestion.question,
          option_a: generatedQuestion.options[0],
          option_b: generatedQuestion.options[1],
          option_c: generatedQuestion.options[2],
          option_d: generatedQuestion.options[3],
          answer_index: generatedQuestion.answer_index,
          explanation: generatedQuestion.explanation
        })
        .select()
        .single()
      
      if (insertError) {
        throw insertError
      }
      questionData = newQuestion
    }
    
    // Mark as completed
    await supabase
      .from('missing_questions_queue')
      .update({ 
        status: 'completed',
        generated_at: new Date().toISOString()
      })
      .eq('id', queueId)
    
    return NextResponse.json({ 
      success: true, 
      question: questionData,
      message: 'Question generated successfully'
    })
    
  } catch (error: unknown) {
    console.error('Question generation error:', error)
    
    // Mark as failed
    await supabase
      .from('missing_questions_queue')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', queueId)
    
    return NextResponse.json({ 
      error: 'Failed to generate question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
