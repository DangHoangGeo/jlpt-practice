import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJsonFromText } from '@/lib/json-extractor'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Type definitions
interface RecommendedItem {
  id: string
  term?: string
  pattern?: string
  reading: string
  meaning_en: string
  type: string
  difficulty_score: number
  priority: number
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
    const testId = searchParams.get('test_id')
    
    if (testId) {
      // Get specific test with questions and analytics
      const { data: test, error: testError } = await supabase
        .from('test_records')
        .select(`
          *,
          test_questions!left (
            *
          ),
          test_analytics!left (
            *
          )
        `)
        .eq('id', testId)
        .eq('user_id', user.id)
        .single()
      
      if (testError) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 })
      }
      
      return NextResponse.json({ test })
    } else {
      // Get all tests for user
      const { data: tests, error: testsError } = await supabase
        .from('test_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (testsError) {
        console.error('Tests fetch error:', testsError)
        return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
      }
      
      return NextResponse.json({ tests: tests || [] })
    }
    
  } catch (error) {
    console.error('Personalized tests API error:', error)
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
  const { 
    test_name, 
    test_type = 'practice_test', 
    question_count = 20, 
    difficulty_level = 'mixed',
    focus_areas = []
  } = body
    
    if (!test_name) {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 })
    }
    
    // Analyze user performance to create personalized prompt
    const analysisPrompt = await generateUserAnalysisPrompt(supabase, user.id, focus_areas)
    
    // Generate AI analysis and recommendations
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
    const aiResponse = await model.generateContent(analysisPrompt)
    const aiAnalysis = extractJsonFromText(aiResponse.response.text())
    
    // Create test record
    const { data: test, error: testError } = await supabase
      .from('test_records')
      .insert({
        user_id: user.id,
        test_name,
        test_type,
        generation_prompt: analysisPrompt,
        ai_analysis: aiAnalysis,
        difficulty_level,
        total_questions: question_count,
        estimated_time_minutes: Math.ceil(question_count * 1.5), // 1.5 minutes per question
        focus_areas
      })
      .select()
      .single()
    
    if (testError) {
      console.error('Test creation error:', testError)
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
    }
    
    // Generate questions based on AI analysis
    const questions = await generateTestQuestions(
      supabase, 
      user.id, 
      question_count, 
      aiAnalysis.recommended_items || []
    )
    
    // Insert test questions
    const testQuestions = questions.map((q, index) => ({
      test_record_id: test.id,
      question_id: q.question_id,
      question_type: q.question_type,
      question_order: index + 1,
      correct_answer: q.correct_answer
    }))
    
    const { error: questionsError } = await supabase
      .from('test_questions')
      .insert(testQuestions)
    
    if (questionsError) {
      console.error('Test questions insertion error:', questionsError)
      return NextResponse.json({ error: 'Failed to add questions to test' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      test: {
        ...test,
        questions: testQuestions
      }
    })
    
  } catch (error) {
    console.error('Personalized tests POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateUserAnalysisPrompt(supabase: SupabaseClient, userId: string, focusAreas: string[]) {
  // Get user progress data
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
  
  // Get recent activity
  const { data: activityData } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50)
  
  const prompt = `
You are an AI language learning analyst. Analyze this user's Japanese learning performance and create a personalized test strategy.

User Progress Data:
${JSON.stringify(progressData?.slice(0, 20), null, 2)}

Recent Activity (last 50 actions):
${JSON.stringify(activityData?.slice(0, 20), null, 2)}

Focus Areas Requested: ${focusAreas.join(', ') || 'General review'}

Based on this data, create a personalized test strategy. Return a JSON object with:
{
  "performance_summary": "Brief analysis of user's strengths and weaknesses",
  "recommended_focus": ["area1", "area2", "area3"],
  "difficulty_distribution": {
    "easy": 30,
    "medium": 50, 
    "hard": 20
  },
  "recommended_items": [
    {
      "item_id": "uuid",
      "item_type": "vocab|grammar", 
      "priority": 1-5,
      "reason": "why this item should be included"
    }
  ],
  "test_strategy": "Explanation of the test design approach",
  "estimated_difficulty": "easy|medium|hard|mixed"
}

Focus on items the user struggles with, hasn't seen recently, or specifically requested in their practice list.
`
  
  return prompt
}

