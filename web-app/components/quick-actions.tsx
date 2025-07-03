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
      description: '5-min vocab sprint',
      icon: BookOpen,
      href: '/quiz/vocab?mode=quick',
      color: 'bg-blue-500',
      estimatedTime: '5 min',
      difficulty: 'medium'
    },
    {
      id: 'grammar-drill',
      title: 'Grammar',
      description: 'Focus on weak points',
      icon: FileText,
      href: '/quiz/grammar?mode=drill',
      color: 'bg-green-500',
      estimatedTime: '10 min',
      difficulty: 'hard'
    },
    {
      id: 'flashcards-review',
      title: 'Review',
      description: 'Due flashcards',
      icon: Brain,
      href: '/flashcards?filter=due',
      color: 'bg-purple-500',
      estimatedTime: '3 min',
      difficulty: 'easy'
    },
    {
      id: 'reading-practice',
      title: 'Reading',
      description: 'Comprehension',
      icon: BookOpen,
      href: '/reading',
      color: 'bg-indigo-500',
      estimatedTime: '15 min',
      difficulty: 'hard'
    },
    {
      id: 'mock-test',
      title: 'Mock Exam',
      description: 'Timed test',
      icon: Target,
      href: '/mock-exam',
      color: 'bg-red-500',
      estimatedTime: '5-30 min',
      difficulty: 'hard'
    },
    {
      id: 'ai-practice',
      title: 'AI Challenge',
      description: 'Smart questions',
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
      case 'easy': return 'border-green-200 bg-green-50 text-green-700';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'hard': return 'border-red-200 bg-red-50 text-red-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
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
                  className="h-auto p-3 flex flex-col items-center gap-1 text-center relative min-h-[130px] justify-between"
                  onClick={handleAIChallenge}
                  disabled={isGenerating}
                >
                  <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 w-full space-y-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm leading-tight">{action.title}</h4>
                      <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                        {isGenerating ? 'Generating...' : action.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span className="truncate text-xs">{action.estimatedTime}</span>
                      </div>
                      {action.difficulty && (
                        <Badge variant="secondary" className={`text-xs px-1 py-0 ${getDifficultyColor(action.difficulty)}`}>
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
                  className="h-auto p-3 flex flex-col items-center gap-1 text-center relative w-full hover:shadow-md transition-shadow min-h-[130px] justify-between"
                >
                  <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 w-full space-y-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm leading-tight">{action.title}</h4>
                      <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span className="truncate text-xs">{action.estimatedTime}</span>
                      </div>
                      {action.difficulty && (
                        <Badge variant="secondary" className={`text-xs px-1 py-0 ${getDifficultyColor(action.difficulty)}`}>
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
