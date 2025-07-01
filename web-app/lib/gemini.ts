import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  /**
   * Generate practice questions based on user's weak vocabulary/grammar items
   */
  async generatePracticeQuestions(
    items: Array<{
      term: string;
      reading: string;
      meaning_en: string;
      type: 'vocab' | 'grammar';
      difficulty?: 'easy' | 'medium' | 'hard';
    }>,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    const itemsText = items.map(item => `- ${item.term} (${item.reading}): ${item.meaning_en}`).join('\n');

    const prompt = `Generate ${count} JLPT N1 multiple-choice questions (${difficulty} level):

${itemsText}

JSON format:
[{
  "question_text": "Complete: 彼の説明は___だった。",
  "options": ["曖昧", "明確", "具体的", "詳細"],
  "answer_index": 0,
  "explanation": "曖昧 means 'vague', fitting unclear explanations.",
  "difficulty_level": "${difficulty}"
}]

Make sure questions test practical usage and understanding, not just translation.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from AI response');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate practice questions');
    }
  }

  /**
   * Generate explanation for a wrong answer
   */
  async generateExplanation(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    options: string[],
    itemType: 'vocab' | 'grammar'
  ) {
    const prompt = `Briefly explain why "${correctAnswer}" is correct and "${userAnswer}" is wrong for this JLPT ${itemType} question.

Question: ${question}
Your answer: ${userAnswer} ❌
Correct: ${correctAnswer} ✅

Provide a concise explanation in this format:
**Why "${correctAnswer}" is correct:** [1-2 sentences]
**Why "${userAnswer}" is wrong:** [1-2 sentences]
**💡 Memory tip:** [1 short tip]

Keep it under 100 words total. Use simple language and be encouraging.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating explanation:', error);
      throw new Error('Failed to generate explanation');
    }
  }

  /**
   * Analyze user's weakness based on activity log and generate recommendations
   */
  async analyzeWeaknesses(
    activityData: Array<{
      item_type: string;
      correct: boolean;
      item_term: string;
      timestamp: string;
    }>,
    progressData: Array<{
      item_type: string;
      item_term: string;
      correct_count: number;
      incorrect_count: number;
      mastery_level: string;
    }>
  ) {
    const prompt = `Analyze this JLPT student's learning data and provide personalized recommendations.

Recent Activity (last 50 interactions):
${activityData.map(a => `- ${a.item_term} (${a.item_type}): ${a.correct ? 'Correct' : 'Incorrect'} at ${a.timestamp}`).join('\n')}

Overall Progress Summary:
${progressData.map(p => `- ${p.item_term} (${p.item_type}): ${p.correct_count} correct, ${p.incorrect_count} incorrect, level: ${p.mastery_level}`).join('\n')}

Please provide a comprehensive analysis including:

1. **Top 3 Weakness Areas**: Identify the grammar/vocabulary categories where the student struggles most
2. **Learning Patterns**: Identify any patterns in mistakes (e.g., specific grammar types, kanji readings, etc.)
3. **Study Recommendations**: Specific, actionable advice for improvement
4. **Focus Areas**: What should the student prioritize in the next week
5. **Strengths**: What the student is doing well to maintain motivation

Format the response as structured JSON:
{
  "weakness_areas": [
    {
      "category": "Grammar Pattern Recognition",
      "severity": "high",
      "description": "Student struggles with identifying correct grammar patterns in context",
      "examples": ["に関して vs について", "conditional forms"]
    }
  ],
  "learning_patterns": {
    "time_of_day_performance": "Better performance in morning sessions",
    "mistake_types": ["kanji reading confusion", "similar meaning discrimination"],
    "improvement_rate": "steady"
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Focus on grammar pattern drills",
      "specific_steps": ["Practice 10 conditional grammar patterns daily", "Use context-based exercises"],
      "estimated_time": "15-20 minutes daily"
    }
  ],
  "focus_areas": ["grammar patterns", "kanji compounds"],
  "strengths": ["vocabulary retention", "consistent study habits"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from AI response');
      }
    } catch (error) {
      console.error('Error analyzing weaknesses:', error);
      throw new Error('Failed to analyze weaknesses');
    }
  }

  /**
   * Generate daily review suggestions based on spaced repetition and weakness data
   */
  async generateDailyRecommendations(
    dueItems: Array<{ term: string; type: string; last_review: string; difficulty: number }>,
    weakAreas: string[],
    dailyGoal: number = 20
  ) {
    const prompt = `Create a personalized daily study plan for a JLPT student.

Items due for review (${dueItems.length} total):
${dueItems.slice(0, 10).map(item => `- ${item.term} (${item.type}) - last reviewed: ${item.last_review}, difficulty: ${item.difficulty}`).join('\n')}

Known weak areas: ${weakAreas.join(', ')}
Daily goal: ${dailyGoal} items

Generate a JSON response with today's optimal study plan:
{
  "morning_session": {
    "focus": "New difficult items when mind is fresh",
    "items": 8,
    "types": ["grammar", "complex_vocab"]
  },
  "afternoon_session": {
    "focus": "Review and reinforcement",
    "items": 12,
    "types": ["vocab_review", "weak_areas"]
  },
  "priority_items": [
    {
      "term": "item_name",
      "reason": "why this should be prioritized",
      "study_tip": "specific tip for this item"
    }
  ],
  "motivation": "Encouraging message for today"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from AI response');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate daily recommendations');
    }
  }

  /**
   * Generate new study items (flashcards) based on user's current level and preferences
   */
  async generateNewStudyItems(
    userLevel: string,
    category: 'vocab' | 'grammar' | 'mixed',
    count: number = 10,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    focusAreas?: string[]
  ) {
    const focusText = focusAreas?.length ? `Focus: ${focusAreas.join(', ')}` : '';
    
    const prompt = `Generate ${count} JLPT ${userLevel} ${category} items (${difficulty} level). ${focusText}

JSON format:
${category === 'vocab' || category === 'mixed' ? `[{
  "term": "語彙",
  "reading": "ごい", 
  "meaning_en": "vocabulary",
  "example_sentence": "彼の語彙力は素晴らしい。",
  "type": "vocab"
}]` : ''}

${category === 'grammar' || category === 'mixed' ? `[{
  "term": "に関して",
  "reading": "にかんして",
  "meaning_en": "regarding, concerning", 
  "example_sentence": "この問題に関して議論しましょう。",
  "example_translation": "Let's discuss regarding this problem.",
  "grammar_point": "Used to indicate the topic of discussion",
  "type": "grammar"
}` : ''}

Make sure all items are appropriate for ${userLevel} level and practical for daily use.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from AI response');
      }
    } catch (error) {
      console.error('Error generating study items:', error);
      throw new Error('Failed to generate new study items');
    }
  }

  /**
   * Generate contextual study hint for a specific item
   */
  async generateStudyHint(
    term: string,
    reading: string,
    meaning: string,
    itemType: 'vocab' | 'grammar',
    userContext?: {
      mistakes?: string[];
      studyHistory?: Array<{ correct: boolean; timestamp: string }>;
      weakAreas?: string[];
    }
  ) {
    const contextText = userContext ? `
Context: ${userContext.mistakes?.length ? `Struggles with: ${userContext.mistakes.slice(0,2).join(', ')}` : ''}
${userContext.studyHistory?.length ? `Recent: ${userContext.studyHistory.slice(-3).map(h => h.correct ? '✅' : '❌').join('')}` : ''}` : '';

    const prompt = `Quick study hint for: **${term}** (${reading}) - ${meaning}
${contextText}

Give a concise hint in this format:
**🧠 Memory trick:** [1 sentence mnemonic]
**📝 Usage:** [When/how to use - 1 sentence]
**⚠️ Don't confuse with:** [Similar item - 1 sentence]

Keep under 60 words total. Use emojis and markdown formatting.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating study hint:', error);
      throw new Error('Failed to generate study hint');
    }
  }
}

export const geminiService = new GeminiService();
