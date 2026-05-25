-- Migration number: 0004 	 2026-05-25T01:00:00.000Z

-- Set default estimated time to 15 mins for completed tasks that lack it
UPDATE tasks 
SET estimated_minutes = 15 
WHERE completed = 1 AND (estimated_minutes IS NULL OR estimated_minutes = 0);

-- Set default actual time to 15 mins for completed tasks that lack it
UPDATE tasks 
SET actual_minutes = 15 
WHERE completed = 1 AND (actual_minutes IS NULL OR actual_minutes = 0);

-- Ensure all tasks have a date (fallback to today if missing due to legacy due_date missing)
UPDATE tasks
SET date = date('now')
WHERE date IS NULL;
