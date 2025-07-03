import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PersonalizedTestQuiz } from "@/components/personalized-test-quiz";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: { test_id?: string };
}

export default async function QuizPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check if this is a personalized test
  const { test_id } = searchParams;
  
  if (!test_id) {
    // No test_id provided, redirect to main dashboard or show error
    return redirect("/");
  }

  // Fetch the personalized test details
  const { data: testRecord, error } = await supabase
    .from('test_records')
    .select('*')
    .eq('id', test_id)
    .eq('user_id', user.id)
    .single();

  if (error || !testRecord) {
    console.error('Error fetching test record:', error);
    return redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Mobile-optimized header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {testRecord.test_name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {testRecord.test_type.replace('_', ' ')} • {testRecord.difficulty_level} • {testRecord.total_questions} questions
            </p>
          </div>
        </div>

        <PersonalizedTestQuiz testRecord={testRecord} />
      </div>
    </div>
  );
}
