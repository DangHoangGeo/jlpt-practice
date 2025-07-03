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

    const resolvedParams = await params;
    const testId = resolvedParams.id;

    // Update the test to mark it as started
    const { error } = await supabase
      .from('test_records')
      .update({ 
        started_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error starting test:', error);
      return NextResponse.json({ error: "Failed to start test" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in start test API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
