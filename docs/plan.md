## 1. Tech Stack

* **Frontend**

  * **Framework:** Next.js (app-router)
  * **Language:** TypeScript
  * **UI:** shadcn/ui + Tailwind CSS + lucide-react icons
  * **Data-Fetching:** SWR or React Query
  * **Audio:** HTML5 `<audio>` or [howler.js](https://howlerjs.com)

* **Backend & Auth**

  * **Database:** Supabase (Postgres + Auth + Storage)
  * **Serverless API:** Next.js API routes (REST)
  * **Scheduling:** SM-2 algorithm in Node

* **AI Integration**

  * **LLM Provider:** OpenAI (GPT-4/GPT-4o) or Google Gemini
  * **Prompt Orchestration:** Separate prompt templates for import & generation
  * **Batch Imports:** `/api/import` endpoint

* **Hosting & DevOps**

  * **Hosting:** Vercel (Next.js) + Supabase (managed)
  * **CI/CD:** GitHub Actions → run lint/test/build → auto-deploy
  * **Monitoring:** Sentry (errors) + Vercel Analytics

* **Testing**

  * **Unit:** Jest + React Testing Library
  * **E2E:** Cypress or Playwright

---

## 2. High-Velocity Development Plan

| Phase | Duration      | Owner      | Deliverable                             |
| ----- | ------------- | ---------- | --------------------------------------- |
| 1     | Day 1 (4 h)   | AI agent   | Repo scaffold, Supabase schema deployed |
| 2     | Day 1–2 (8 h) | AI agent   | API routes for import + CRUD            |
| 3     | Day 2 (6 h)   | AI agent   | Frontend pages skeleton + routing       |
| 4     | Day 3 (6 h)   | AI agent   | Quiz & Flashcard components             |
| 5     | Day 3–4 (8 h) | AI agent   | AI-import integration & batch seeding   |
| 6     | Day 4 (6 h)   | AI agent   | Tips panel + filter controls            |
| 7     | Day 5 (8 h)   | AI agent   | Testing, CI/CD, performance tuning      |
| 8     | Day 5 (4 h)   | Human lead | Final review, UX polish, deploy to prod |

---

### Phase 1: Project Kick-off & Schema

1. **Initialize repo** (`create-next-app`, TS, Tailwind, shadcn/ui)
2. **Configure Supabase** project → copy credentials to `.env`
3. **Deploy database schema** (run the SQL from earlier spec)
4. **Set up GitHub Actions**: lint (ESLint), type-check, format (Prettier)

---

### Phase 2: Core API Endpoints

1. **`POST /api/import`**

   * Write to `import_batches`
   * Upsert into `vocabulary_items`, `grammar_items`, `vocab_questions`, `grammar_questions`, `section_tips`
2. **`GET /api/items`**

   * Params: `section`, `filter=new|all`, `limit`
3. **`GET /api/questions`**

   * Params: `section=vocab|grammar`, `filter=due|new`, `user_id`, `limit`
4. **Flashcard CRUD** (`/api/flashcards`)

   * GET (due/new/mastered)
   * PATCH (update SM-2 fields & `is_mastered`)

---

### Phase 3: Frontend Routing & Layout

1. **Global layout**: header (logo, nav tabs), footer
2. **Pages**:

   * `/` → Dashboard
   * `/quiz/vocab` & `/quiz/grammar`
   * `/flashcards`
   * `/tips`
3. **SWR hooks** for data fetching

---

### Phase 4: Core Components

1. **`<QuizCard>`**

   * Props: `question_text`, `options[]`, `onAnswer(idx)`
   * UI: question → 4 buttons → feedback + “Next”
2. **`<Flashcard>`**

   * Props: `front`, `back`, `onReview({ known: boolean })`
   * UI: flip animation, ✓Know / Again
3. **`<TipsPanel>`**

   * Accordion per section → numbered tips

---

### Phase 5: AI Import & Batch Seeding

1. **Define prompt templates** (reuse earlier)
2. **Write import script** (or UI) to upload JSON payloads → `/api/import`
3. **Seed** each table with one batch of 50 vocab, 30 grammar, 20 questions each, 10 tips

---

### Phase 6: Filtering, Search & Personalization

1. **Dashboard widgets**: count of due/new items via `/api/flashcards` & `/api/questions`
2. **Filters** on each page: All | Due | New | Mastered
3. **Global search** component: fuzzy search across term/pattern

---

### Phase 7: Testing & CI/CD

1. **Unit tests**:

   * SM-2 algorithm edge cases
   * API route handlers
   * Core components render + state changes
2. **E2E**:

   * Quiz flow
   * Flashcard flow
   * Import→Review cycle
3. **GitHub Actions**: run on PR → deploy preview on merge to `main`

---

### Phase 8: Final Review & Launch

1. **UX walkthrough**: mobile + desktop
2. **Performance audit**: Lighthouse → optimize images, code-splitting
3. **Monitoring hooks**: Sentry DSN, Vercel analytics
4. **Deploy** to production, share staging URL for stakeholder sign-off
