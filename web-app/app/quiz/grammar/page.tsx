import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnhancedQuizCard } from "@/components/enhanced-quiz-card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function GrammarQuiz() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
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
              Grammar Quiz
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Practice JLPT N1 grammar patterns
            </p>
          </div>
        </div>

        <EnhancedQuizCard section="grammar" />
      </div>
    </div>
  );
}
