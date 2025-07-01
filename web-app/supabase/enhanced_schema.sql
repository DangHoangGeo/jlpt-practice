-- Enhanced Database Schema for AI-Powered JLPT Learning
-- This extends the existing schema with new tables for activity logging and AI features

-- User Progress Tracking (enhanced version of existing flashcard_progress)
CREATE TABLE user_progress (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id           uuid        NOT NULL,                          -- refers to vocab_items or grammar_items
  item_type         text        NOT NULL CHECK(item_type IN ('vocab','grammar')),
  correct_count     int         NOT NULL DEFAULT 0,               -- total correct answers
  incorrect_count   int         NOT NULL DEFAULT 0,               -- total incorrect answers
  last_reviewed_at  timestamptz DEFAULT now(),
  next_review_at    timestamptz DEFAULT now(),
  mastery_level     text        NOT NULL DEFAULT 'new' CHECK(mastery_level IN ('new','learning','review','mastered')),
  difficulty_rating float       DEFAULT 0.5,                      -- AI-calculated difficulty (0-1)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  
  -- SM-2 Algorithm fields (migrated from flashcard_progress)
  interval          int         NOT NULL DEFAULT 1,
  easiness          float       NOT NULL DEFAULT 2.5,
  is_mastered       boolean     NOT NULL DEFAULT false,
  
  UNIQUE(user_id, item_id, item_type)
);

-- Comprehensive Activity Logging
CREATE TABLE activity_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type     text        NOT NULL,                         -- 'quiz_answer', 'flashcard_review', 'add_vocab', 'add_grammar', 'ai_explanation_request'
  item_id           uuid,                                         -- related item (nullable for general activities)
  item_type         text        CHECK(item_type IN ('vocab','grammar')),
  details           jsonb       NOT NULL DEFAULT '{}',            -- flexible data storage (question, answer, correctness, etc.)
  session_id        text,                                         -- group related activities
  timestamp         timestamptz NOT NULL DEFAULT now(),
  
  -- Performance metrics
  response_time_ms  int,                                          -- how long user took to answer
  confidence_level  int         CHECK(confidence_level BETWEEN 1 AND 5)  -- user's self-reported confidence
);

-- User-Generated Content: Custom Vocabulary
CREATE TABLE user_vocabulary (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  term              text        NOT NULL,
  reading           text        NOT NULL,
  meaning_en        text        NOT NULL,
  meaning_vi        text,
  example_jp        text        NOT NULL,
  example_en        text,
  example_vi        text,
  tags              text[],                                       -- user-defined tags
  source            text,                                         -- where user found this word
  is_public         boolean     NOT NULL DEFAULT false,          -- allow sharing with other users
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- User-Generated Content: Custom Grammar
CREATE TABLE user_grammar (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern           text        NOT NULL,
  reading           text        NOT NULL,
  meaning_en        text        NOT NULL,
  meaning_vi        text,
  example_jp        text        NOT NULL,
  example_en        text,
  example_vi        text,
  usage_notes       text,
  tags              text[],
  difficulty_level  text        CHECK(difficulty_level IN ('beginner','intermediate','advanced')),
  is_public         boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- AI-Generated Practice Questions
CREATE TABLE ai_generated_questions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id           uuid        NOT NULL,
  item_type         text        NOT NULL CHECK(item_type IN ('vocab','grammar')),
  question_text     text        NOT NULL,
  options           text[]      NOT NULL,
  answer_index      int         NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation       text        NOT NULL,
  difficulty_level  text        NOT NULL CHECK(difficulty_level IN ('easy','medium','hard')),
  ai_model          text        NOT NULL DEFAULT 'gemini-1.5-pro',
  generation_prompt text        NOT NULL,                         -- the prompt used to generate this
  created_at        timestamptz NOT NULL DEFAULT now(),
  used_count        int         NOT NULL DEFAULT 0,               -- how many times this question was used
  avg_correctness   float       DEFAULT 0.5                      -- average correctness rate
);

-- Weakness Analysis Reports (AI-generated insights)
CREATE TABLE weakness_reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type       text        NOT NULL CHECK(report_type IN ('weekly','monthly','on_demand')),
  analysis_data     jsonb       NOT NULL,                         -- structured analysis from AI
  recommendations   jsonb       NOT NULL,                         -- AI-generated study recommendations
  focus_areas       text[],                                       -- areas user should focus on
  generated_by      text        NOT NULL DEFAULT 'gemini-1.5-pro',
  created_at        timestamptz NOT NULL DEFAULT now(),
  is_read           boolean     NOT NULL DEFAULT false
);

-- Study Sessions (group related activities)
CREATE TABLE study_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type      text        NOT NULL CHECK(session_type IN ('quiz','flashcard','mixed','ai_generated')),
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  total_items       int         DEFAULT 0,
  correct_items     int         DEFAULT 0,
  total_time_ms     bigint      DEFAULT 0,
  focus_areas       text[],                                       -- what the session focused on
  performance_score float       DEFAULT 0                        -- AI-calculated performance score
);

-- User Preferences and Learning Goals
CREATE TABLE user_preferences (
  user_id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal        int         NOT NULL DEFAULT 20,              -- items per day
  preferred_language text       NOT NULL DEFAULT 'en' CHECK(preferred_language IN ('en','vi')),
  difficulty_preference text    NOT NULL DEFAULT 'adaptive' CHECK(difficulty_preference IN ('easy','medium','hard','adaptive')),
  study_reminders   boolean     NOT NULL DEFAULT true,
  ai_explanations   boolean     NOT NULL DEFAULT true,
  target_exam_date  date,
  jlpt_level        text        CHECK(jlpt_level IN ('N5','N4','N3','N2','N1')),
  learning_style    text        CHECK(learning_style IN ('visual','auditory','reading','kinesthetic')),
  focus_areas       text[]      DEFAULT ARRAY['vocabulary','grammar'],
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_mastery ON user_progress(user_id, mastery_level);
CREATE INDEX idx_user_progress_next_review ON user_progress(user_id, next_review_at);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(user_id, timestamp);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_user_vocabulary_user_id ON user_vocabulary(user_id);
CREATE INDEX idx_user_grammar_user_id ON user_grammar(user_id);
CREATE INDEX idx_ai_questions_user_item ON ai_generated_questions(user_id, item_id, item_type);
CREATE INDEX idx_weakness_reports_user ON weakness_reports(user_id, created_at);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id, started_at);

-- Row Level Security policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weakness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activity log" ON activity_log
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own vocabulary" ON user_vocabulary
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public vocabulary" ON user_vocabulary
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own grammar" ON user_grammar
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public grammar" ON user_grammar
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own AI questions" ON ai_generated_questions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weakness reports" ON weakness_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own study sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vocabulary_updated_at BEFORE UPDATE ON user_vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_grammar_updated_at BEFORE UPDATE ON user_grammar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
