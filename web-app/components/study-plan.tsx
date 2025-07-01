"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Brain, 
  Target, 
  Calendar, 
  Clock, 
  CheckCircle,
  PlayCircle,
  AlertCircle 
} from "lucide-react";

interface StudyPlanItem {
  id: string;
  title: string;
  type: 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'practice_test';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  completed: boolean;
  dueDate: string;
  description: string;
}

export function StudyPlan() {
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateStudyPlan();
  }, []);

  const generateStudyPlan = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      // For now, generate a sample study plan
      // In a real app, this would call an AI service to generate personalized plans
      const samplePlan: StudyPlanItem[] = [
        {
          id: '1',
          title: 'Review Weak Vocabulary',
          type: 'vocabulary',
          priority: 'high',
          estimatedTime: 15,
          completed: false,
          dueDate: today,
          description: 'Focus on vocabulary items you got wrong in recent quizzes'
        },
        {
          id: '2',
          title: 'Grammar Pattern: ～ばかりに',
          type: 'grammar',
          priority: 'medium',
          estimatedTime: 20,
          completed: false,
          dueDate: today,
          description: 'Learn advanced grammar patterns for N1'
        },
        {
          id: '3',
          title: 'Reading Comprehension Practice',
          type: 'reading',
          priority: 'high',
          estimatedTime: 30,
          completed: false,
          dueDate: today,
          description: 'Practice reading complex texts with academic vocabulary'
        },
        {
          id: '4',
          title: 'Mini Practice Test',
          type: 'practice_test',
          priority: 'medium',
          estimatedTime: 45,
          completed: false,
          dueDate: today,
          description: 'Timed mini-test covering all sections'
        }
      ];
      
      setStudyPlan(samplePlan);
    } catch (error) {
      console.error('Error generating study plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsCompleted = (id: string) => {
    setStudyPlan(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: true } : item
      )
    );
  };

  const getTypeIcon = (type: StudyPlanItem['type']) => {
    switch (type) {
      case 'vocabulary': return <BookOpen className="h-4 w-4" />;
      case 'grammar': return <Brain className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <PlayCircle className="h-4 w-4" />;
      case 'practice_test': return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: StudyPlanItem['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const completedItems = studyPlan.filter(item => item.completed).length;
  const totalItems = studyPlan.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today&apos;s Study Plan
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            {completedItems}/{totalItems} completed
          </Badge>
        </div>
        {totalItems > 0 && (
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {studyPlan.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No study plan for today</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateStudyPlan}
              className="mt-2"
            >
              Generate Plan
            </Button>
          </div>
        ) : (
          studyPlan.map((item) => (
            <div 
              key={item.id} 
              className={`border rounded-lg p-4 transition-all ${
                item.completed 
                  ? 'bg-muted/50 border-muted' 
                  : 'bg-card border-border hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${item.completed ? 'text-muted-foreground' : 'text-primary'}`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                        {item.priority}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.estimatedTime}m
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${item.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant={item.completed ? "outline" : "default"}
                      size="sm"
                      onClick={() => markAsCompleted(item.id)}
                      disabled={item.completed}
                      className="text-xs"
                    >
                      {item.completed ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </>
                      ) : (
                        'Start Study'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
