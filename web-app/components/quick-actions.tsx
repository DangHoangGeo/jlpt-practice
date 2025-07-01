"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Target, 
  Zap, 
  Timer,
  Plus
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  estimatedTime: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function QuickActions() {
  const [isGenerating, setIsGenerating] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'vocab-quick',
      title: 'Quick Vocab',
      description: '5-minute vocabulary sprint',
      icon: BookOpen,
      href: '/quiz/vocab?mode=quick',
      color: 'bg-blue-500',
      estimatedTime: '5 min',
      difficulty: 'medium'
    },
    {
      id: 'grammar-drill',
      title: 'Grammar Drill',
      description: 'Focus on weak grammar points',
      icon: FileText,
      href: '/quiz/grammar?mode=drill',
      color: 'bg-green-500',
      estimatedTime: '10 min',
      difficulty: 'hard'
    },
    {
      id: 'flashcards-review',
      title: 'Quick Review',
      description: 'Review due flashcards',
      icon: Brain,
      href: '/flashcards?filter=due',
      color: 'bg-purple-500',
      estimatedTime: '3 min',
      difficulty: 'easy'
    },
    {
      id: 'reading-practice',
      title: 'Reading',
      description: 'Comprehension practice',
      icon: BookOpen,
      href: '/reading',
      color: 'bg-indigo-500',
      estimatedTime: '15 min',
      difficulty: 'hard'
    },
    {
      id: 'mock-test',
      title: 'Mock Exam',
      description: 'Timed practice test',
      icon: Target,
      href: '/mock-exam',
      color: 'bg-red-500',
      estimatedTime: '5-30 min',
      difficulty: 'hard'
    },
    {
      id: 'ai-practice',
      title: 'AI Challenge',
      description: 'AI-generated practice questions',
      icon: Zap,
      href: '#',
      color: 'bg-yellow-500',
      estimatedTime: '8 min',
      difficulty: 'medium'
    }
  ];

  const handleAIChallenge = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would generate AI questions
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Redirect to AI-generated quiz
      window.location.href = '/quiz/ai-generated';
    } catch (error) {
      console.error('Error generating AI challenge:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isAIChallenge = action.id === 'ai-practice';
            
            if (isAIChallenge) {
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 text-left relative"
                  onClick={handleAIChallenge}
                  disabled={isGenerating}
                >
                  <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center mb-1`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {isGenerating ? 'Generating...' : action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        {action.estimatedTime}
                      </div>
                      {action.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(action.difficulty)}`}>
                          {action.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              );
            }

            return (
              <Link key={action.id} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 text-left relative w-full hover:shadow-md transition-shadow"
                >
                  <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center mb-1`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        {action.estimatedTime}
                      </div>
                      {action.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(action.difficulty)}`}>
                          {action.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Add Custom Study Session */}
        <div className="mt-4 pt-4 border-t">
          <Link href="/custom-study">
            <Button variant="ghost" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Study Session
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
