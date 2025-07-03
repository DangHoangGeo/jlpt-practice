import Link from "next/link";
import { Heart, Github, Twitter, Mail } from "lucide-react";

export function SharedFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-semibold text-lg mb-3">JLPT N1 Practice</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Master Japanese with AI-powered quizzes, spaced repetition flashcards, 
              and personalized learning insights. Built for serious JLPT N1 candidates.
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href="https://github.com" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link 
                href="https://twitter.com" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link 
                href="mailto:support@jlptpractice.com" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Study</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/quiz/vocab" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vocabulary Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/quiz/grammar" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Grammar Quiz
                </Link>
              </li>
              <li>
                <Link 
                  href="/flashcards" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Flashcards
                </Link>
              </li>
              <li>
                <Link 
                  href="/practice-lists" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Practice Lists
                </Link>
              </li>
              <li>
                <Link 
                  href="/personalized-tests" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Smart Tests
                </Link>
              </li>
              <li>
                <Link 
                  href="/tips" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Study Tips
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/my-content" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Content
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth/login" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth/sign-up" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for Japanese learners</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© 2025 JLPT Practice</span>
            <Link 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Powered by Supabase
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
