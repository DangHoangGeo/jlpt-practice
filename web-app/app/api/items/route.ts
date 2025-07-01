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
    const section = searchParams.get('section')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!section) {
      return NextResponse.json({ error: 'Section parameter is required' }, { status: 400 })
    }
    
    let query
    
    if (['kanji', 'word', 'phrase'].includes(section)) {
      query = supabase
        .from('vocabulary_items')
        .select('*')
        .eq('section', section)
        .order('created_at', { ascending: false })
        .limit(limit)
    } else if (section === 'grammar') {
      query = supabase
        .from('grammar_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    } else {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Items fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }
    
    return NextResponse.json({ items: data || [] })
    
  } catch (error) {
    console.error('Items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
