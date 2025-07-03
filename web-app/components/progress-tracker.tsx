"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, TrendingUp, Clock } from "lucide-react";

interface ProgressData {
  vocabularyMastered: number;
  grammarMastered: number;
  overallProgress: number;
  studyStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  timeStudiedToday: number;
  estimatedReadiness: number;
}

export function ProgressTracker() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        const totalMastered = (data.vocab_mastered || 0) + (data.grammar_mastered || 0);
        const totalDue = (data.vocab_due || 0) + (data.grammar_due || 0);
        const overallProgress = Math.min(100, Math.round(((totalMastered) / Math.max(totalMastered + totalDue, 20)) * 100));
        
        setProgressData({
          vocabularyMastered: data.vocab_mastered || 0,
          grammarMastered: data.grammar_mastered || 0,
          overallProgress: overallProgress,
          studyStreak: data.streak_days || 0,
          weeklyGoal: 50, // questions per week
          weeklyProgress: data.weekly_studied || 0,
          timeStudiedToday: Math.round((data.total_studied_today || 0) * 2), // Estimate 2 minutes per question
          estimatedReadiness: data.weekly_accuracy || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!progressData) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          JLPT N1 Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Readiness</span>
            <Badge variant={progressData.overallProgress >= 70 ? "default" : "secondary"}>
              {progressData.overallProgress}%
            </Badge>
          </div>
          <Progress value={progressData.overallProgress} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Study Streak
            </div>
            <div className="text-2xl font-bold">{progressData.studyStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Today
            </div>
            <div className="text-2xl font-bold">{progressData.timeStudiedToday}</div>
            <div className="text-xs text-muted-foreground">minutes</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Vocabulary
            </div>
            <div className="text-2xl font-bold">{progressData.vocabularyMastered}</div>
            <div className="text-xs text-muted-foreground">mastered</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Grammar
            </div>
            <div className="text-2xl font-bold">{progressData.grammarMastered}</div>
            <div className="text-xs text-muted-foreground">mastered</div>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Weekly Goal</span>
            <span className="text-sm text-muted-foreground">
              {progressData.weeklyProgress}/{progressData.weeklyGoal}
            </span>
          </div>
          <Progress 
            value={(progressData.weeklyProgress / progressData.weeklyGoal) * 100} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
