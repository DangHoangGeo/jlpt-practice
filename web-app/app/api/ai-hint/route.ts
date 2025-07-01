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
        error: 'AI hints are not configured. Please set GOOGLE_AI_API_KEY environment variable.' 
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      item_type,
      term,
      reading,
      meaning,
      example
    } = body

    // Validate required fields
    if (!item_type || !term || !meaning) {
      return NextResponse.json({ 
        error: 'Missing required fields: item_type, term, meaning' 
      }, { status: 400 })
    }

    if (!['vocab', 'grammar'].includes(item_type)) {
      return NextResponse.json({ 
        error: 'item_type must be either "vocab" or "grammar"' 
      }, { status: 400 })
    }

    // Generate hint using Gemini
    const hint = await geminiService.generateStudyHint(
      item_type as 'vocab' | 'grammar',
      term,
      reading,
      meaning,
      example
    )

    // Log the hint request for analytics
    await supabase
      .from('user_activity')
      .insert({
        user_id: user.id,
        activity_type: 'ai_hint_request',
        item_type,
        details: {
          term,
          hint_generated: true
        }
      })

    return NextResponse.json({ 
      success: true,
      hint
    })

  } catch (error) {
    console.error('Error generating AI hint:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate hint' 
    }, { status: 500 })
  }
}
