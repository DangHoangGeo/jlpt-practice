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
      term,
      reading,
      meaning_en,
      meaning_vi,
      example_jp,
      example_en,
      example_vi,
      tags,
      source,
      is_public = false
    } = body

    // Validate required fields
    if (!term || !reading || !meaning_en || !example_jp) {
      return NextResponse.json({ 
        error: 'term, reading, meaning_en, and example_jp are required' 
      }, { status: 400 })
    }

    // Insert new user vocabulary
    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: user.id,
        term,
        reading,
        meaning_en,
        meaning_vi,
        example_jp,
        example_en,
        example_vi,
        tags: tags || [],
        source,
        is_public
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user vocabulary:', error)
      return NextResponse.json({ error: 'Failed to create vocabulary entry' }, { status: 500 })
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
          activity_type: 'add_vocab',
          item_id: data.id,
          item_type: 'vocab',
          details: {
            term,
            reading,
            meaning_en,
            source: source || 'user_input'
          }
        })
      })
    } catch (logError) {
      console.error('Error logging vocabulary creation:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      vocabulary: data 
    })

  } catch (error) {
    console.error('Error in user vocabulary creation:', error)
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
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('user_vocabulary')
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

    // Search in term, reading, or meaning
    if (search) {
      query = query.or(`term.ilike.%${search}%,reading.ilike.%${search}%,meaning_en.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user vocabulary:', error)
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
    }

    return NextResponse.json({ vocabulary: data })

  } catch (error) {
    console.error('Error in user vocabulary retrieval:', error)
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

    // Update user vocabulary (only if owned by user)
    const { data, error } = await supabase
      .from('user_vocabulary')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own vocabulary
      .select()
      .single()

    if (error) {
      console.error('Error updating user vocabulary:', error)
      return NextResponse.json({ error: 'Failed to update vocabulary entry' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Vocabulary entry not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      vocabulary: data 
    })

  } catch (error) {
    console.error('Error in user vocabulary update:', error)
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

    // Delete user vocabulary (only if owned by user)
    const { data, error } = await supabase
      .from('user_vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting user vocabulary:', error)
      return NextResponse.json({ error: 'Failed to delete vocabulary entry' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Vocabulary entry not found or not owned by user' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vocabulary entry deleted successfully' 
    })

  } catch (error) {
    console.error('Error in user vocabulary deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
