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

    // Get questions from the test_questions table and join with actual question data
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select(`
        *,
        vocab_questions:question_id!inner (
          id,
          question_text,
          options,
          answer_index,
          explanation,
          vocabulary_items (
            id,
            term,
            reading,
            meaning_en,
            example_jp
          )
        ),
        grammar_questions:question_id!inner (
          id,
          question_text,
          options,
          answer_index,
          explanation,
          grammar_items (
            id,
            term,
            reading,
            meaning_en,
            meaning_vi,
            example_jp
          )
        )
      `)
      .eq('test_record_id', testId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching test questions:', questionsError);
      return NextResponse.json({ error: "Failed to fetch test questions" }, { status: 500 });
    }

    // Transform questions into the expected format
    const questions = testQuestions?.map((tq: {
      question_type: string;
      vocab_questions?: {
        id: string;
        question_text: string;
        options: string[];
        answer_index: number;
        explanation: string;
        vocabulary_items?: {
          id: string;
          term: string;
          reading: string;
          meaning_en: string;
          example_jp: string;
        };
      };
      grammar_questions?: {
        id: string;
        question_text: string;
        options: string[];
        answer_index: number;
        explanation: string;
        grammar_items?: {
          id: string;
          term: string;
          reading: string;
          meaning_en: string;
          meaning_vi: string;
          example_jp: string;
        };
      };
    }) => {
      const questionData = tq.question_type === 'vocab' ? tq.vocab_questions : tq.grammar_questions;
      if (!questionData) return null;

      return {
        id: questionData.id,
        question_text: questionData.question_text,
        options: questionData.options,
        answer_index: questionData.answer_index,
        explanation: questionData.explanation,
        vocabulary_items: tq.question_type === 'vocab' ? (questionData as typeof tq.vocab_questions)?.vocabulary_items : undefined,
        grammar_items: tq.question_type === 'grammar' ? (questionData as typeof tq.grammar_questions)?.grammar_items : undefined,
      };
    }).filter(Boolean) || [];

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this test" }, { status: 404 });
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
