"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Lightbulb
} from "lucide-react";

interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  questions: ReadingQuestion[];
  vocabulary: VocabularyItem[];
}

interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface VocabularyItem {
  term: string;
  reading: string;
  meaning: string;
}

export function ReadingPractice() {
  const [currentPassage, setCurrentPassage] = useState<ReadingPassage | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [showResults, setShowResults] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRandomPassage();
  }, []);

  const loadRandomPassage = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, using sample data
      // In real app, this would fetch from API
      const samplePassage: ReadingPassage = {
        id: '1',
        title: '人工知能の発展と社会への影響',
        content: `近年、人工知能（AI）の急速な発展により、私たちの生活は大きく変化している。特に、機械学習技術の進歩によって、AIは人間の認知能力に匹敵する、あるいはそれを上回る性能を示すようになった。

この技術革新は、医療、教育、交通など様々な分野で応用され、効率性と精度の向上をもたらしている。例えば、医療分野では、AIが画像診断において医師を支援し、早期発見や正確な診断に貢献している。

しかし、AIの普及に伴い、雇用への影響や倫理的な問題も浮上している。多くの専門家は、AIが従来の職業を代替する可能性について懸念を表明している。また、AIの意思決定プロセスの透明性や、プライバシーの保護といった課題も重要な議論の対象となっている。

今後、AIと人間が共存する社会を構築するためには、技術の発展と並行して、教育制度の改革や法的枠組みの整備が不可欠である。私たちは、AIの恩恵を享受しつつ、その負の側面にも適切に対処していく必要がある。`,
        difficulty: 'hard',
        estimatedTime: 15,
        questions: [
          {
            id: 'q1',
            question: '本文によると、AIの発展により最も変化しているのは何ですか。',
            options: [
              '人間の認知能力',
              '私たちの生活',
              '機械学習技術',
              '医療技術'
            ],
            correctAnswer: 1,
            explanation: '第一段落で「私たちの生活は大きく変化している」と明記されています。'
          },
          {
            id: 'q2',
            question: '医療分野でのAIの応用について、本文ではどのように述べられていますか。',
            options: [
              'AIが医師の代わりに診断を行う',
              'AIが医師を支援し、診断に貢献する',
              'AIが新しい治療法を開発する',
              'AIが患者の治療を行う'
            ],
            correctAnswer: 1,
            explanation: '「AIが画像診断において医師を支援し、早期発見や正確な診断に貢献している」と述べられています。'
          }
        ],
        vocabulary: [
          { term: '急速', reading: 'きゅうそく', meaning: 'rapid, quick' },
          { term: '匹敵', reading: 'ひってき', meaning: 'to rival, to equal' },
          { term: '上回る', reading: 'うわまわる', meaning: 'to exceed, to surpass' },
          { term: '応用', reading: 'おうよう', meaning: 'application, practical use' },
          { term: '診断', reading: 'しんだん', meaning: 'diagnosis' },
          { term: '代替', reading: 'だいたい', meaning: 'substitute, alternative' },
          { term: '透明性', reading: 'とうめいせい', meaning: 'transparency' },
          { term: '枠組み', reading: 'わくぐみ', meaning: 'framework' },
          { term: '享受', reading: 'きょうじゅ', meaning: 'to enjoy, to receive benefits' }
        ]
      };
      
      setCurrentPassage(samplePassage);
      setStartTime(new Date());
    } catch (error) {
      console.error('Error loading passage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitAnswers = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!currentPassage) return { correct: 0, total: 0 };
    
    let correct = 0;
    currentPassage.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    
    return { correct, total: currentPassage.questions.length };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPassage) return null;

  const score = calculateScore();
  const timeElapsed = startTime ? Math.round((Date.now() - startTime.getTime()) / 1000 / 60) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {currentPassage.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(currentPassage.difficulty)}>
                {currentPassage.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {currentPassage.estimatedTime}分
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reading Passage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Reading Passage</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVocabulary(!showVocabulary)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Vocabulary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none japanese-text">
            {currentPassage.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          
          {showVocabulary && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Vocabulary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPassage.vocabulary.map((vocab, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium japanese-text">{vocab.term}</div>
                    <div className="text-sm text-muted-foreground japanese-text">{vocab.reading}</div>
                    <div className="text-sm">{vocab.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Comprehension Questions</h3>
          {showResults && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Score: {score.correct}/{score.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Time: {timeElapsed}分</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPassage.questions.map((question, questionIndex) => (
            <div key={question.id} className="space-y-3">
              <h4 className="font-medium">
                {questionIndex + 1}. {question.question}
              </h4>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswers[question.id] === optionIndex;
                  const isCorrect = optionIndex === question.correctAnswer;
                  const showFeedback = showResults;
                  
                  return (
                    <button
                      key={optionIndex}
                      onClick={() => !showResults && handleAnswerSelect(question.id, optionIndex)}
                      disabled={showResults}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        showFeedback
                          ? isCorrect
                            ? 'bg-green-50 border-green-500 text-green-900'
                            : isSelected && !isCorrect
                            ? 'bg-red-50 border-red-500 text-red-900'
                            : 'bg-gray-50 border-gray-200'
                          : isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <span>{option}</span>
                        {showFeedback && isCorrect && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {showResults && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 text-sm">Explanation</div>
                      <div className="text-blue-800 text-sm">{question.explanation}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!showResults && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={submitAnswers}
                disabled={Object.keys(selectedAnswers).length !== currentPassage.questions.length}
                className="px-8"
              >
                Submit Answers
              </Button>
            </div>
          )}
          
          {showResults && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={loadRandomPassage} className="flex-1">
                New Passage
              </Button>
              <Button variant="outline" onClick={() => {
                setShowResults(false);
                setSelectedAnswers({});
                setStartTime(new Date());
              }} className="flex-1">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
