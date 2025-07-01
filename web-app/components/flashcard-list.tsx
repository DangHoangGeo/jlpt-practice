"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Check, X, BookOpen, Target } from "lucide-react";

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
  onReview: (known: boolean) => void;
}

function Flashcard({ item, itemType, onReview }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = (known: boolean) => {
    onReview(known);
    setIsFlipped(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto min-h-[300px] cursor-pointer">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div onClick={handleFlip} className="flex-1 flex items-center justify-center">
          {!isFlipped ? (
            // Front of card
            <div className="text-center">
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
                  <div className="text-2xl font-bold mb-4 text-gray-900">
                    {item.pattern}
                  </div>
                  <Badge variant="outline" className="mb-4">
                    Grammar Pattern
                  </Badge>
                </>
              )}
              <p className="text-sm text-gray-500 mt-8">Tap to reveal meaning</p>
            </div>
          ) : (
            // Back of card
            <div className="text-center">
              <div className="text-xl font-medium mb-4 text-gray-900">
                {item.meaning_en}
              </div>
              {item.meaning_vi && (
                <div className="text-lg text-gray-600 mb-4">
                  {item.meaning_vi}
                </div>
              )}
              {itemType === "vocab" && item.example_jp && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">{item.example_jp}</p>
                </div>
              )}
              {itemType === "grammar" && (
                <>
                  {item.description && (
                    <div className="text-sm text-gray-600 mb-3">
                      {item.description}
                    </div>
                  )}
                  {item.example && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">{item.example}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {isFlipped && (
          <div className="flex gap-4 mt-6">
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
        )}
        
        {!isFlipped && (
          <Button onClick={handleFlip} variant="outline" className="mt-6">
            <RotateCcw className="h-4 w-4 mr-2" />
            Flip Card
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function FlashcardList() {
  const [vocabCards, setVocabCards] = useState<FlashcardItem[]>([]);
  const [grammarCards, setGrammarCards] = useState<FlashcardItem[]>([]);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [currentGrammarIndex, setCurrentGrammarIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vocab");

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      setIsLoading(true);
      
      // Fetch vocab flashcards
      const vocabResponse = await fetch("/api/flashcards?section=vocab&filter=due&limit=20");
      const vocabData = await vocabResponse.json();
      
      // Fetch grammar flashcards
      const grammarResponse = await fetch("/api/flashcards?section=grammar&filter=due&limit=20");
      const grammarData = await grammarResponse.json();
      
      setVocabCards(vocabData.flashcards || []);
      setGrammarCards(grammarData.flashcards || []);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        // Move to next card or refresh if at end
        if (currentVocabIndex < vocabCards.length - 1) {
          setCurrentVocabIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
          setCurrentVocabIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const handleGrammarReview = async (known: boolean) => {
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
          item_type: "grammar",
          known,
        }),
      });

      if (response.ok) {
        // Move to next card or refresh if at end
        if (currentGrammarIndex < grammarCards.length - 1) {
          setCurrentGrammarIndex(prev => prev + 1);
        } else {
          // Refresh the list
          fetchFlashcards();
          setCurrentGrammarIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
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
    <div className="w-full max-w-4xl mx-auto">
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
              <Flashcard
                item={vocabCards[currentVocabIndex]}
                itemType="vocab"
                onReview={handleVocabReview}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No vocabulary cards due</h3>
              <p className="text-gray-600 mb-4">
                Great job! You&apos;ve reviewed all your vocabulary cards for today.
              </p>
              <Button onClick={fetchFlashcards}>
                Check for new cards
              </Button>
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
              <Flashcard
                item={grammarCards[currentGrammarIndex]}
                itemType="grammar"
                onReview={handleGrammarReview}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No grammar cards due</h3>
              <p className="text-gray-600 mb-4">
                Excellent! You&apos;ve reviewed all your grammar patterns for today.
              </p>
              <Button onClick={fetchFlashcards}>
                Check for new cards
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
