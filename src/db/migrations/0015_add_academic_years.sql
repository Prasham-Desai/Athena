-- Migration number: 0015 	 2026-10-18T00:00:00.000Z
-- Multi-year academic study management support

-- 1. Create academic_years table
CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial academic years: Second Year (migrated data) and Third Year (fresh workspace)
INSERT OR IGNORE INTO academic_years (id, name, code, order_index) VALUES ('year_2', 'Second Year', 'second_year', 2);
INSERT OR IGNORE INTO academic_years (id, name, code, order_index) VALUES ('year_3', 'Third Year', 'third_year', 3);

-- 2. Associate subjects with academic year (Second Year backfill)
ALTER TABLE subjects ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE subjects SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_academic_year ON subjects(academic_year_id);

-- 3. Associate tasks with academic year (Second Year backfill)
ALTER TABLE tasks ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE tasks SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_academic_year ON tasks(academic_year_id);

-- 4. Associate study_blocks with academic year (Second Year backfill)
ALTER TABLE study_blocks ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE study_blocks SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_study_blocks_academic_year ON study_blocks(academic_year_id);

-- 5. Associate study_sessions with academic year (Second Year backfill)
ALTER TABLE study_sessions ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE study_sessions SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_study_sessions_academic_year ON study_sessions(academic_year_id);

-- 6. Associate activities with academic year (Second Year backfill)
ALTER TABLE activities ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE activities SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_academic_year ON activities(academic_year_id);

-- 7. Associate exams with academic year (Second Year backfill)
ALTER TABLE exams ADD COLUMN academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE;
UPDATE exams SET academic_year_id = 'year_2' WHERE academic_year_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_exams_academic_year ON exams(academic_year_id);

-- 8. Recreate daily_progress with composite primary key (date, academic_year_id)
CREATE TABLE IF NOT EXISTS daily_progress_new (
  date TEXT NOT NULL,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  study_minutes INTEGER DEFAULT 0,
  topics_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  revisions_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (date, academic_year_id)
);

INSERT OR IGNORE INTO daily_progress_new (date, academic_year_id, study_minutes, topics_completed, tasks_completed, revisions_completed, created_at, updated_at)
SELECT date, 'year_2', study_minutes, topics_completed, tasks_completed, revisions_completed, created_at, updated_at FROM daily_progress;

DROP TABLE daily_progress;
ALTER TABLE daily_progress_new RENAME TO daily_progress;
CREATE INDEX IF NOT EXISTS idx_daily_progress_academic_year ON daily_progress(academic_year_id);
