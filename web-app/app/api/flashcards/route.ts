import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// SM-2 Algorithm implementation
function calculateNextReview(quality: number, interval: number, easiness: number) {
  let newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEasiness < 1.3) newEasiness = 1.3
  
  let newInterval
  if (quality < 3) {
    newInterval = 1 // Reset to 1 day if quality is poor
  } else {
    if (interval === 1) {
      newInterval = 6
    } else if (interval === 6) {
      newInterval = Math.round(interval * newEasiness)
    } else {
      newInterval = Math.round(interval * newEasiness)
    }
  }
  
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  
  return {
    interval: newInterval,
    easiness: newEasiness,
    next_review: nextReview.toISOString().split('T')[0]
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
    const section = searchParams.get('section') // 'vocab' or 'grammar'
    const filter = searchParams.get('filter') || 'due' // 'due', 'new', 'mastered', 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!section || !['vocab', 'grammar'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section parameter' }, { status: 400 })
    }
    
    // Get items first
    let itemsQuery
    
    if (section === 'vocab') {
      itemsQuery = supabase
        .from('vocabulary_items')
        .select('*')
    } else {
      itemsQuery = supabase
        .from('grammar_items')
        .select('*')
    }
    
    const { data: itemsData, error: itemsError } = await itemsQuery
    
    if (itemsError) {
      console.error('Items fetch error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Get progress for all items
    const itemIds = itemsData?.map(item => item.id) || []
    const { data: progressData } = await supabase
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_type', section)
      .in('item_id', itemIds)

    // Create a map for quick lookup
    const progressMap = new Map()
    progressData?.forEach(progress => {
      progressMap.set(progress.item_id, progress)
    })

    // Filter based on the filter parameter
    const today = new Date().toISOString().split('T')[0]
    let filteredItems = itemsData?.filter(item => {
      const progress = progressMap.get(item.id)
      
      switch (filter) {
        case 'new':
          return !progress
        case 'due':
          if (!progress) return true // New items are due
          return progress.next_review <= today && !progress.is_mastered
        case 'mastered':
          return progress?.is_mastered
        case 'all':
        default:
          return true
      }
    }) || []
    
    // Limit results
    filteredItems = filteredItems.slice(0, limit)
    
    // Transform to include progress metadata
    const flashcards = filteredItems.map(item => ({
      ...item,
      progress: progressMap.get(item.id) || null
    }))
    
    return NextResponse.json({ flashcards })
    
  } catch (error) {
    console.error('Flashcards API error:', error)
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
    const { item_id, item_type, known } = body
    const userId = user.id
    
    if (!item_id || !item_type || typeof known !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: item_id, item_type, known' 
      }, { status: 400 })
    }
    
    // Get current progress
    const { data: currentProgress } = await supabase
      .from('flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', item_id)
      .eq('item_type', item_type)
      .single()
    
    let newProgress
    const quality = known ? 4 : 2 // Quality rating based on known/unknown
    
    if (currentProgress) {
      // Update existing progress
      const nextReview = calculateNextReview(
        quality,
        currentProgress.interval,
        currentProgress.easiness
      )
      
      newProgress = {
        ...nextReview,
        is_mastered: known && currentProgress.interval >= 30 // Mark as mastered if known and interval is high
      }
      
      const { error: updateError } = await supabase
        .from('flashcard_progress')
        .update(newProgress)
        .eq('user_id', userId)
        .eq('item_id', item_id)
        .eq('item_type', item_type)
      
      if (updateError) {
        console.error('Progress update error:', updateError)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }
    } else {
      // Create new progress record
      const nextReview = calculateNextReview(quality, 1, 2.5)
      
      newProgress = {
        user_id: userId,
        item_id,
        item_type,
        ...nextReview,
        is_mastered: false
      }
      
      const { error: insertError } = await supabase
        .from('flashcard_progress')
        .insert(newProgress)
      
      if (insertError) {
        console.error('Progress insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      success: true,
      progress: newProgress
    })
    
  } catch (error) {
    console.error('Flashcards PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
