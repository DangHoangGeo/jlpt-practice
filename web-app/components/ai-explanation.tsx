"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface AIExplanationProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  options: string[];
  itemType: 'vocab' | 'grammar';
  onExplanationGenerated?: (explanation: string) => void;
}

export function AIExplanation({ 
  question, 
  userAnswer, 
  correctAnswer, 
  options, 
  itemType,
  onExplanationGenerated 
}: AIExplanationProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateExplanation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          options,
          item_type: itemType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate explanation');
      }

      const data = await response.json();
      setExplanation(data.explanation);
      
      if (onExplanationGenerated) {
        onExplanationGenerated(data.explanation);
      }

      // Log the AI explanation request
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_type: 'ai_explanation_request',
          details: {
            question,
            user_answer: userAnswer,
            correct_answer: correctAnswer,
            item_type: itemType
          }
        })
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setIsLoading(false);
    }
  };

  if (explanation) {
    return (
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Brain className="h-5 w-5" />
            AI Explanation
          </CardTitle>
          <CardDescription>
            Personalized explanation for this question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown
              components={{
                strong: ({ children }) => <strong className="font-semibold text-blue-700">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
              }}
            >
              {explanation}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={generateExplanation}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      <Button 
        onClick={generateExplanation}
        disabled={isLoading}
        variant="outline"
        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating explanation...
          </>
        ) : (
          <>
            <Lightbulb className="h-4 w-4 mr-2" />
            Get AI Explanation
          </>
        )}
      </Button>
      
      <div className="mt-2 text-center">
        <Badge variant="secondary" className="text-xs">
          <Brain className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>
    </div>
  );
}
