import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Target, Lightbulb } from "lucide-react";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Get progress counts
  const today = new Date().toISOString().split('T')[0];
  
  // Count due flashcards
  const { count: vocabDueCount } = await supabase
    .from('flashcard_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('item_type', 'vocab')
    .lte('next_review', today)
    .eq('is_mastered', false);

  const { count: grammarDueCount } = await supabase
    .from('flashcard_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('item_type', 'grammar')
    .lte('next_review', today)
    .eq('is_mastered', false);

  // Count new items (items without progress)
  const { count: vocabTotalCount } = await supabase
    .from('vocabulary_items')
    .select('*', { count: 'exact', head: true });

  const { count: grammarTotalCount } = await supabase
    .from('grammar_items')
    .select('*', { count: 'exact', head: true });

  const { count: vocabProgressCount } = await supabase
    .from('flashcard_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('item_type', 'vocab');

  const { count: grammarProgressCount } = await supabase
    .from('flashcard_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('item_type', 'grammar');

  const vocabNew = (vocabTotalCount || 0) - (vocabProgressCount || 0);
  const grammarNew = (grammarTotalCount || 0) - (grammarProgressCount || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            JLPT N1 Practice
          </h1>
          <p className="text-lg text-gray-600">
            Master Japanese with interactive quizzes and spaced repetition
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vocab Due</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabDueCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Cards ready for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grammar Due</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grammarDueCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Patterns to review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Vocab</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vocabNew}</div>
              <p className="text-xs text-muted-foreground">
                Words to learn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Grammar</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grammarNew}</div>
              <p className="text-xs text-muted-foreground">
                Patterns to learn
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Vocab Quiz
              </CardTitle>
              <CardDescription>
                Test your vocabulary knowledge with multiple choice questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/quiz/vocab">Start Quiz</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Grammar Quiz
              </CardTitle>
              <CardDescription>
                Practice grammar patterns with fill-in-the-blank questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/quiz/grammar">Start Quiz</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Flashcards
              </CardTitle>
              <CardDescription>
                Review vocabulary and grammar with spaced repetition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/flashcards">Review Cards</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Study Tips
              </CardTitle>
              <CardDescription>
                Get expert advice for JLPT preparation strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/tips">View Tips</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
