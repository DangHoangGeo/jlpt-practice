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
  User,
  Menu,
  Bot
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export async function SharedHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navLinks = [
    { href: "/", icon: BarChart3, text: "Dashboard" },
    { href: "/assistant", icon: Bot, text: "AI Assistant" },
    { href: "/quiz/vocab", icon: BookOpen, text: "Vocabulary Quiz" },
    { href: "/quiz/grammar", icon: FileText, text: "Grammar Quiz" },
    { href: "/flashcards", icon: Brain, text: "Flashcards" },
    { href: "/my-content", icon: User, text: "My Content" },
    { href: "/tips", icon: Lightbulb, text: "Tips" },
  ];

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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  {link.text}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Auth and Theme */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton />
            {user && (
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="flex flex-col gap-4 py-6">
                      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
                          <Brain className="h-6 w-6 text-primary" />
                          <span>JLPT N1 Practice</span>
                      </Link>
                      <nav className="flex flex-col gap-4">
                        {navLinks.map(link => (
                            <Link 
                                key={link.href}
                                href={link.href} 
                                className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <link.icon className="h-5 w-5" />
                                {link.text}
                            </Link>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
