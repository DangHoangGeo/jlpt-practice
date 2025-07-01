import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pattern,
      reading,
      meaning_en,
      meaning_vi,
      example_jp,
      example_en,
      example_vi,
      usage_notes,
      tags,
      difficulty_level = 'intermediate',
      is_public = false
    } = body

    // Validate required fields
    if (!pattern || !reading || !meaning_en || !example_jp) {
      return NextResponse.json({ 
        error: 'pattern, reading, meaning_en, and example_jp are required' 
      }, { status: 400 })
    }

    // Insert new user grammar
    const { data, error } = await supabase
      .from('user_grammar')
      .insert({
        user_id: user.id,
        pattern,
        reading,
        meaning_en,
        meaning_vi,
        example_jp,
        example_en,
        example_vi,
        usage_notes,
        tags: tags || [],
        difficulty_level,
        is_public
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user grammar:', error)
      return NextResponse.json({ error: 'Failed to create grammar entry' }, { status: 500 })
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
          activity_type: 'add_grammar',
          item_id: data.id,
          item_type: 'grammar',
          details: {
            pattern,
            reading,
            meaning_en,
            difficulty_level
          }
        })
      })
    } catch (logError) {
      console.error('Error logging grammar creation:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      grammar: data 
    })

  } catch (error) {
    console.error('Error in user grammar creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const includePublic = searchParams.get('include_public') === 'true'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('user_grammar')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by ownership
    if (includePublic) {
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      query = query.eq('user_id', user.id)
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    // Filter by difficulty
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    // Search in pattern, reading, or meaning
    if (search) {
      query = query.or(`pattern.ilike.%${search}%,reading.ilike.%${search}%,meaning_en.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user grammar:', error)
      return NextResponse.json({ error: 'Failed to fetch grammar' }, { status: 500 })
    }

    return NextResponse.json({ grammar: data })

  } catch (error) {
    console.error('Error in user grammar retrieval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
    }

    // Update user grammar (only if owned by user)
    const { data, error } = await supabase
      .from('user_grammar')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own grammar
      .select()
      .single()

    if (error) {
      console.error('Error updating user grammar:', error)
      return NextResponse.json({ error: 'Failed to update grammar entry' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Grammar entry not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      grammar: data 
    })

  } catch (error) {
    console.error('Error in user grammar update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 })
    }

    // Delete user grammar (only if owned by user)
    const { data, error } = await supabase
      .from('user_grammar')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting user grammar:', error)
      return NextResponse.json({ error: 'Failed to delete grammar entry' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Grammar entry not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Grammar entry deleted successfully' 
    })

  } catch (error) {
    console.error('Error in user grammar deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
