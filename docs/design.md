## 1. Database Schema

```sql
-- 1. Raw JSON Imports (for audit/troubleshooting)
CREATE TABLE import_batches (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source        text        NOT NULL,                         -- e.g. "gemini:2025-07-01"
  section       text        NOT NULL CHECK(section IN (
                   'kanji','word','phrase','grammar','tips',
                   'vocab_questions','grammar_questions')),
  raw_data      jsonb       NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Core Content Tables

-- Vocabulary, Kanji, Phrases
CREATE TABLE vocabulary_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  term          text        NOT NULL,                         -- Japanese string
  reading       text        NOT NULL,                         -- furigana
  meaning_en    text        NOT NULL,
  meaning_vi    text        NOT NULL,
  example_jp    text        NOT NULL,
  section       text        NOT NULL CHECK(section IN ('kanji','word','phrase')),
  import_batch  uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Grammar Patterns
CREATE TABLE grammar_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern       text        NOT NULL,                         -- e.g. “～か～ないかのうちに”
  description   text        NOT NULL,                         -- English rule
  example       text        NOT NULL,                         -- sentence with “_____”
  import_batch  uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Question Banks

-- Vocab/Kanji/Phrase Questions
CREATE TABLE vocab_questions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_item_id uuid        REFERENCES vocabulary_items(id) ON DELETE CASCADE,
  question_text      text        NOT NULL,
  options            text[]      NOT NULL,                     -- 4 answer strings
  answer_index       int         NOT NULL CHECK(answer_index BETWEEN 0 AND 3),
  explanation        text        NOT NULL,
  import_batch       uuid        REFERENCES import_batches(id),
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
  import_batch       uuid        REFERENCES import_batches(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- 4. User Progress (SM-2 Algorithm + Manual Mastery)
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

-- 5. Section-Specific Tips
CREATE TABLE section_tips (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section       text        NOT NULL CHECK(section IN ('vocabulary','reading','listening')),
  tip_text      text        NOT NULL,
  import_batch  uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. Feature Set & API Endpoints

### 2.1 Import & Content Management

* **POST `/api/import`**
  Accepts `{ section, source, raw_data: [...] }` → writes to `import_batches` → upserts into the matching table (vocabulary\_items, grammar\_items, vocab\_questions, etc.).

* **GET `/api/items?section=<kanji|word|phrase|grammar>&filter=<new|all>&limit=n`**
  Returns raw items (no progress logic).

* **GET `/api/questions?section=<vocab|grammar>&filter=<due|new>&limit=n&user_id=…`**
  Joins `*_questions` ↔ `flashcard_progress` to serve only due or new questions.

### 2.2 Flashcards & Spaced Repetition

* **GET `/api/flashcards?section=<vocab|grammar>&filter=<due|new|mastered>&user_id=…`**
  Returns items plus progress metadata.

* **PATCH `/api/flashcards`**
  Body `{ user_id, item_id, item_type, known: true|false }`
  → updates `interval`, `easiness`, `next_review`, `is_mastered` (if known).

### 2.3 Tips

* **GET `/api/tips?section=<vocabulary|reading|listening>`**
  Returns an array of tip\_text strings.

---

## 3. UI & UX Design

### 3.1 Global Layout

* **Header**: Logo | “JLPT N1 Drill” | User Avatar/Logout
* **Footer**: © Your Name | Version

### 3.2 Home Dashboard

1. **Progress Tiles** (horizontal scroll on mobile):

   * **Vocab Due** – count of due vocab cards
   * **Grammar Due** – count of due grammar cards
   * **New Items** – total new items
2. **Primary Tabs**:

   * **Quiz: Vocab**
   * **Quiz: Grammar**
   * **Flashcards**
   * **Tips**

### 3.3 Quiz Pages

* **Quiz: Vocab** & **Quiz: Grammar** share the same `<QuizList>` component.

  * Pulls `/api/questions`
  * Renders a sequence of `<QuizCard>`:

    * **Front**: `question_text`
    * **Options**: 4 radio buttons
    * **Submit** → shows correct/incorrect highlight + explanation
    * **Next** button to advance
  * At end, show “Back to Dashboard” and performance summary.

### 3.4 Flashcards Page

* `<FlashcardList>` pulls `/api/flashcards?filter=due`
* Each `<Flashcard>`:

  * **Front** (term or pattern)
  * **“Flip”** toggles to **Back** (meaning or fill)
  * Buttons: **✓ Know** | **Again**

    * Calls `/api/flashcards` PATCH to schedule next review.

### 3.5 Tips Page

* Accordion (`<TipsPanel>`) per section: Vocabulary, Reading, Listening.
* Shows a numbered list of tips.

### 3.6 Filtering & Search

* On **Quiz** and **Flashcards** pages, secondary pill menu to switch filter: **All**, **Due**, **New**, **Mastered**.
* Global search bar to find a specific term/pattern across vocab & grammar.

### 3.7 Responsive & Accessibility

* **Desktop**: two-column layout—sidebar for navigation, main panel for content.
* **Mobile**: single column; bottom nav bar replacing sidebar.
* All interactive elements focusable, aria-labels on buttons, contrast ratio ≥ 4.5:1.

---

## 4. Data Flow & Integration

1. **Batch Import**

   * Run AI to produce JSON → POST to `/api/import`
   * Server writes both `import_batches` and upserts content tables.

2. **User Drill**

   * User lands on Home → sees counts → clicks a tab.
   * Next.js fetches via SWR → displays cards or quizzes.

3. **Progress Tracking**

   * Answers trigger PATCH → SM-2 computes next interval and next\_review date.

4. **Review Cycle**

   * As days pass, due items re-appear until user marks as mastered.
