"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, RotateCcw, Search, Filter, Plus, Brain, Zap, Target } from "lucide-react";
import { AIExplanation } from "@/components/ai-explanation";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  answer_index: number;
  explanation: string;
  vocabulary_items?: {
    id: string;
    term: string;
    reading: string;
    meaning_en: string;
    example_jp: string;
  };
  grammar_items?: {
    id: string;
    term: string;
    reading: string;
    meaning_en: string;
    meaning_vi: string;
    example_jp: string;
  };
}

interface QuizResult {
  question: Question;
  userAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

interface EnhancedQuizCardProps {
  section: "vocab" | "grammar";
}

type FilterType = 'all' | 'due' | 'new' | 'difficult' | 'ai-generated';
type DifficultyType = 'easy' | 'medium' | 'hard';

export function EnhancedQuizCard({ section }: EnhancedQuizCardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  // Enhanced features
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyType>('medium');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');

  const fetchQuestions = useCallback(async (customFilter?: FilterType, customBatchSize?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const actualFilter = customFilter || filter;
      const actualBatchSize = customBatchSize || batchSize;
      
      let url = `/api/questions?section=${section}&filter=${actualFilter}&limit=${actualBatchSize}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      
      const data = await response.json();
      console.log('Enhanced Quiz API response:', data);
      
      setQuestions(data.questions || []);
      
      if (data.questions?.length === 0) {
        setError(`No ${actualFilter} questions available. Try a different filter or generate new ones!`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [section, filter, batchSize, searchTerm]);

  const generateAIQuestions = async () => {
    try {
      setIsGeneratingAI(true);
      setError(null);
      
      const response = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          count: batchSize,
          difficulty,
          focus_areas: searchTerm ? [searchTerm] : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI questions');
      }

      const data = await response.json();
      
      // Add generated questions to current set
      setQuestions(prev => [...prev, ...data.questions]);
      
      // Switch to AI-generated filter to show new questions
      setFilter('ai-generated');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI questions");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const loadMoreQuestions = async () => {
    await fetchQuestions(filter, 5); // Load 5 more questions
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.answer_index;
    const timeSpent = Date.now() - questionStartTime;
    
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Store result for detailed review
    const result: QuizResult = {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent
    };
    setQuizResults(prev => [...prev, result]);

    logActivity(isCorrect);
  };

  const logActivity = async (isCorrect: boolean) => {
    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_type: 'enhanced_quiz_answer',
          item_id: currentQuestion.vocabulary_items?.id || currentQuestion.grammar_items?.id,
          item_type: section,
          details: {
            question_id: currentQuestion.id,
            question_text: currentQuestion.question_text,
            user_answer_index: selectedAnswer,
            correct_answer_index: currentQuestion.answer_index,
            correct: isCorrect,
            options: currentQuestion.options,
            filter_used: filter,
            difficulty_setting: difficulty
          },
          response_time_ms: Date.now() - questionStartTime,
          confidence_level: isCorrect ? 4 : 2
        })
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    }
    // Note: Quiz completion is handled by the isQuizComplete computed value
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
    setQuestionStartTime(Date.now());
    setQuizResults([]);
    setShowDetailedResults(false);
    fetchQuestions();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading questions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => fetchQuestions()}>Try Again</Button>
              <Button onClick={generateAIQuestions} disabled={isGeneratingAI} variant="outline">
                {isGeneratingAI ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate AI Questions
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No questions available</p>
            <Button onClick={() => fetchQuestions()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isQuizComplete = currentQuestionIndex === questions.length - 1 && showResult;

  if (isQuizComplete) {
    if (showDetailedResults) {
      return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-between">
                <span>Quiz Results</span>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailedResults(false)}
                >
                  Back to Summary
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {quizResults.map((result, index) => (
                  <Card key={index} className={`border-2 ${result.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Question {index + 1}</h3>
                        <div className="flex items-center gap-2">
                          {result.isCorrect ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {Math.round(result.timeSpent / 1000)}s
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium">{result.question.question_text}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {result.question.options.map((option, optionIndex) => {
                          let className = "p-3 rounded border text-left ";
                          if (optionIndex === result.question.answer_index) {
                            className += "border-green-500 bg-green-50 text-green-800";
                          } else if (optionIndex === result.userAnswer && !result.isCorrect) {
                            className += "border-red-500 bg-red-50 text-red-800";
                          } else {
                            className += "border-gray-200 bg-gray-50";
                          }

                          return (
                            <div key={optionIndex} className={className}>
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {optionIndex === result.question.answer_index && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {optionIndex === result.userAnswer && !result.isCorrect && (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Explanation:</h4>
                        <p className="text-sm text-gray-700">{result.question.explanation}</p>
                      </div>

                      {!result.isCorrect && (
                        <AIExplanation
                          question={result.question.question_text}
                          userAnswer={result.question.options[result.userAnswer]}
                          correctAnswer={result.question.options[result.question.answer_index]}
                          options={result.question.options}
                          itemType={section}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Card className="w-full max-w-4xl mx-auto">
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
          
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-green-800 font-medium">Correct</div>
                <div className="text-2xl font-bold text-green-600">{score.correct}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-red-800 font-medium">Incorrect</div>
                <div className="text-2xl font-bold text-red-600">{score.total - score.correct}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => setShowDetailedResults(true)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              View Detailed Results
            </Button>
            <Button onClick={handleRestart} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={loadMoreQuestions} variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Load More Questions
            </Button>
            <Button onClick={generateAIQuestions} variant="outline" disabled={isGeneratingAI}>
              {isGeneratingAI ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Enhanced Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="practice">
                <Target className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="ai-tools">
                <Brain className="h-4 w-4 mr-2" />
                AI Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder={`Search ${section} terms...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button onClick={() => fetchQuestions()} size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="cursor-pointer">
                  Questions: {questions.length}
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  Progress: {currentQuestionIndex + 1}/{questions.length}
                </Badge>
                <Badge variant="outline" className="cursor-pointer">
                  Score: {score.correct}/{score.total}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['all', 'due', 'new', 'difficult'] as FilterType[]).map((filterOption) => (
                  <Button
                    key={filterOption}
                    onClick={() => {
                      setFilter(filterOption);
                      fetchQuestions(filterOption);
                    }}
                    variant={filter === filterOption ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                  >
                    {filterOption}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Batch size:</label>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                    className="w-20"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Difficulty:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-tools" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={generateAIQuestions}
                  disabled={isGeneratingAI}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  {isGeneratingAI ? (
                    <Brain className="h-6 w-6 animate-pulse" />
                  ) : (
                    <Zap className="h-6 w-6" />
                  )}
                  <div className="text-sm font-medium">
                    {isGeneratingAI ? 'Generating...' : 'Generate AI Questions'}
                  </div>
                  <div className="text-xs opacity-80">
                    Custom questions based on your performance
                  </div>
                </Button>

                <Button
                  onClick={loadMoreQuestions}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Plus className="h-6 w-6" />
                  <div className="text-sm font-medium">Load More</div>
                  <div className="text-xs opacity-80">
                    Add {batchSize} more questions
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">
                Score: {score.correct}/{score.total}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {filter}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
            
            {/* Context Information */}
            {showResult && section === "vocab" && currentQuestion.vocabulary_items && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Context:</p>
                <p className="font-medium">{currentQuestion.vocabulary_items.term} ({currentQuestion.vocabulary_items.reading})</p>
                <p className="text-sm text-gray-600">{currentQuestion.vocabulary_items.example_jp}</p>
              </div>
            )}

            {showResult && section === "grammar" && currentQuestion.grammar_items && (
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
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Explanation:</h4>
                <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
              </div>
              
              {/* AI Explanation for wrong answers */}
              {selectedAnswer !== currentQuestion.answer_index && (
                <AIExplanation
                  question={currentQuestion.question_text}
                  userAnswer={currentQuestion.options[selectedAnswer!]}
                  correctAnswer={currentQuestion.options[currentQuestion.answer_index]}
                  options={currentQuestion.options}
                  itemType={section}
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
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
              <div className="flex gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNext} className="px-8">
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={loadMoreQuestions} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Load More
                  </Button>
                )}
                <Button onClick={handleRestart} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
