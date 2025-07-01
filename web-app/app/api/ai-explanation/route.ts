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
        error: 'AI explanations are not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      question,
      user_answer,
      correct_answer,
      options,
      item_type
    } = body

    // Validate required fields
    if (!question || !user_answer || !correct_answer || !options || !item_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: question, user_answer, correct_answer, options, item_type' 
      }, { status: 400 })
    }

    if (!['vocab', 'grammar'].includes(item_type)) {
      return NextResponse.json({ 
        error: 'item_type must be either "vocab" or "grammar"' 
      }, { status: 400 })
    }

    // Generate explanation using Gemini
    const explanation = await geminiService.generateExplanation(
      question,
      user_answer,
      correct_answer,
      options,
      item_type as 'vocab' | 'grammar'
    )

    return NextResponse.json({ 
      success: true,
      explanation
    })

  } catch (error) {
    console.error('Error generating AI explanation:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate explanation' 
    }, { status: 500 })
  }
}
