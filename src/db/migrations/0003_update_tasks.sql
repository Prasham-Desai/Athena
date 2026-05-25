-- Migration number: 0003 	 2026-05-25T00:00:00.000Z

-- SQLite doesn't support renaming columns easily, so we add the new columns
ALTER TABLE tasks ADD COLUMN date TEXT;
ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN actual_minutes INTEGER;

-- Migrate existing due_date to date
UPDATE tasks SET date = due_date WHERE due_date IS NOT NULL;
