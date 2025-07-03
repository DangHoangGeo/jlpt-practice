import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const testId = resolvedParams.id;

    // First get the test record to check ownership and get test details
    const { data: testRecord, error: testError } = await supabase
      .from('test_records')
      .select('*')
      .eq('id', testId)
      .eq('user_id', user.id)
      .single();

    if (testError || !testRecord) {
      console.error('Error fetching test record:', testError);
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Get the test questions for this test
    const { data: testQuestions, error: testQuestionsError } = await supabase
      .from('test_questions')
      .select('*')
      .eq('test_record_id', testId)
      .order('question_order');

    if (testQuestionsError) {
      console.error('Error fetching test questions:', testQuestionsError);
      return NextResponse.json({ error: "Failed to fetch test questions" }, { status: 500 });
    }

    if (!testQuestions || testQuestions.length === 0) {
      return NextResponse.json({ error: "No questions found for this test" }, { status: 404 });
    }

    // Now fetch the actual question details based on question_type
    const questions = [];
    
    for (const testQuestion of testQuestions) {
      let questionData = null;
      
      if (testQuestion.question_type === 'vocab') {
        const { data: vocabQuestion, error: vocabError } = await supabase
          .from('vocab_questions')
          .select(`
            *,
            vocabulary_items (*)
          `)
          .eq('id', testQuestion.question_id)
          .single();
          
        if (!vocabError && vocabQuestion) {
          questionData = {
            id: vocabQuestion.id,
            question_text: vocabQuestion.question_text,
            options: vocabQuestion.options,
            answer_index: vocabQuestion.answer_index,
            explanation: vocabQuestion.explanation,
            vocabulary_items: vocabQuestion.vocabulary_items
          };
        }
      } else if (testQuestion.question_type === 'grammar') {
        const { data: grammarQuestion, error: grammarError } = await supabase
          .from('grammar_questions')
          .select(`
            *,
            grammar_items (*)
          `)
          .eq('id', testQuestion.question_id)
          .single();
          
        if (!grammarError && grammarQuestion) {
          questionData = {
            id: grammarQuestion.id,
            question_text: grammarQuestion.question_text,
            options: grammarQuestion.options,
            answer_index: grammarQuestion.answer_index,
            explanation: grammarQuestion.explanation,
            grammar_items: grammarQuestion.grammar_items
          };
        }
      }
      
      if (questionData) {
        questions.push(questionData);
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "No valid questions found for this test" }, { status: 404 });
    }

    return NextResponse.json({ 
      questions,
      test_record: testRecord
    });
  } catch (error) {
    console.error('Error in get test questions API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
