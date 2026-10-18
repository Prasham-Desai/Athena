-- Migration number: 0019 	 2026-10-18T00:00:00.000Z
-- Fix foreign key mismatch on study_sessions after daily_progress became composite primary key

CREATE TABLE study_sessions_new (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  task_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE,
  study_block_id TEXT REFERENCES study_blocks(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO study_sessions_new (id, date, start_time, end_time, duration_minutes, type, title, task_id, created_at, academic_year_id, study_block_id)
SELECT id, date, start_time, end_time, duration_minutes, type, title, task_id, created_at, academic_year_id, study_block_id FROM study_sessions;

DROP TABLE study_sessions;
ALTER TABLE study_sessions_new RENAME TO study_sessions;

CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_academic_year ON study_sessions(academic_year_id);