async function generateTestQuestions(
  supabase: SupabaseClient, 
  userId: string, 
  questionCount: number, 
  recommendedItems: RecommendedItem[]
) {
  const questions: Array<{
    question_id: string
    question_type: string
    correct_answer: string
  }> = []
  
  // If we have recommended items from AI, prioritize those
  if (recommendedItems.length > 0) {
    for (const item of recommendedItems.slice(0, questionCount)) {
      let questionQuery
      
      if (item.type === 'vocab') {
        questionQuery = supabase
          .from('vocab_questions')
          .select('id, vocabulary_item_id, answer_index')
          .eq('vocabulary_item_id', item.id)
          .limit(1)
      } else {
        questionQuery = supabase
          .from('grammar_questions')
          .select('id, grammar_item_id, answer_index')
          .eq('grammar_item_id', item.id)
          .limit(1)
      }
      
      const { data: questionData } = await questionQuery
      
      if (questionData && questionData.length > 0) {
        const q = questionData[0]
        questions.push({
          question_id: q.id,
          question_type: item.type,
          correct_answer: q.answer_index?.toString() || '0'
        })
      } else {
        // Queue item for AI question generation
        await supabase
          .from('missing_questions_queue')
          .upsert({
            user_id: userId,
            item_id: item.id,
            item_type: item.type,
            priority: item.priority || 3
          }, { 
            onConflict: 'user_id,item_id,item_type',
            ignoreDuplicates: false 
          })
      }
    }
  }
  
  // Fill remaining slots with general questions
  const remainingCount = questionCount - questions.length
  if (remainingCount > 0) {
    // Get mixed questions based on user progress
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('item_id, item_type, correct_count, incorrect_count')
      .eq('user_id', userId)
    
    const progressMap = new Map(userProgress?.map((p: { item_id: string, item_type: string, correct_count: number, incorrect_count: number }) => [`${p.item_id}-${p.item_type}`, p]) || [])
    
    // Get vocab questions
    const vocabCount = Math.ceil(remainingCount / 2)
    const { data: vocabQuestions } = await supabase
      .from('vocab_questions')
      .select('id, vocabulary_item_id, answer_index')
      .limit(vocabCount * 2)
    
    // Sort by user difficulty (items they struggle with first)
    const sortedVocab = vocabQuestions?.sort((a: { vocabulary_item_id: string, answer_index: number }, b: { vocabulary_item_id: string, answer_index: number }) => {
      const progressA = progressMap.get(`${a.vocabulary_item_id}-vocab`) as { correct_count: number, incorrect_count: number } | undefined
      const progressB = progressMap.get(`${b.vocabulary_item_id}-vocab`) as { correct_count: number, incorrect_count: number } | undefined
      
      const accuracyA = progressA ? progressA.correct_count / (progressA.correct_count + progressA.incorrect_count) : 0.5
      const accuracyB = progressB ? progressB.correct_count / (progressB.correct_count + progressB.incorrect_count) : 0.5
      
      return accuracyA - accuracyB // Lower accuracy first
    }).slice(0, vocabCount) || []
    
    // Get grammar questions
    const grammarCount = remainingCount - vocabCount
    const { data: grammarQuestions } = await supabase
      .from('grammar_questions')
      .select('id, grammar_item_id, answer_index')
      .limit(grammarCount * 2)
    
    const sortedGrammar = grammarQuestions?.sort((a: { grammar_item_id: string, answer_index: number }, b: { grammar_item_id: string, answer_index: number }) => {
      const progressA = progressMap.get(`${a.grammar_item_id}-grammar`) as { correct_count: number, incorrect_count: number } | undefined
      const progressB = progressMap.get(`${b.grammar_item_id}-grammar`) as { correct_count: number, incorrect_count: number } | undefined
      
      const accuracyA = progressA ? progressA.correct_count / (progressA.correct_count + progressA.incorrect_count) : 0.5
      const accuracyB = progressB ? progressB.correct_count / (progressB.correct_count + progressB.incorrect_count) : 0.5
      
      return accuracyA - accuracyB
    }).slice(0, grammarCount) || []
    
    // Add to questions
    sortedVocab.forEach((q: { id: string, answer_index: number }) => {
      questions.push({
        question_id: q.id,
        question_type: 'vocab',
        correct_answer: q.answer_index?.toString() || '0'
      })
    })
    
    sortedGrammar.forEach((q: { id: string, answer_index: number }) => {
      questions.push({
        question_id: q.id,
        question_type: 'grammar',
        correct_answer: q.answer_index?.toString() || '0'
      })
    })
  }
  
  // Shuffle questions
  return questions.sort(() => Math.random() - 0.5)
}
