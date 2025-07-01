import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  private chatModel = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    tools: [{
      functionDeclarations: [
        {
          name: 'save_quiz_questions',
          description: 'Save generated quiz questions to the database for future practice',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              questions: {
                type: SchemaType.ARRAY,
                description: 'Array of quiz questions to save',
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    question_text: { type: SchemaType.STRING },
                    options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    answer_index: { type: SchemaType.NUMBER },
                    explanation: { type: SchemaType.STRING },
                    difficulty_level: { type: SchemaType.STRING }
                  }
                }
              }
            },
            required: ['questions']
          }
        },
        {
          name: 'get_user_weak_areas',
          description: 'Get user\'s weak areas and recent mistakes from database',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              limit: { type: SchemaType.NUMBER, description: 'Number of weak areas to retrieve' }
            }
          }
        },
        {
          name: 'save_vocabulary_item',
          description: 'Save new vocabulary item to user\'s personal collection',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              term: { type: SchemaType.STRING, description: 'The vocabulary term' },
              reading: { type: SchemaType.STRING, description: 'The reading/pronunciation' },
              meaning_en: { type: SchemaType.STRING, description: 'English meaning' },
              example_sentence: { type: SchemaType.STRING, description: 'Example sentence' },
              difficulty_level: { type: SchemaType.STRING, description: 'Difficulty level' }
            },
            required: ['term', 'reading', 'meaning_en']
          }
        },
        {
          name: 'get_study_progress',
          description: 'Get current study progress and statistics',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        }
      ]
    }]
  });

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

  /**
   * Personal Assistant Chat - Interactive conversation with function calling
   */
  async chatWithAssistant(
    message: string,
    userContext: {
      currentScores?: { vocabulary_grammar: number; reading: number };
      weakAreas?: string[];
      daysRemaining?: number;
      studyHistory?: Array<{ topic: string; correct: number; total: number; date: string }>;
      chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      userId?: string;
      baseUrl?: string;
    } = {}
  ) {
    const { currentScores, weakAreas, daysRemaining = 4, studyHistory, chatHistory, userId, baseUrl } = userContext;
    
    const systemPrompt = `You are a personalized JLPT N1 study assistant. Your role is to help this student pass the N1 exam in ${daysRemaining} days.

**Student's Current Status:**
- Vocabulary/Grammar: ${currentScores?.vocabulary_grammar || 'Unknown'}/60 (needs 19/60 to pass)
- Reading: ${currentScores?.reading || 'Unknown'}/60 (needs 19/60 to pass)
- Days remaining: ${daysRemaining}
- Known weak areas: ${weakAreas?.join(', ') || 'To be determined'}

**Available Functions:**
You can call these functions to help the student:
- save_quiz_questions: When generating practice questions, ALWAYS offer to save them for later reuse
- get_user_weak_areas: Get detailed analysis of student's weak areas
- save_vocabulary_item: When student encounters new vocabulary, offer to save it
- get_study_progress: Get latest progress statistics

**Your Responsibilities:**
1. 📚 **Study Planning**: Create intensive, focused study plans
2. 🎯 **Targeted Practice**: Generate practice questions (and save them for reuse)
3. 📖 **Reading Strategies**: Improve reading comprehension and speed
4. 💡 **Learning Tips**: Provide memory techniques and shortcuts
5. 📊 **Progress Tracking**: Analyze performance and adjust strategies
6. 🧠 **Mental Preparation**: Boost confidence and exam strategies

**Communication Style:**
- Be encouraging but realistic about the time constraint
- Provide actionable, specific advice
- Use Japanese examples when helpful
- Break down complex concepts simply
- Be available 24/7 for questions and support

**Current Study History:**
${studyHistory?.slice(-5).map(s => `- ${s.topic}: ${s.correct}/${s.total} on ${s.date}`).join('\n') || 'No recent history'}

**Conversation History:**
${chatHistory?.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n') || 'New conversation'}

Remember to use functions when appropriate to help the student save progress and access their data.

Respond naturally and helpfully to the student's message. Always be specific and practical.`;

    const prompt = `${systemPrompt}

Student says: "${message}"

Respond as their personal JLPT N1 assistant:`;

    try {
      const result = await this.chatModel.generateContent(prompt);
      const response = await result.response;
      
      // Handle function calls if present
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0 && userId && baseUrl) {
        for (const functionCall of functionCalls) {
          await this.handleFunctionCall(functionCall, { userId, baseUrl });
        }
      }
      
      return response.text();
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Generate Emergency Study Plan for remaining days
   */
  async generateEmergencyStudyPlan(
    userScores: { vocabulary_grammar: number; reading: number },
    daysRemaining: number,
    availableHoursPerDay: number,
    weakAreas: string[] = []
  ) {
    const prompt = `Create an EMERGENCY STUDY PLAN for JLPT N1 exam in ${daysRemaining} days.

**Current Situation:**
- Vocabulary/Grammar: ${userScores.vocabulary_grammar}/60 (need 19+ to pass, currently ${userScores.vocabulary_grammar < 19 ? 'BELOW' : 'AT/ABOVE'} passing)
- Reading: ${userScores.reading}/60 (need 19+ to pass, currently ${userScores.reading < 19 ? 'BELOW' : 'AT/ABOVE'} passing)
- Study time available: ${availableHoursPerDay} hours/day
- Total study time: ${daysRemaining * availableHoursPerDay} hours
- Weak areas: ${weakAreas.join(', ') || 'General'}

**Requirements:**
1. Must prioritize areas most likely to gain points quickly
2. Include specific daily tasks and time allocation
3. Balance vocabulary/grammar vs reading based on current scores
4. Include rest and review time
5. Provide exam day strategy

Return as structured JSON:
{
  "overall_strategy": "Priority focus explanation",
  "daily_plans": [
    {
      "day": 1,
      "theme": "Day theme",
      "morning_session": {
        "duration": "2 hours",
        "focus": "High-impact vocabulary",
        "specific_tasks": ["Task 1", "Task 2"],
        "target_items": 50
      },
      "afternoon_session": {
        "duration": "2 hours", 
        "focus": "Reading comprehension",
        "specific_tasks": ["Task 1", "Task 2"],
        "target_passages": 3
      },
      "evening_session": {
        "duration": "1 hour",
        "focus": "Review and weak areas",
        "specific_tasks": ["Review mistakes", "Test yourself"]
      },
      "daily_goal": "Specific measurable goal"
    }
  ],
  "exam_day_strategy": {
    "timing": "Section timing recommendations",
    "question_order": "Which questions to tackle first",
    "guessing_strategy": "Smart guessing techniques"
  },
  "emergency_tips": ["Quick wins tip 1", "Quick wins tip 2"],
  "motivation": "Encouraging message"
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
      console.error('Error generating emergency study plan:', error);
      throw new Error('Failed to generate emergency study plan');
    }
  }

  /**
   * Analyze reading passage and generate targeted questions
   */
  async generateReadingPractice(
    passage: string,
    difficulty: 'N1',
    questionCount: number = 5
  ) {
    const prompt = `Create ${questionCount} JLPT N1 level reading comprehension questions for this passage:

"${passage}"

Generate questions that test:
1. Main idea comprehension
2. Detail understanding  
3. Inference and implication
4. Vocabulary in context
5. Author's intent/opinion

Return as JSON:
{
  "passage_analysis": {
    "main_topic": "Brief description",
    "difficulty_level": "Assessment of difficulty",
    "key_vocabulary": ["word1", "word2", "word3"],
    "grammar_patterns": ["pattern1", "pattern2"]
  },
  "questions": [
    {
      "question_text": "Question in Japanese",
      "question_type": "main_idea|detail|inference|vocabulary",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer_index": 0,
      "explanation": "Why this answer is correct",
      "reading_strategy": "How to approach this type of question"
    }
  ],
  "reading_tips": ["Tip for this passage type"],
  "time_target": "Recommended time to solve"
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
      console.error('Error generating reading practice:', error);
      throw new Error('Failed to generate reading practice');
    }
  }

  /**
   * Generate intensive review session for weak areas
   */
  async generateIntensiveReview(
    weakItems: Array<{
      term: string;
      reading: string;
      meaning: string;
      type: 'vocab' | 'grammar';
      mistakeCount: number;
    }>,
    sessionLength: number = 30 // minutes
  ) {
    const prompt = `Create an INTENSIVE REVIEW SESSION (${sessionLength} minutes) for these problematic items:

${weakItems.map(item => `- ${item.term} (${item.reading}): ${item.meaning} [${item.type}, ${item.mistakeCount} mistakes]`).join('\n')}

Create a structured review session with:
1. Memory techniques for each item
2. Practice exercises
3. Common mistake patterns
4. Quick test at the end

Return as JSON:
{
  "session_overview": {
    "total_time": "${sessionLength} minutes",
    "items_covered": ${weakItems.length},
    "focus_strategy": "How to approach these items"
  },
  "memory_techniques": [
    {
      "item": "term",
      "technique": "Specific memory trick",
      "association": "What to associate it with",
      "example": "Usage example"
    }
  ],
  "practice_exercises": [
    {
      "exercise_type": "fill_in_blank|multiple_choice|sentence_creation",
      "instruction": "What to do",
      "items": ["Exercise items"],
      "time_limit": "2 minutes"
    }
  ],
  "quick_test": {
    "questions": [
      {
        "prompt": "Test question",
        "answer": "Correct answer",
        "alternatives": ["Wrong option 1", "Wrong option 2"]
      }
    ]
  },
  "success_tips": ["Tip 1", "Tip 2"]
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
      console.error('Error generating intensive review:', error);
      throw new Error('Failed to generate intensive review');
    }
  }

  /**
   * Enhanced chat with streaming support and function calling
   */
  async chatWithAssistantStream(
    message: string,
    userContext: {
      currentScores?: { vocabulary_grammar: number; reading: number };
      weakAreas?: string[];
      daysRemaining?: number;
      studyHistory?: Array<{ topic: string; correct: number; total: number; date: string }>;
      chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      userId?: string;
      baseUrl?: string;
    }
  ) {
    const { currentScores, weakAreas, daysRemaining = 4, studyHistory, chatHistory } = userContext;
    
    const systemPrompt = `You are a personalized JLPT N1 study assistant. Your role is to help this student pass the N1 exam in ${daysRemaining} days.

**Student's Current Status:**
- Vocabulary/Grammar: ${currentScores?.vocabulary_grammar || 'Unknown'}/60 (needs 19/60 to pass)
- Reading: ${currentScores?.reading || 'Unknown'}/60 (needs 19/60 to pass)
- Days remaining: ${daysRemaining}
- Known weak areas: ${weakAreas?.join(', ') || 'To be determined'}

**Available Functions:**
You can call these functions to help the student:
- save_quiz_questions: When generating practice questions, ALWAYS offer to save them for later reuse
- get_user_weak_areas: Get detailed analysis of student's weak areas
- save_vocabulary_item: When student encounters new vocabulary, offer to save it
- get_study_progress: Get latest progress statistics

**Your Responsibilities:**
1. 📚 **Study Planning**: Create intensive, focused study plans
2. 🎯 **Targeted Practice**: Generate practice questions (mention they can be saved for reuse)
3. 📖 **Reading Strategies**: Improve reading comprehension and speed
4. 💡 **Learning Tips**: Provide memory techniques and shortcuts
5. 📊 **Progress Tracking**: Analyze performance and adjust strategies
6. 🧠 **Mental Preparation**: Boost confidence and exam strategies

**Important Guidelines:**
- When creating quiz questions, mention they can be saved to database for future practice
- When student mentions new vocabulary, offer to help them save it to their collection
- Be encouraging but realistic about the time constraint
- Provide actionable, specific advice
- Use Japanese examples when helpful

**Current Study History:**
${studyHistory?.slice(-5).map(s => `- ${s.topic}: ${s.correct}/${s.total} on ${s.date}`).join('\n') || 'No recent history'}

**Conversation History:**
${chatHistory?.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n') || 'New conversation'}

Student says: "${message}"

Respond as their personal JLPT N1 assistant:`;

    try {
      const result = await this.chatModel.generateContentStream(systemPrompt);
      return result;
    } catch (error) {
      console.error('Error in AI chat stream:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Handle function calls from Gemini
   */
  async handleFunctionCall(functionCall: { name: string; args: Record<string, any> }, userContext: { userId: string; baseUrl: string }) {
    const { name, args } = functionCall;
    const { userId, baseUrl } = userContext;

    try {
      switch (name) {
        case 'save_quiz_questions':
          const response = await fetch(`${baseUrl}/api/ai-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questions: args.questions,
              user_id: userId,
              source: 'ai_chat_generated'
            })
          });
          return await response.json();

        case 'get_user_weak_areas':
          const weakResponse = await fetch(`${baseUrl}/api/weakness-analysis?limit=${args.limit || 10}`);
          return await weakResponse.json();

        case 'save_vocabulary_item':
          const vocabResponse = await fetch(`${baseUrl}/api/user-vocabulary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...args,
              user_id: userId,
              source: 'ai_chat'
            })
          });
          return await vocabResponse.json();

        case 'get_study_progress':
          const progressResponse = await fetch(`${baseUrl}/api/dashboard-stats`);
          return await progressResponse.json();

        default:
          throw new Error(`Unknown function: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { error: `Failed to execute ${name}` };
    }
  }
}

export const geminiService = new GeminiService();
