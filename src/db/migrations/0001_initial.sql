-- Migration number: 0001 	 2026-05-24T00:00:00.000Z

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'revised'
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'not-started',
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Daily Progress table
CREATE TABLE IF NOT EXISTS daily_progress (
  date TEXT PRIMARY KEY, -- Format: YYYY-MM-DD
  study_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON subtopics(topic_id);
