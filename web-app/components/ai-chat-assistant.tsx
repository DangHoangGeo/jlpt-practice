"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Clock, 
  Target, 
  TrendingUp,
  MessageCircle,
  RefreshCw,
  Lightbulb
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai-chat?session_id=${sessionId}&limit=10`);
      if (response.ok) {
        const data: { chat_history: Array<{ user_message: string; ai_response: string; timestamp: string }> } = await response.json();
        if (data.chat_history.length > 0) {
          const historyMessages: ChatMessage[] = data.chat_history.reverse().map((item, index) => [
            {
              id: `history_user_${index}`,
              role: 'user' as const,
              content: item.user_message,
              timestamp: item.timestamp
            },
            {
              id: `history_ai_${index}`,
              role: 'assistant' as const,
              content: item.ai_response,
              timestamp: item.timestamp
            }
          ]).flat();
          
          setMessages(prev => [...prev, ...historyMessages]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    // Initial greeting message
    const initialMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your personal JLPT N1 assistant. I see you have only 4 days left and need to improve significantly:

📊 **Current Status:**
- Vocabulary/Grammar: 17/60 (need 19+ to pass)
- Reading: 21/60 (need 19+ to pass)

🎯 **I can help you:**
- Create an emergency study plan
- Generate targeted practice questions
- Analyze your mistakes and weak areas  
- Provide reading strategies
- Answer any JLPT questions
- Keep you motivated and focused

**What would you like to start with?** You can ask me things like:
- "Create my emergency study plan"
- "Help me with grammar pattern recognition"
- "Generate reading practice"
- "What should I focus on today?"

Let's make these 4 days count! 💪`,
      timestamp: new Date().toISOString()
    };
    setMessages([initialMessage]);
    
    // Load chat history
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create placeholder for streaming response
    const assistantMessageId = `assistant_${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai-chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chat_history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          session_id: sessionId
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  // Update the message in real-time
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ));
                }
                if (data.done) {
                  break;
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      } else {
        // Fallback to regular API if streaming fails
        const fallbackResponse = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            chat_history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            session_id: sessionId
          })
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: data.response }
              : msg
          ));
        } else {
          throw new Error('Failed to get AI response');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = '❌ Sorry, I encountered an error. Please try again or check your connection.';
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: errorMessage }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmergencyPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/emergency-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vocabulary_grammar_score: 17,
          reading_score: 21,
          days_remaining: 4,
          hours_per_day: 8
        })
      });

      if (response.ok) {
        const data: { study_plan: { 
          overall_strategy: string; 
          daily_plans: Array<{ day: number; theme: string; morning_session: { duration: string; focus: string }; afternoon_session: { duration: string; focus: string }; evening_session: { duration: string; focus: string }; daily_goal: string }>;
          emergency_tips: string[];
          motivation: string;
        } } = await response.json();
        
        // Add plan to chat
        const planMessage: ChatMessage = {
          id: `plan_${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Emergency Study Plan Generated!**

**Strategy:** ${data.study_plan.overall_strategy}

**Your 4-Day Plan:**
${data.study_plan.daily_plans.map((day) => `
**Day ${day.day}: ${day.theme}**
- Morning (${day.morning_session.duration}): ${day.morning_session.focus}
- Afternoon (${day.afternoon_session.duration}): ${day.afternoon_session.focus}  
- Evening (${day.evening_session.duration}): ${day.evening_session.focus}
- Goal: ${day.daily_goal}
`).join('\n')}

**Emergency Tips:**
${data.study_plan.emergency_tips.map((tip) => `• ${tip}`).join('\n')}

**Motivation:** ${data.study_plan.motivation}

Would you like me to help you with any specific part of this plan?`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, planMessage]);
      } else {
        throw new Error('Failed to generate study plan');
      }
    } catch (error) {
      console.error('Error generating study plan:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[600px] grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              JLPT N1 Personal Assistant
              <Badge variant="outline" className="ml-auto">
                <Clock className="h-3 w-3 mr-1" />
                4 days left
              </Badge>
            </CardTitle>
            <CardDescription>
              Your AI tutor for intensive N1 preparation. Ask questions, get study plans, practice together!
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 max-h-[600px] flex flex-col p-0 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="flex-shrink-0 border-t bg-background px-6 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about JLPT N1 preparation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={generateEmergencyPlan}
              disabled={isGeneratingPlan}
              className="w-full"
              variant="default"
            >
              {isGeneratingPlan ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Emergency Study Plan
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => setInput("Generate 5 vocabulary questions for my weak areas")}
              className="w-full"
              variant="outline"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Vocab Practice
            </Button>
            
            <Button 
              onClick={() => setInput("Help me with reading comprehension strategies")}
              className="w-full"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Reading Help
            </Button>
            
            <Button 
              onClick={() => setInput("What should I focus on today?")}
              className="w-full"
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Today&apos;s Focus
            </Button>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vocabulary/Grammar</span>
                <span>17/60</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${(17/60)*100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need 19+ to pass</p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Reading</span>
                <span>21/60</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(21/60)*100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need 19+ to pass</p>
            </div>
            
            <Separator />
            
            <div className="text-center">
              <Badge variant="destructive" className="text-lg px-3 py-1">
                <Clock className="h-4 w-4 mr-1" />
                4 Days Left
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
