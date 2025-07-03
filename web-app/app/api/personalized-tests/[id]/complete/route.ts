import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
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

    const { score, time_taken_ms, quiz_results } = await request.json();
    const resolvedParams = await params;
    const testId = resolvedParams.id;

    // Update the test to mark it as completed
    const { error } = await supabase
      .from('test_records')
      .update({ 
        completed_at: new Date().toISOString(),
        score: score,
        time_taken_ms: time_taken_ms,
        test_results: {
          quiz_results,
          final_score: score,
          completion_time: time_taken_ms
        }
      })
      .eq('id', testId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error completing test:', error);
      return NextResponse.json({ error: "Failed to complete test" }, { status: 500 });
    }

    // TODO: Generate AI analysis of the test results
    // This could be enhanced later to provide personalized feedback

    return NextResponse.json({ 
      success: true,
      score,
      time_taken_ms
    });
  } catch (error) {
    console.error('Error in complete test API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
