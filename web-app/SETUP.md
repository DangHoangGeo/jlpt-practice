# JLPT N1 Practice App Setup Guide

This guide will help you set up and run the JLPT N1 Practice App with spaced repetition flashcards and interactive quizzes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient)
- Git

## Setup Instructions

### 1. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Create a new Supabase project at [https://supabase.com](https://supabase.com)

3. Get your project credentials from Project Settings > API:
   - Project URL
   - Anon public key

4. Update `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Database Setup

1. In your Supabase dashboard, go to SQL Editor
2. Copy and run the SQL from `supabase/schema.sql` to create all necessary tables
3. The schema includes:
   - Content tables (vocabulary_items, grammar_items)
   - Question banks (vocab_questions, grammar_questions)
   - User progress tracking with SM-2 algorithm
   - Study tips section
   - Row Level Security (RLS) policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features Implemented

### ✅ Core Features
- **User Authentication** - Supabase Auth with email/password
- **Dashboard** - Progress overview with due cards count
- **Vocabulary Quiz** - Multiple choice questions with explanations
- **Grammar Quiz** - Fill-in-the-blank pattern practice
- **Flashcards** - Spaced repetition using SM-2 algorithm
- **Study Tips** - Organized by section (vocabulary, reading, listening)

### ✅ Technical Features
- **Database Schema** - Complete with RLS policies
- **API Endpoints** - RESTful API for all operations
- **Type Safety** - Full TypeScript implementation
- **Responsive Design** - Mobile-friendly with Tailwind CSS
- **Modern UI** - shadcn/ui components

### ✅ Data Management
- **Import System** - Batch import API for content
- **Progress Tracking** - SM-2 spaced repetition algorithm
- **Performance Metrics** - User progress analytics

## Usage

### First Time Setup

1. **Sign up** for an account
2. **Import sample data** (see Data Import section below)
3. **Start practicing** with quizzes and flashcards

### Daily Practice Flow

1. **Check Dashboard** - See how many cards are due for review
2. **Take Quizzes** - Practice with vocab or grammar questions
3. **Review Flashcards** - Use spaced repetition for long-term retention
4. **Read Tips** - Get expert advice for JLPT preparation

## Data Import

### Sample Data

To populate the app with sample content for testing:

```javascript
// Run this in the browser console after logging in
fetch('/api/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    section: 'word',
    source: 'manual-test',
    raw_data: [
      {
        term: "幸福",
        reading: "こうふく", 
        meaning_en: "happiness, good fortune",
        meaning_vi: "hạnh phúc",
        example_jp: "家族と過ごす時間が私の幸福です。"
      }
    ]
  })
})
```

### Batch Import

The app supports importing data in batches for:
- **Vocabulary** (kanji, word, phrase)
- **Grammar** patterns
- **Questions** (vocab_questions, grammar_questions)
- **Tips** (vocabulary, reading, listening)

## Project Structure

```
app/
├── api/           # REST API endpoints
├── auth/          # Authentication pages
├── quiz/          # Quiz pages (vocab/grammar)
├── flashcards/    # Spaced repetition flashcards
└── tips/          # Study tips

components/
├── quiz-card.tsx      # Interactive quiz component
├── flashcard-list.tsx # Spaced repetition cards
├── tips-panel.tsx     # Study tips accordion
└── ui/               # Reusable UI components

lib/
└── supabase/         # Database client configuration
```

## Algorithm Details

### SM-2 Spaced Repetition

The app uses the SuperMemo-2 algorithm for optimal review scheduling:

- **Quality factors**: User rates each card as "Know" or "Again"
- **Interval calculation**: Based on previous performance and ease factor
- **Mastery tracking**: Cards with high intervals marked as mastered

### Database Design

- **Normalized schema** with foreign key relationships
- **Row Level Security** for user data protection
- **Audit trail** via import_batches table
- **Performance indexes** on frequently queried columns

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- Any platform supporting Node.js

## Development

### Adding New Content

1. Use the import API to add vocabulary/grammar
2. Create corresponding questions
3. Add study tips for the section

### Extending Features

The modular architecture makes it easy to add:
- New question types
- Additional progress metrics
- Audio pronunciation features
- Social features (leaderboards, etc.)

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check .env.local variables
2. **RLS policy errors**: Ensure user is authenticated
3. **Build errors**: Run `npm run build` to check TypeScript issues

### Support

- Check the Next.js documentation for framework issues
- Refer to Supabase docs for database questions
- See shadcn/ui docs for component customization

## License

MIT License - feel free to modify and use for your own JLPT preparation needs!
