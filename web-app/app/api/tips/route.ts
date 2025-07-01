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
    const section = searchParams.get('section') // 'vocabulary', 'reading', 'listening'
    
    if (!section || !['vocabulary', 'reading', 'listening'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('section_tips')
      .select('*')
      .eq('section', section)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Tips fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 })
    }
    
    return NextResponse.json({ tips: data || [] })
    
  } catch (error) {
    console.error('Tips API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
