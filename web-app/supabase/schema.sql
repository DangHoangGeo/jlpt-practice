-- JLPT Practice App Database Schema
-- Based on design.md specification

-- Core Content Tables

-- Vocabulary, Kanji, Phrases
CREATE TABLE vocabulary_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  term          text        NOT NULL,                         -- Japanese string
  reading       text        NOT NULL,                         -- furigana
  meaning_en    text        NOT NULL,
  meaning_vi    text        NOT NULL,
  example_jp    text        NOT NULL,
  section       text        NOT NULL CHECK(section IN ('kanji','word','phrase')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Grammar Patterns
CREATE TABLE grammar_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern       text        NOT NULL,                         -- e.g. "～か～ないかのうちに"
  description   text        NOT NULL,                         -- English rule
  example       text        NOT NULL,                         -- sentence with "_____"
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Question Banks

-- Vocab/Kanji/Phrase Questions
CREATE TABLE vocab_questions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_item_id uuid        REFERENCES vocabulary_items(id) ON DELETE CASCADE,
  question_text      text        NOT NULL,
  options            text[]      NOT NULL,                     -- 4 answer strings
  answer_index       int         NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation        text        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Grammar Fill-in-the-Blank Questions
CREATE TABLE grammar_questions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  grammar_item_id    uuid        REFERENCES grammar_items(id) ON DELETE CASCADE,
  question_text      text        NOT NULL,
  options            text[]      NOT NULL,
  answer_index       int         NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation        text        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- User Progress (SM-2 Algorithm + Manual Mastery)
CREATE TABLE flashcard_progress (
  user_id       uuid        REFERENCES auth.users(id),
  item_id       uuid        NOT NULL,                          -- refers to vocab_items or grammar_items
  item_type     text        NOT NULL CHECK(item_type IN ('vocab','grammar')),
  interval      int         NOT NULL DEFAULT 1,                -- days until next review
  next_review   date        NOT NULL,
  easiness      float       NOT NULL DEFAULT 2.5,
  is_mastered   boolean     NOT NULL DEFAULT false,            -- manually retired
  PRIMARY KEY (user_id, item_id, item_type)
);

-- Section-Specific Tips
CREATE TABLE section_tips (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section       text        NOT NULL CHECK(section IN ('vocabulary','reading','listening')),
  tip_text      text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_vocabulary_items_section ON vocabulary_items(section);
CREATE INDEX idx_vocabulary_items_term ON vocabulary_items(term);
CREATE INDEX idx_grammar_items_pattern ON grammar_items(pattern);
CREATE INDEX idx_flashcard_progress_user_review ON flashcard_progress(user_id, next_review);
CREATE INDEX idx_flashcard_progress_user_type ON flashcard_progress(user_id, item_type);
CREATE INDEX idx_section_tips_section ON section_tips(section);

-- Row Level Security (RLS) policies
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own progress
CREATE POLICY "Users can view own flashcard progress" 
  ON flashcard_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard progress" 
  ON flashcard_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress" 
  ON flashcard_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable RLS on other tables (read-only for authenticated users)
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_tips ENABLE ROW LEVEL SECURITY;

-- Policies for read access to content tables
CREATE POLICY "Authenticated users can view vocabulary items" 
  ON vocabulary_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view grammar items" 
  ON grammar_items FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view vocab questions" 
  ON vocab_questions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view grammar questions" 
  ON grammar_questions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view section tips" 
  ON section_tips FOR SELECT 
  USING (auth.role() = 'authenticated');
