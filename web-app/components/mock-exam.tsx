"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock,
  Target,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from "lucide-react";

interface MockExamQuestion {
  id: string;
  section: 'vocabulary' | 'grammar' | 'reading';
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  timeLimit?: number; // in seconds
}

interface ExamSession {
  id: string;
  totalQuestions: number;
  totalPoints: number;
  timeLimit: number; // in minutes
  questions: MockExamQuestion[];
}

interface ExamResult {
  score: number;
  totalPoints: number;
  percentage: number;
  timeUsed: number;
  sectionBreakdown: {
    vocabulary: { correct: number; total: number };
    grammar: { correct: number; total: number };
    reading: { correct: number; total: number };
  };
}

export function MockExam() {
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitExam = useCallback(() => {
    if (!examSession) return;

    setIsRunning(false);
    
    let score = 0;
    const sectionBreakdown = {
      vocabulary: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 }
    };

    examSession.questions.forEach(question => {
      sectionBreakdown[question.section].total += question.points;
      
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
        sectionBreakdown[question.section].correct += question.points;
      }
    });

    const result: ExamResult = {
      score,
      totalPoints: examSession.totalPoints,
      percentage: Math.round((score / examSession.totalPoints) * 100),
      timeUsed: examSession.timeLimit * 60 - timeLeft,
      sectionBreakdown
    };

    setExamResult(result);
    setShowResults(true);
  }, [examSession, answers, timeLeft]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, submitExam]);

  const startExam = async (type: 'mini' | 'full') => {
    setIsLoading(true);
    
    try {
      // Generate sample exam data
      // In real app, this would fetch from API
      const sampleQuestions: MockExamQuestion[] = [
        {
          id: '1',
          section: 'vocabulary',
          question: '次の文の（　）に入る最も適当なものを選びなさい。\n彼の提案は非常に（　）で、すぐに採用された。',
          options: ['独創的', '保守的', '消極的', '一般的'],
          correctAnswer: 0,
          points: 1
        },
        {
          id: '2',
          section: 'grammar',
          question: '次の文の（　）に入る最も適当なものを選びなさい。\n雨が降って（　）、運動会は中止になった。',
          options: ['いるから', 'きたため', 'いるので', 'くるから'],
          correctAnswer: 1,
          points: 1
        },
        {
          id: '3',
          section: 'reading',
          question: '次の文章を読んで、問いに答えなさい。\n\n現代社会において、テクノロジーの進歩は目覚ましいものがある。特に人工知能の発達により、私たちの生活は大きく変化している。\n\n筆者が最も強調していることは何ですか。',
          options: ['現代社会の問題', 'テクノロジーの進歩', '人工知能の危険性', '生活の変化'],
          correctAnswer: 1,
          points: 2
        }
      ];

      const session: ExamSession = {
        id: Date.now().toString(),
        totalQuestions: type === 'mini' ? 3 : 10,
        totalPoints: type === 'mini' ? 4 : 20,
        timeLimit: type === 'mini' ? 5 : 30, // minutes
        questions: sampleQuestions.slice(0, type === 'mini' ? 3 : 10)
      };

      setExamSession(session);
      setTimeLeft(session.timeLimit * 60); // convert to seconds
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setExamResult(null);
      setIsRunning(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPassStatus = (percentage: number) => {
    if (percentage >= 60) return { status: 'PASS', color: 'bg-green-100 text-green-800' };
    return { status: 'FAIL', color: 'bg-red-100 text-red-800' };
  };

  // Exam selection screen
  if (!examSession) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            JLPT N1 Mock Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Practice with timed mock exams to prepare for the real JLPT N1 test.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => startExam('mini')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Mini Test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quick practice test
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points:</span>
                    <span>4</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Mini Test'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => startExam('full')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold mb-2">Full Test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete practice exam
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points:</span>
                    <span>20</span>
                  </div>
                </div>
                <Button className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? 'Starting...' : 'Start Full Test'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (showResults && examResult) {
    const passStatus = getPassStatus(examResult.percentage);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(examResult.percentage)}>
                {examResult.percentage}%
              </span>
            </div>
            <Badge className={passStatus.color}>
              {passStatus.status}
            </Badge>
            <div className="text-muted-foreground">
              {examResult.score} / {examResult.totalPoints} points
            </div>
            <div className="text-sm text-muted-foreground">
              Time used: {formatTime(examResult.timeUsed)}
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold">Section Breakdown</h3>
            {Object.entries(examResult.sectionBreakdown).map(([section, data]) => (
              <div key={section} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="capitalize font-medium">{section}</span>
                  <span className="text-sm">
                    {data.correct} / {data.total} points
                  </span>
                </div>
                <Progress 
                  value={data.total > 0 ? (data.correct / data.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => setExamSession(null)}
              className="flex-1"
            >
              Take Another Exam
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setTimeLeft(examSession.timeLimit * 60);
                setIsRunning(true);
                setIsPaused(false);
              }}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Exam in progress
  const currentQuestion = examSession.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examSession.totalQuestions) * 100;
  const timeLeftMinutes = Math.floor(timeLeft / 60);
  const timeLeftSeconds = timeLeft % 60;
  const isTimeRunningOut = timeLeft < 300; // Last 5 minutes

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Exam Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {examSession.totalQuestions}
              </Badge>
              <Badge className="capitalize">{currentQuestion.section}</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isTimeRunningOut ? 'text-red-600' : ''}`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {timeLeftMinutes}:{timeLeftSeconds.toString().padStart(2, '0')}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardContent>
      </Card>

      {isPaused && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <PauseCircle className="h-5 w-5" />
              <span className="font-medium">Exam Paused</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Click the play button to resume the exam.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="japanese-text text-lg leading-relaxed whitespace-pre-line">
              {currentQuestion.question}
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    disabled={isPaused}
                    className={`w-full p-4 text-left rounded-lg border transition-colors touch-target ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-muted'
                    } ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[20px]">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="japanese-text">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0 || isPaused}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {Object.keys(answers).length} / {examSession.totalQuestions} answered
            </span>
            
            {currentQuestionIndex === examSession.totalQuestions - 1 ? (
              <Button
                onClick={submitExam}
                disabled={isPaused}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(examSession.totalQuestions - 1, prev + 1))}
                disabled={isPaused}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
