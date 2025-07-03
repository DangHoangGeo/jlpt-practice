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
    const listId = searchParams.get('list_id')
    const includeItems = searchParams.get('include_items') === 'true'
    
    if (listId) {
      // Get specific practice list
      const query = supabase
        .from('practice_lists')
        .select('*')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single()
      
      const { data: list, error: listError } = await query
      
      if (listError) {
        return NextResponse.json({ error: 'Practice list not found' }, { status: 404 })
      }
      
      if (includeItems) {
        // Get items in the list
        const { data: items, error: itemsError } = await supabase
          .from('practice_list_items')
          .select(`
            *,
            vocabulary_items!left (
              id,
              term,
              reading,
              meaning_en,
              meaning_vi,
              example_jp,
              section
            ),
            grammar_items!left (
              id,
              term,
              reading,
              meaning_en,
              meaning_vi,
              example_jp,
              section
            )
          `)
          .eq('practice_list_id', listId)
          .order('priority', { ascending: false })
          .order('added_at', { ascending: true })
        
        if (itemsError) {
          console.error('Items fetch error:', itemsError)
          return NextResponse.json({ error: 'Failed to fetch list items' }, { status: 500 })
        }
        
        return NextResponse.json({ 
          list: {
            ...list,
            items: items || []
          }
        })
      }
      
      return NextResponse.json({ list })
    } else {
      // Get all practice lists for user
      const { data: lists, error: listsError } = await supabase
        .from('practice_lists')
        .select(`
          *,
          practice_list_items!left (
            id
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (listsError) {
        console.error('Lists fetch error:', listsError)
        return NextResponse.json({ error: 'Failed to fetch practice lists' }, { status: 500 })
      }
      
      // Add item counts
      const listsWithCounts = lists?.map(list => ({
        ...list,
        item_count: list.practice_list_items?.length || 0,
        practice_list_items: undefined // Remove the nested data
      })) || []
      
      return NextResponse.json({ lists: listsWithCounts })
    }
    
  } catch (error) {
    console.error('Practice lists API error:', error)
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
    const { name, description, items } = body
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    // Create the practice list
    const { data: list, error: listError } = await supabase
      .from('practice_lists')
      .insert({
        user_id: user.id,
        name,
        description: description || null
      })
      .select()
      .single()
    
    if (listError) {
      console.error('List creation error:', listError)
      return NextResponse.json({ error: 'Failed to create practice list' }, { status: 500 })
    }
    
    // Add items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const listItems = items.map(item => ({
        practice_list_id: list.id,
        item_id: item.item_id,
        item_type: item.item_type,
        priority: item.priority || 1
      }))
      
      const { error: itemsError } = await supabase
        .from('practice_list_items')
        .insert(listItems)
      
      if (itemsError) {
        console.error('Items insertion error:', itemsError)
        // Don't fail the request, just log the error
      }
    }
    
    return NextResponse.json({ 
      success: true,
      list
    })
    
  } catch (error) {
    console.error('Practice lists POST error:', error)
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
    const { list_id, name, description, is_active, add_items, remove_items } = body
    
    if (!list_id) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }
    
    // Update list details if provided
    if (name || description !== undefined || is_active !== undefined) {
      const updates: Record<string, string | boolean> = {}
      if (name) updates.name = name
      if (description !== undefined) updates.description = description
      if (is_active !== undefined) updates.is_active = is_active
      
      const { error: updateError } = await supabase
        .from('practice_lists')
        .update(updates)
        .eq('id', list_id)
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('List update error:', updateError)
        return NextResponse.json({ error: 'Failed to update practice list' }, { status: 500 })
      }
    }
    
    // Add new items
    if (add_items && Array.isArray(add_items) && add_items.length > 0) {
      const newItems = add_items.map(item => ({
        practice_list_id: list_id,
        item_id: item.item_id,
        item_type: item.item_type,
        priority: item.priority || 1
      }))
      
      const { error: addError } = await supabase
        .from('practice_list_items')
        .insert(newItems)
      
      if (addError) {
        console.error('Items addition error:', addError)
        return NextResponse.json({ error: 'Failed to add items to list' }, { status: 500 })
      }
    }
    
    // Remove items
    if (remove_items && Array.isArray(remove_items) && remove_items.length > 0) {
      for (const item of remove_items) {
        const { error: removeError } = await supabase
          .from('practice_list_items')
          .delete()
          .eq('practice_list_id', list_id)
          .eq('item_id', item.item_id)
          .eq('item_type', item.item_type)
        
        if (removeError) {
          console.error('Item removal error:', removeError)
          // Don't fail the entire request for individual item removal errors
        }
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Practice lists PATCH error:', error)
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
    const listId = searchParams.get('list_id')
    
    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }
    
    // Delete the practice list (items will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('practice_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('List deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete practice list' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Practice lists DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
