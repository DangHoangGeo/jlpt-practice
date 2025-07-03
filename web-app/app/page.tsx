import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AISmartDashboard } from "@/components/ai-smart-dashboard";
import { ProgressTracker } from "@/components/progress-tracker";
import { StudyPlan } from "@/components/study-plan";
import { QuickActions } from "@/components/quick-actions";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header - Mobile optimized */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
            JLPT N1 Smart Practice
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            AI-powered Japanese learning with personalized insights
          </p>
        </div>

        {/* Mobile-first grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress & Study Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            <ProgressTracker />
            
            {/* Study Plan */}
            <StudyPlan />
            
            {/* AI Dashboard for larger screens */}
            <div className="hidden lg:block">
              <AISmartDashboard />
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* AI Dashboard for mobile */}
            <div className="lg:hidden">
              <AISmartDashboard />
            </div>
          </div>
        </div>

        {/* Quick Navigation - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Link 
            href="/my-content"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">My Content</h3>
            <p className="text-sm text-muted-foreground">Add custom vocabulary & grammar</p>
          </Link>
          
          <Link 
            href="/practice-lists"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">Practice Lists</h3>
            <p className="text-sm text-muted-foreground">Curated study collections</p>
          </Link>
          
          <Link 
            href="/personalized-tests"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">Smart Tests</h3>
            <p className="text-sm text-muted-foreground">AI-generated personalized tests</p>
          </Link>
          
          <Link 
            href="/flashcards"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">Flashcards</h3>
            <p className="text-sm text-muted-foreground">Spaced repetition practice</p>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Link 
            href="/tips"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">Study Tips</h3>
            <p className="text-sm text-muted-foreground">Expert tips for JLPT success</p>
          </Link>
          
          <Link 
            href="/assistant"
            className="p-4 bg-card rounded-lg border shadow hover:shadow-md transition-shadow text-center touch-target"
          >
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">Get personalized help</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

