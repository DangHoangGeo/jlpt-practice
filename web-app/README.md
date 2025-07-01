# JLPT N1 Practice App

A modern web application for JLPT N1 preparation featuring spaced repetition flashcards, interactive quizzes, and personalized study tracking.

## 🚀 Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up database schema:**
   - Go to your Supabase project's SQL Editor
   - Run the SQL from `supabase/schema.sql`

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Seed database with sample data:**
   ```bash
   npm run seed
   ```

6. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000)

## 📚 Features

### Core Study Features
- **📖 Vocabulary Quizzes** - Multiple choice questions with detailed explanations
- **📝 Grammar Quizzes** - Fill-in-the-blank pattern practice
- **🧠 Flashcards** - Spaced repetition using the SM-2 algorithm
- **💡 Study Tips** - Expert advice organized by skill area
- **📊 Progress Tracking** - Visual dashboard with due card counts

### Technical Features
- **🔐 Authentication** - Secure user accounts with Supabase Auth
- **💾 Real-time Sync** - Progress saved instantly to the cloud
- **📱 Responsive Design** - Works perfectly on mobile and desktop
- **⚡ Fast Performance** - Built with Next.js App Router
- **🎨 Modern UI** - Beautiful interface with shadcn/ui components

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **UI Components:** shadcn/ui, Radix UI
- **Styling:** Tailwind CSS

### Database Design
```sql
-- Core content tables
vocabulary_items    # Japanese words, kanji, phrases
grammar_items      # Grammar patterns and examples
vocab_questions    # Multiple choice questions for vocabulary
grammar_questions  # Fill-in-the-blank questions for grammar
section_tips      # Study tips by category

-- User progress tracking
flashcard_progress # SM-2 algorithm state per user/item
import_batches    # Audit trail for data imports
```

### API Endpoints
```
GET  /api/items      # Fetch vocabulary/grammar items
GET  /api/questions  # Get quiz questions (filtered by progress)
GET  /api/flashcards # Get flashcards due for review
PATCH /api/flashcards # Update review progress (SM-2)
GET  /api/tips       # Get study tips by section
POST /api/import     # Batch import content data
```

## 📖 Usage Guide

### For Students

1. **Daily Practice Flow:**
   - Check dashboard for due reviews
   - Complete vocabulary/grammar quizzes
   - Review flashcards using spaced repetition
   - Read study tips for exam strategies

2. **Progress Tracking:**
   - Cards automatically scheduled based on performance
   - Mastered items hidden from daily reviews
   - Progress metrics visible on dashboard

### For Content Creators

1. **Adding Content:**
   ```javascript
   // Import vocabulary
   fetch('/api/import', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       section: 'word',
       source: 'your-source-name',
       raw_data: [
         {
           term: "語彙",
           reading: "ごい",
           meaning_en: "vocabulary",
           meaning_vi: "từ vựng",
           example_jp: "新しい語彙を覚える。"
         }
       ]
     })
   })
   ```

2. **Content Types:**
   - `kanji`, `word`, `phrase` - Vocabulary items
   - `grammar` - Grammar patterns
   - `vocab_questions`, `grammar_questions` - Quiz questions
   - `tips` - Study advice

## 🧮 Spaced Repetition Algorithm

The app uses the **SuperMemo-2 (SM-2)** algorithm for optimal review scheduling:

```javascript
// Simplified algorithm
function calculateNextReview(quality, interval, easiness) {
  // quality: 1-5 (1 = hard, 5 = easy)
  // interval: days until next review
  // easiness: difficulty factor (1.3-2.5)
  
  if (quality < 3) {
    return { interval: 1, easiness } // Reset interval
  }
  
  const newInterval = interval === 1 ? 6 : Math.round(interval * easiness)
  const newEasiness = Math.max(1.3, easiness + (0.1 - (5-quality) * (0.08 + (5-quality) * 0.02)))
  
  return { interval: newInterval, easiness: newEasiness }
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🛠️ Development

### Project Structure
```
app/
├── api/              # REST API endpoints
├── auth/             # Authentication pages
├── quiz/             # Quiz pages
├── flashcards/       # Flashcard review
├── tips/             # Study tips
└── page.tsx          # Dashboard

components/
├── quiz-card.tsx     # Interactive quiz component
├── flashcard-list.tsx # Spaced repetition UI
├── tips-panel.tsx    # Study tips display
└── ui/               # Reusable components

lib/
└── supabase/         # Database configuration
```

### Adding New Features

1. **New Question Types:**
   - Add to database schema
   - Create API endpoint
   - Build UI component

2. **Additional Metrics:**
   - Extend flashcard_progress table
   - Update SM-2 calculation
   - Add dashboard widgets

### Testing

```bash
npm run build    # Test production build
npm run lint     # Check code quality
npm run dev      # Start development server
```

## 📈 Performance

- **First Load:** ~105kb JavaScript
- **Build Time:** ~3 seconds
- **Page Speed:** 95+ Lighthouse score
- **Database:** Optimized with indexes and RLS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **JLPT Official** - For examination standards
- **Supabase** - For backend infrastructure
- **Next.js Team** - For the excellent framework
- **Vercel** - For hosting platform
- **shadcn** - For beautiful UI components

---

**Happy studying! 頑張って！** 🎌
