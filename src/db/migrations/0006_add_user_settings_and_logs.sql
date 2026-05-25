-- Migration number: 0006 	 2026-05-25T00:00:00.000Z

-- Global User Settings table (single row)
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  theme TEXT DEFAULT 'dark',
  daily_study_goal_hours INTEGER DEFAULT 6,
  show_welcome BOOLEAN DEFAULT TRUE,
  pomodoro_minutes INTEGER DEFAULT 25,
  break_minutes INTEGER DEFAULT 5,
  font_size TEXT DEFAULT 'small',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with default row
INSERT OR IGNORE INTO user_settings (id) VALUES ('global');

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  subject_id TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update daily_progress to add new columns
ALTER TABLE daily_progress ADD COLUMN topics_completed INTEGER DEFAULT 0;
ALTER TABLE daily_progress ADD COLUMN tasks_completed INTEGER DEFAULT 0;
ALTER TABLE daily_progress ADD COLUMN revisions_completed INTEGER DEFAULT 0;

-- Study Sessions table (linked to daily_progress date)
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'manual', 'timer', 'task'
  title TEXT,
  task_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date) REFERENCES daily_progress(date) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);

-- Study Blocks (Planner)
CREATE TABLE IF NOT EXISTS study_blocks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD
  subject_id TEXT NOT NULL,
  topic_id TEXT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL, -- HH:mm
  priority TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_blocks_date ON study_blocks(date);
