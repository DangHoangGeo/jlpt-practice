"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Headphones, Eye } from "lucide-react";

interface Tip {
  id: string;
  section: string;
  tip_text: string;
  created_at: string;
}

interface TipsSectionProps {
  section: "vocabulary" | "reading" | "listening";
  icon: React.ReactNode;
  title: string;
  description: string;
}

function TipsSection({ section, icon, title, description }: TipsSectionProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTips = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tips?section=${section}`);
      const data = await response.json();
      setTips(data.tips || []);
    } catch (error) {
      console.error(`Failed to fetch ${section} tips:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [section]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="outline">{tips.length} tips</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm">Loading tips...</span>
          </div>
        ) : tips.length > 0 ? (
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div key={tip.id} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tip.tip_text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No tips available for this section yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TipsPanel() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="multiple" defaultValue={["vocabulary", "reading", "listening"]}>
        <AccordionItem value="vocabulary">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Vocabulary Tips
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TipsSection
              section="vocabulary"
              icon={<BookOpen className="h-4 w-4" />}
              title="Vocabulary Mastery"
              description="Effective strategies for learning and retaining Japanese vocabulary"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reading">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Reading Tips
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TipsSection
              section="reading"
              icon={<Eye className="h-4 w-4" />}
              title="Reading Comprehension"
              description="Techniques for improving reading speed and comprehension"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="listening">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Listening Tips
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <TipsSection
              section="listening"
              icon={<Headphones className="h-4 w-4" />}
              title="Listening Skills"
              description="Methods to enhance listening comprehension and audio processing"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
