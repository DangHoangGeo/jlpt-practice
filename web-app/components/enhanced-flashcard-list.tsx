"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Check, X, BookOpen, Target, Search, Brain, Zap, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface FlashcardItem {
  id: string;
  term?: string;
  reading?: string;
  meaning_en: string;
  meaning_vi?: string;
  example_jp?: string;
  pattern?: string;
  description?: string;
  example?: string;
  section?: string;
  progress?: {
    interval: number;
    next_review: string;
    easiness: number;
    is_mastered: boolean;
  };
}

interface FlashcardProps {
  item: FlashcardItem;
  itemType: "vocab" | "grammar";
  onReview: (known: boolean, type: "vocab" | "grammar") => void;
  onMaster: (known: boolean, type: "vocab" | "grammar") => void;
  onNext: () => void;
}

function EnhancedFlashcard({ item, itemType, onReview, onMaster, onNext }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAIHint, setShowAIHint] = useState(false);
  const [aiHint, setAIHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (known: boolean) => {
    onReview(known, itemType);
    setIsFlipped(false);
    setShowAIHint(false);
    setAIHint(null);
  };

  const handleMaster = (known: boolean) => {
    onMaster(known, itemType);
    setIsFlipped(false);
    setShowAIHint(false);
    setAIHint(null);
  };

  const handleNext = () => {
    onNext();
    setIsFlipped(false);
    setShowAIHint(false);
    setAIHint(null);
  };

  const generateAIHint = async () => {
    try {
      setIsLoadingHint(true);
      const response = await fetch('/api/ai-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: itemType,
          term: item.term || item.pattern,
          reading: item.reading,
          meaning: item.meaning_en,
          example: item.example_jp || item.example
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAIHint(data.hint);
        setShowAIHint(true);
      }
    } catch (error) {
      console.error('Failed to generate AI hint:', error);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const difficultyColor = item.progress?.easiness 
    ? item.progress.easiness < 2.0 ? "text-red-500" 
      : item.progress.easiness > 2.8 ? "text-green-500" 
      : "text-yellow-500"
    : "text-gray-500";

  return (
    <Card className="w-full max-w-md mx-auto min-h-[400px] cursor-pointer transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="capitalize">
            {itemType}
          </Badge>
          <div className="flex gap-2">
            {item.progress && (
              <Badge variant="secondary" className={difficultyColor}>
                Ease: {item.progress.easiness.toFixed(1)}
              </Badge>
            )}
            {item.progress?.is_mastered && (
              <Badge className="bg-green-100 text-green-800">
                Mastered
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div onClick={handleFlip} className="flex-1 flex items-center justify-center min-h-[200px]">
          {!isFlipped ? (
            // Front of card
            <div className="text-center w-full">
              {itemType === "vocab" ? (
                <>
                  <div className="text-3xl font-bold mb-2 text-gray-900">
                    {item.term}
                  </div>
                  {item.reading && (
                    <div className="text-lg text-gray-600 mb-4">
                      ({item.reading})
                    </div>
                  )}
                  {item.section && (
                    <Badge variant="outline" className="mb-4">
                      {item.section}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mb-2 text-gray-900">
                    {item.term}
                  </div>
                  {item.reading && (
                    <div className="text-lg text-gray-600 mb-4">
                      ({item.reading})
                    </div>
                  )}
                  <Badge variant="outline" className="mb-4">
                    Grammar
                  </Badge>
                </>
              )}
              <p className="text-sm text-gray-500 mt-8">Tap to reveal meaning</p>
              
              {/* AI Hint Button */}
              {!showAIHint && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateAIHint();
                  }}
                  disabled={isLoadingHint}
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  {isLoadingHint ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-pulse" />
                      Getting hint...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Hint
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            // Back of card
            <div className="text-center w-full">
              <div className="text-xl font-medium mb-4 text-gray-900">
                {item.meaning_en}
              </div>
              {item.meaning_vi && (
                <div className="text-lg text-gray-600 mb-4">
                  {item.meaning_vi}
                </div>
              )}
              {item.example_jp && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">{item.example_jp}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Hint Display */}
        {showAIHint && aiHint && !isFlipped && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Hint</span>
            </div>
            <div className="text-sm text-blue-700">
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="font-semibold text-blue-800">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  p: ({ children }) => <p className="mb-1">{children}</p>,
                }}
              >
                {aiHint}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {isFlipped && (
          <div className="space-y-3 mt-6">
            {/* Review buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleReview(false)}
                variant="outline"
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Again
              </Button>
              <Button
                onClick={() => handleReview(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Know
              </Button>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleMaster(true)}
                variant="ghost"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-800"
              >
                 <Zap className="h-4 w-4 mr-2" />
                Master
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="sm"
                className="flex-1 text-blue-600 hover:text-blue-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Next
              </Button>
            </div>
          </div>
        )}
        
        {!isFlipped && (
          <div className="space-y-3 mt-6">
            <Button onClick={handleFlip} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Flip Card
            </Button>
            
            {/* Quick actions when not flipped */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleMaster(true)}
                variant="ghost"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-800"
              >
                <Zap className="h-4 w-4 mr-2" />
                Master
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="sm"
                className="flex-1 text-blue-600 hover:text-blue-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {item.progress && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600">Next review:</span>
              <span className="text-xs font-medium">{item.progress.next_review}</span>
            </div>
            <Progress 
              value={(item.progress.easiness - 1.3) / (2.5 - 1.3) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type FilterType = 'all' | 'due' | 'new' | 'difficult' | 'mastered' | 'ai-generated';

export function EnhancedFlashcardList() {
  const [vocabCards, setVocabCards] = useState<FlashcardItem[]>([]);
  const [grammarCards, setGrammarCards] = useState<FlashcardItem[]>([]);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [currentGrammarIndex, setCurrentGrammarIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vocab");
  
  // Enhanced features
  const [filter, setFilter] = useState<FilterType>('due');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchSize, setBatchSize] = useState(20);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    streakCount: 0
  });

  const fetchFlashcards = useCallback(async (customFilter?: FilterType) => {
    try {
      setIsLoading(true);
      
      const actualFilter = customFilter || filter;
      
      // Fetch vocab flashcards
      let vocabUrl = `/api/flashcards?section=vocab&filter=${actualFilter}&limit=${batchSize}`;
      if (searchTerm) {
        vocabUrl += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      // Fetch grammar flashcards
      let grammarUrl = `/api/flashcards?section=grammar&filter=${actualFilter}&limit=${batchSize}`;
      if (searchTerm) {
        grammarUrl += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const [vocabResponse, grammarResponse] = await Promise.all([
        fetch(vocabUrl),
        fetch(grammarUrl)
      ]);
      
      const [vocabData, grammarData] = await Promise.all([
        vocabResponse.json(),
        grammarResponse.json()
      ]);
      
      setVocabCards(vocabData.flashcards || []);
      setGrammarCards(grammarData.flashcards || []);
      
      // Reset indices when new data is loaded
      setCurrentVocabIndex(0);
      setCurrentGrammarIndex(0);
      
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, batchSize, searchTerm]);

  const generateAIFlashcards = async (section: 'vocab' | 'grammar') => {
    try {
      setIsGeneratingAI(true);
      
      const response = await fetch('/api/ai-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section,
          count: 10,
          difficulty: 'medium',
          focus_areas: searchTerm ? [searchTerm] : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI flashcards');
      }

      const data = await response.json();
      
      // Add generated cards to current set
      if (section === 'vocab') {
        setVocabCards(prev => [...prev, ...data.flashcards]);
      } else {
        setGrammarCards(prev => [...prev, ...data.flashcards]);
      }
      
    } catch (error) {
      console.error("Failed to generate AI flashcards:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const handleVocabReview = async (known: boolean) => {
    const currentCard = vocabCards[currentVocabIndex];
    if (!currentCard) return;

    try {
      const response = await fetch("/api/flashcards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: currentCard.id,
          item_type: "vocab",
          known,
        }),
      });

      if (response.ok) {
        // Update session stats
        setSessionStats(prev => ({
          reviewed: prev.reviewed + 1,
          correct: known ? prev.correct + 1 : prev.correct,
          streakCount: known ? prev.streakCount + 1 : 0
        }));

        // Move to next card or refresh if at end
        if (currentVocabIndex < vocabCards.length - 1) {
          setCurrentVocabIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const handleGrammarReview = async (known: boolean, type: 'vocab' | 'grammar') => {
    const currentCard = grammarCards[currentGrammarIndex];
    if (!currentCard) return;

    try {
      const response = await fetch("/api/flashcards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: currentCard.id,
          item_type: type,
          known,
        }),
      });

      if (response.ok) {
        // Update session stats
        setSessionStats(prev => ({
          reviewed: prev.reviewed + 1,
          correct: known ? prev.correct + 1 : prev.correct,
          streakCount: known ? prev.streakCount + 1 : 0
        }));

        // Move to next card or refresh if at end
        if (currentGrammarIndex < grammarCards.length - 1) {
          setCurrentGrammarIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const handleVocabMaster = async (master: boolean, type: 'vocab' | 'grammar') => {
    const currentCard = vocabCards[currentVocabIndex];
    if (!currentCard) return;

    try {
      const response = await fetch("/api/flashcards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: currentCard.id,
          item_type: type,
          known: master,
          mark_as_mastered: master, // Skip does not count as mastery
        }),
      });

      if (response.ok) {
        // Update session stats
        setSessionStats(prev => ({
          reviewed: prev.reviewed + 1,
          correct: master ? prev.correct + 1 : prev.correct,
          streakCount: master ? prev.streakCount + 1 : 0
        }));

        // Move to next card or refresh if at end
        if (currentVocabIndex < vocabCards.length - 1) {
          setCurrentVocabIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  const handleVocabNext = () => {
    if (currentVocabIndex < vocabCards.length - 1) {
      setCurrentVocabIndex(prev => prev + 1);
    } else {
      fetchFlashcards(); // Refresh with new cards
    }
  };

  const handleGrammarMaster = async (master: boolean, type: 'vocab' | 'grammar') => {
    const currentCard = grammarCards[currentGrammarIndex];
    if (!currentCard) return;

    try {
      const response = await fetch("/api/flashcards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: currentCard.id,
          item_type: type,
          known: master,
          mark_as_mastered: master, // Skip does not count as mastery
        }),
      });

      if (response.ok) {
        // Update session stats
        setSessionStats(prev => ({
          reviewed: prev.reviewed + 1,
          correct: master ? prev.correct + 1 : prev.correct,
          streakCount: master ? prev.streakCount + 1 : 0
        }));

        // Move to next card or refresh if at end
        if (currentGrammarIndex < grammarCards.length - 1) {
          setCurrentGrammarIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  const handleGrammarNext = () => {
    if (currentGrammarIndex < grammarCards.length - 1) {
      setCurrentGrammarIndex(prev => prev + 1);
    } else {
      fetchFlashcards(); // Refresh with new cards
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading flashcards...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Enhanced Controls */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {(['due', 'new', 'difficult', 'mastered', 'all'] as FilterType[]).map((filterOption) => (
                  <Button
                    key={filterOption}
                    onClick={() => {
                      setFilter(filterOption);
                      fetchFlashcards(filterOption);
                    }}
                    variant={filter === filterOption ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                  >
                    {filterOption}
                  </Button>
                ))}
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Session Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Reviewed:</span>
                  <Badge variant="outline">{sessionStats.reviewed}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <Badge variant="outline">
                    {sessionStats.reviewed > 0 
                      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
                      : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Streak:</span>
                  <Badge className={sessionStats.streakCount > 5 ? "bg-green-100 text-green-800" : ""}>
                    {sessionStats.streakCount}
                  </Badge>
                </div>
              </div>
            </div>

            {/* AI Tools */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Tools
              </h3>
              <Button
                onClick={() => generateAIFlashcards(activeTab as 'vocab' | 'grammar')}
                disabled={isGeneratingAI}
                className="w-full"
                variant="outline"
              >
                {isGeneratingAI ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI Cards
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm">Batch size:</label>
                <Input
                  type="number"
                  min="10"
                  max="50"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 20)}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{vocabCards.length}</div>
                <div className="text-sm text-gray-600">Vocab Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{grammarCards.length}</div>
                <div className="text-sm text-gray-600">Grammar Cards</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {vocabCards.filter(c => c.progress?.is_mastered).length + 
                   grammarCards.filter(c => c.progress?.is_mastered).length}
                </div>
                <div className="text-sm text-gray-600">Mastered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {sessionStats.reviewed}
                </div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="vocab" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Vocabulary ({vocabCards.length})
          </TabsTrigger>
          <TabsTrigger value="grammar" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Grammar ({grammarCards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vocab">
          {vocabCards.length > 0 ? (
            <div className="text-center">
              <div className="mb-4">
                <Badge variant="outline">
                  Card {currentVocabIndex + 1} of {vocabCards.length}
                </Badge>
              </div>
              <EnhancedFlashcard
                item={vocabCards[currentVocabIndex]}
                itemType="vocab"
                onReview={handleVocabReview}
                onMaster={handleVocabMaster}
                onNext={handleVocabNext}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No vocabulary cards available</h3>
              <p className="text-gray-600 mb-4">
                Try changing the filter or generate new AI cards.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => fetchFlashcards()}>
                  Refresh
                </Button>
                <Button 
                  onClick={() => generateAIFlashcards('vocab')} 
                  variant="outline"
                  disabled={isGeneratingAI}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Cards
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grammar">
          {grammarCards.length > 0 ? (
            <div className="text-center">
              <div className="mb-4">
                <Badge variant="outline">
                  Card {currentGrammarIndex + 1} of {grammarCards.length}
                </Badge>
              </div>
              <EnhancedFlashcard
                item={grammarCards[currentGrammarIndex]}
                itemType="grammar"
                onReview={handleGrammarReview}
                onMaster={handleGrammarMaster}
                onNext={handleGrammarNext}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No grammar cards available</h3>
              <p className="text-gray-600 mb-4">
                Try changing the filter or generate new AI cards.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => fetchFlashcards()}>
                  Refresh
                </Button>
                <Button 
                  onClick={() => generateAIFlashcards('grammar')} 
                  variant="outline"
                  disabled={isGeneratingAI}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate AI Cards
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
