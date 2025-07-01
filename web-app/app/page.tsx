import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AISmartDashboard } from "@/components/ai-smart-dashboard";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          JLPT N1 Smart Practice
        </h1>
        <p className="text-lg text-muted-foreground">
          AI-powered Japanese learning with personalized insights
        </p>
      </div>

      <AISmartDashboard />

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/my-content"
          className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center"
        >
          <h3 className="font-semibold mb-2">My Content</h3>
          <p className="text-sm text-muted-foreground">Add custom vocabulary & grammar</p>
        </Link>
        
        <Link 
          href="/flashcards"
          className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center"
        >
          <h3 className="font-semibold mb-2">Flashcards</h3>
          <p className="text-sm text-muted-foreground">Spaced repetition practice</p>
        </Link>
        
        <Link 
          href="/tips"
          className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center"
        >
          <h3 className="font-semibold mb-2">Study Tips</h3>
          <p className="text-sm text-muted-foreground">Expert advice & strategies</p>
        </Link>
      </div>
    </div>
  );
}
