import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnhancedFlashcardList } from "@/components/enhanced-flashcard-list";

export default async function Flashcards() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Flashcards
            </h1>
            <p className="text-lg text-gray-600">
              Review with spaced repetition
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <EnhancedFlashcardList />
      </div>
    </div>
  );
}
