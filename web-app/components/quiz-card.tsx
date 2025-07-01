"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  answer_index: number;
  explanation: string;
  vocabulary_items?: {
    term: string;
    reading: string;
    meaning_en: string;
    example_jp: string;
  };
  grammar_items?: {
    term: string;
    reading: string;
    meaning_en: string;
    meaning_vi: string;
    example_jp: string;
  };
}

interface QuizCardProps {
  section: "vocab" | "grammar";
}

export function QuizCard({ section }: QuizCardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/questions?section=${section}&filter=due&limit=10`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      
      const data = await response.json();
      console.log('Quiz API response:', data);
      console.log('Questions received:', data.questions?.length);
      setQuestions(data.questions || []);
      
      if (data.questions?.length === 0) {
        setError("No questions available. Try adding some content first!");
      } else {
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [section]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (selectedAnswer === currentQuestion.answer_index ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading questions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchQuestions}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No questions available</p>
            <Button onClick={fetchQuestions}>Refresh</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isQuizComplete = currentQuestionIndex === questions.length - 1 && showResult;

  if (isQuizComplete) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {score.correct}/{score.total}
            </div>
            <div className="text-lg text-gray-600">
              {Math.round((score.correct / score.total) * 100)}% Correct
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
          <Badge variant="outline">
            Score: {score.correct}/{score.total}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          
          {/* Context Information */}
          {section === "vocab" && currentQuestion.vocabulary_items && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Context:</p>
              <p className="font-medium">{currentQuestion.vocabulary_items.term} ({currentQuestion.vocabulary_items.reading})</p>
              <p className="text-sm text-gray-600">{currentQuestion.vocabulary_items.example_jp}</p>
            </div>
          )}
          
          {section === "grammar" && currentQuestion.grammar_items && (
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Pattern:</p>
              <p className="font-medium">{currentQuestion.grammar_items.term}</p>
              <p className="text-sm text-gray-600">{currentQuestion.grammar_items.example_jp}</p>
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = "w-full text-left p-4 border rounded-lg transition-colors ";
            
            if (!showResult) {
              buttonClass += selectedAnswer === index 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
            } else {
              if (index === currentQuestion.answer_index) {
                buttonClass += "border-green-500 bg-green-50 text-green-800";
              } else if (selectedAnswer === index) {
                buttonClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                buttonClass += "border-gray-200 bg-gray-50";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={buttonClass}
                disabled={showResult}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && index === currentQuestion.answer_index && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showResult && selectedAnswer === index && index !== currentQuestion.answer_index && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showResult && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium mb-2">Explanation:</h4>
            <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div></div> {/* Spacer */}
          {!showResult ? (
            <Button 
              onClick={handleSubmit} 
              disabled={selectedAnswer === null}
              className="px-8"
            >
              Submit
            </Button>
          ) : (
            <Button onClick={handleNext} className="px-8">
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
