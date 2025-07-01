"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Lightbulb, 
  Sparkles,
  BookOpen,
  BarChart3,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface DashboardStats {
  vocab_due: number;
  grammar_due: number;
  vocab_mastered: number;
  grammar_mastered: number;
  streak_days: number;
  total_studied_today: number;
  weekly_accuracy: number;
}

interface WeaknessReport {
  id: string;
  analysis_data: {
    weakness_areas: Array<{
      category: string;
      severity: string;
      description: string;
      examples: string[];
    }>;
    recommendations: Array<{
      priority: string;
      action: string;
      specific_steps: string[];
      estimated_time: string;
    }>;
    focus_areas: string[];
    strengths: string[];
  };
  created_at: string;
  is_read: boolean;
}

interface RandomItem {
  term: string;
  reading: string;
  meaning_en: string;
  type: 'vocab' | 'grammar';
}

export function AISmartDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestReport, setLatestReport] = useState<WeaknessReport | null>(null);
  const [randomItems, setRandomItems] = useState<RandomItem[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats, latest weakness report, and random items in parallel
      const [statsResponse, reportsResponse, vocabResponse, grammarResponse] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/weakness-analysis?limit=1'),
        fetch('/api/items?section=vocab&filter=random&limit=3'),
        fetch('/api/items?section=grammar&filter=random&limit=2')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        if (reportsData.reports && reportsData.reports.length > 0) {
          setLatestReport(reportsData.reports[0]);
        }
      }

      // Combine vocab and grammar items for "Today's Review" section
      const items: RandomItem[] = [];
      if (vocabResponse.ok) {
        const vocabData = await vocabResponse.json();
        vocabData.items?.slice(0, 3).forEach((item: {
          term: string;
          reading: string;
          meaning_en: string;
        }) => {
          items.push({
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            type: 'vocab'
          });
        });
      }

      if (grammarResponse.ok) {
        const grammarData = await grammarResponse.json();
        grammarData.items?.slice(0, 2).forEach((item: {
          term: string;
          reading: string;
          meaning_en: string;
        }) => {
          items.push({
            term: item.term,
            reading: item.reading,
            meaning_en: item.meaning_en,
            type: 'grammar'
          });
        });
      }

      setRandomItems(items);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeaknessReport = async () => {
    try {
      setIsGeneratingReport(true);
      const response = await fetch('/api/weakness-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: 'on_demand',
          days_back: 30
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLatestReport({
          id: data.report_id,
          analysis_data: data.analysis,
          created_at: new Date().toISOString(),
          is_read: false
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate weakness analysis');
      }
    } catch (error) {
      console.error('Error generating weakness report:', error);
      alert('Failed to generate weakness analysis');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateAIQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      const response = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: 'vocab',
          difficulty: 'medium',
          count: 5,
          use_user_weak_items: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Generated ${data.questions.length} AI questions based on your weak areas!`);
        // You could redirect to a practice session with these questions
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate AI questions');
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      alert('Failed to generate AI questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.vocab_due || 0) + (stats?.grammar_due || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.vocab_due || 0} vocab, {stats?.grammar_due || 0} grammar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mastered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.vocab_mastered || 0) + (stats?.grammar_mastered || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.vocab_mastered || 0} vocab, {stats?.grammar_mastered || 0} grammar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streak_days || 0}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Accuracy</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.weekly_accuracy || 0)}%</div>
            <Progress value={stats?.weekly_accuracy || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="review" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">Today&apos;s Review</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Today's Review Tab */}
        <TabsContent value="review" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Quick Review
                </CardTitle>
                <CardDescription>
                  Random vocabulary and grammar to keep you sharp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {randomItems.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-japanese">{item.term}</span>
                      <Badge variant={item.type === 'vocab' ? 'default' : 'secondary'}>
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.reading}</div>
                    <div className="text-sm">{item.meaning_en}</div>
                  </div>
                ))}
                {randomItems.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No items available for review
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Powered Practice
                </CardTitle>
                <CardDescription>
                  Let AI create personalized questions based on your weaknesses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generateAIQuestions}
                  disabled={isGeneratingQuestions}
                  className="w-full"
                >
                  {isGeneratingQuestions ? 'Generating...' : 'Generate Smart Questions'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/quiz/vocab'}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Regular Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Learning Analysis
              </CardTitle>
              <CardDescription>
                Personalized insights about your learning patterns and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last analysis: {new Date(latestReport.created_at).toLocaleDateString()}
                    </span>
                    {!latestReport.is_read && (
                      <Badge variant="destructive">New</Badge>
                    )}
                  </div>

                  {/* Weakness Areas */}
                  {latestReport.analysis_data.weakness_areas && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Areas to Focus On
                      </h4>
                      {latestReport.analysis_data.weakness_areas.map((area, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{area.category}</span>
                            <Badge variant={area.severity === 'high' ? 'destructive' : 'secondary'}>
                              {area.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{area.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {latestReport.analysis_data.recommendations && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recommendations</h4>
                      {latestReport.analysis_data.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rec.action}</span>
                            <Badge variant={rec.priority === 'high' ? 'default' : 'outline'}>
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {rec.specific_steps?.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-muted-foreground mt-1">
                            Time needed: {rec.estimated_time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strengths */}
                  {latestReport.analysis_data.strengths && latestReport.analysis_data.strengths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Your Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {latestReport.analysis_data.strengths.map((strength, index) => (
                          <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No AI Analysis Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete some practice sessions, then get personalized insights about your learning.
                  </p>
                  <Button 
                    onClick={generateWeaknessReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? 'Analyzing...' : 'Generate AI Analysis'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Study Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Vocabulary Progress</span>
                    <span>{stats?.vocab_mastered || 0} mastered</span>
                  </div>
                  <Progress value={((stats?.vocab_mastered || 0) / Math.max(1, (stats?.vocab_mastered || 0) + (stats?.vocab_due || 0))) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Grammar Progress</span>
                    <span>{stats?.grammar_mastered || 0} mastered</span>
                  </div>
                  <Progress value={((stats?.grammar_mastered || 0) / Math.max(1, (stats?.grammar_mastered || 0) + (stats?.grammar_due || 0))) * 100} />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">Today&apos;s Study</div>
                  <div className="text-2xl font-bold">{stats?.total_studied_today || 0}</div>
                  <div className="text-sm text-muted-foreground">items completed</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => window.location.href = '/flashcards'}>
                  <Brain className="h-4 w-4 mr-2" />
                  Review Flashcards
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/quiz/vocab'}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Vocabulary Quiz
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/quiz/grammar'}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Grammar Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
