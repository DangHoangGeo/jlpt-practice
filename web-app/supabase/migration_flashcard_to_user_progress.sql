-- Migration script to transition from flashcard_progress to unified user_progress
-- Run this script to migrate existing flashcard progress data

-- First, create the new tables if they don't exist
-- (This assumes you've already run the enhanced_schema.sql and practice_lists_schema.sql)

-- Migrate existing flashcard_progress data to user_progress
INSERT INTO user_progress (
  user_id,
  item_id,
  item_type,
  correct_count,
  incorrect_count,
  last_reviewed_at,
  next_review_at,
  mastery_level,
  interval,
  easiness,
  is_mastered,
  created_at,
  updated_at
)
SELECT 
  fp.user_id,
  fp.item_id,
  fp.item_type,
  0 as correct_count,        -- flashcard_progress doesn't track these
  0 as incorrect_count,      -- we'll start fresh
  COALESCE(fp.last_reviewed, now()) as last_reviewed_at,
  COALESCE(fp.next_review, now()) as next_review_at,
  CASE 
    WHEN fp.is_mastered THEN 'mastered'
    WHEN fp.interval > 6 THEN 'review'
    WHEN fp.interval > 1 THEN 'learning'
    ELSE 'new'
  END as mastery_level,
  fp.interval,
  fp.easiness,
  fp.is_mastered,
  COALESCE(fp.created_at, now()) as created_at,
  now() as updated_at
FROM flashcard_progress fp
WHERE NOT EXISTS (
  -- Don't insert if already exists in user_progress
  SELECT 1 FROM user_progress up 
  WHERE up.user_id = fp.user_id 
    AND up.item_id = fp.item_id 
    AND up.item_type = fp.item_type
);

-- Update statistics
UPDATE user_progress 
SET 
  correct_count = COALESCE((
    SELECT COUNT(*)
    FROM activity_log al
    WHERE al.user_id = user_progress.user_id
      AND al.item_id = user_progress.item_id
      AND al.activity_type = 'flashcard_review'
      AND (al.details->>'known')::boolean = true
  ), 0),
  incorrect_count = COALESCE((
    SELECT COUNT(*)
    FROM activity_log al
    WHERE al.user_id = user_progress.user_id
      AND al.item_id = user_progress.item_id
      AND al.activity_type = 'flashcard_review'
      AND (al.details->>'known')::boolean = false
  ), 0)
WHERE correct_count = 0 AND incorrect_count = 0;

-- Create some default practice lists for users who have been active
INSERT INTO practice_lists (user_id, name, description)
SELECT DISTINCT 
  up.user_id,
  'My Difficult Items',
  'Items that need more practice based on your performance'
FROM user_progress up
WHERE up.correct_count + up.incorrect_count >= 3
  AND (up.correct_count::float / (up.correct_count + up.incorrect_count)) < 0.6
  AND NOT EXISTS (
    SELECT 1 FROM practice_lists pl WHERE pl.user_id = up.user_id
  );

-- Add difficult items to the default practice list
INSERT INTO practice_list_items (practice_list_id, item_id, item_type, priority)
SELECT 
  pl.id,
  up.item_id,
  up.item_type,
  CASE 
    WHEN (up.correct_count::float / (up.correct_count + up.incorrect_count)) < 0.3 THEN 5
    WHEN (up.correct_count::float / (up.correct_count + up.incorrect_count)) < 0.5 THEN 4
    ELSE 3
  END as priority
FROM practice_lists pl
JOIN user_progress up ON up.user_id = pl.user_id
WHERE pl.name = 'My Difficult Items'
  AND up.correct_count + up.incorrect_count >= 3
  AND (up.correct_count::float / (up.correct_count + up.incorrect_count)) < 0.6;

-- IMPORTANT: After verifying the migration worked correctly, you can drop the old table
-- Uncomment the line below only after you're confident the migration is successful
-- DROP TABLE flashcard_progress;

-- Verification queries (run these to check the migration)
/*
-- Check total records migrated
SELECT 
  'flashcard_progress' as table_name, 
  COUNT(*) as record_count 
FROM flashcard_progress
UNION ALL
SELECT 
  'user_progress' as table_name, 
  COUNT(*) as record_count 
FROM user_progress;

-- Check for any missing migrations
SELECT 
  fp.user_id,
  fp.item_id,
  fp.item_type,
  'Missing in user_progress' as status
FROM flashcard_progress fp
LEFT JOIN user_progress up ON (
  up.user_id = fp.user_id 
  AND up.item_id = fp.item_id 
  AND up.item_type = fp.item_type
)
WHERE up.id IS NULL;

-- Check practice lists created
SELECT 
  u.email,
  pl.name,
  COUNT(pli.id) as item_count
FROM auth.users u
JOIN practice_lists pl ON pl.user_id = u.id
LEFT JOIN practice_list_items pli ON pli.practice_list_id = pl.id
GROUP BY u.email, pl.name
ORDER BY u.email;
*/
