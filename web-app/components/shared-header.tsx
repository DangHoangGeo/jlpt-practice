import Link from "next/link";
import { AuthButton } from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Lightbulb, 
  BarChart3,
  User
} from "lucide-react";

export async function SharedHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Brain className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline">JLPT N1 Practice</span>
              <span className="sm:hidden">JLPT N1</span>
            </Link>
          </div>

          {/* Navigation Menu */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                href="/quiz/vocab" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Vocabulary Quiz
              </Link>
              <Link 
                href="/quiz/grammar" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Grammar Quiz
              </Link>
              <Link 
                href="/flashcards" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Brain className="h-4 w-4" />
                Flashcards
              </Link>
              <Link 
                href="/my-content" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                My Content
              </Link>
              <Link 
                href="/tips" 
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="h-4 w-4" />
                Tips
              </Link>
            </nav>
          )}

          {/* Right side - Auth and Theme */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <nav className="md:hidden pb-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/quiz/vocab" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Vocab
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/quiz/grammar" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Grammar
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/flashcards" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Cards
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/my-content" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  My Content
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tips" className="flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Tips
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
