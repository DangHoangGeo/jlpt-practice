# Database Import Instructions

This folder contains CSV files that can be imported directly into your Supabase database tables.

## Files Overview

- `vocabulary_items.csv` - Sample vocabulary items (15 entries)
- `grammar_items.csv` - Sample grammar patterns (15 entries)
- `questions.csv` - Sample practice questions (10 entries)
- `tips.csv` - Study tips and learning strategies (20 entries)
- `import_batches.csv` - Import batch tracking (4 entries)

## Import Order

**Important**: Import the files in this exact order to maintain referential integrity:

1. `import_batches.csv`
2. `vocabulary_items.csv`
3. `grammar_items.csv`
4. `questions.csv`
5. `tips.csv`

## How to Import

### Method 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. For each table, click on the table name
4. Click the **Import data** button (usually near the top right)
5. Upload the corresponding CSV file
6. Map the columns appropriately
7. Click **Import**

### Method 2: Using SQL (Alternative)

If you prefer using SQL, you can also copy the data and insert it manually:

1. Go to **SQL Editor** in your Supabase dashboard
2. Use INSERT statements to add the data

## Important Notes

- Make sure your database schema is set up first (run `supabase/schema.sql`)
- The `vocabulary_item_id` and `grammar_item_id` in questions.csv are left empty - they will be auto-assigned if you have foreign key relationships set up
- The `options` field in questions.csv contains JSON arrays as strings
- After importing, you may need to update the sequence counters for auto-increment fields

## Verification

After importing, verify the data by running these queries in the SQL Editor:

```sql
-- Check vocabulary items
SELECT COUNT(*) FROM vocabulary_items;

-- Check grammar items  
SELECT COUNT(*) FROM grammar_items;

-- Check questions
SELECT COUNT(*) FROM questions;

-- Check tips
SELECT COUNT(*) FROM tips;

-- Check import batches
SELECT COUNT(*) FROM import_batches;
```

You should see:
- 15 vocabulary items
- 15 grammar items
- 10 questions
- 20 tips
- 4 import batches

## Next Steps

Once the data is imported:

1. Start your development server: `npm run dev`
2. Open http://localhost:3000 (or the port shown)
3. Create a user account
4. Start practicing with the imported data!

## Troubleshooting

- If you get permission errors, make sure Row Level Security (RLS) policies are configured correctly
- If imports fail, check that the column names match your schema exactly
- For JSON fields like `options` in questions, make sure the data is properly formatted
