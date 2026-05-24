-- Migration number: 0002 	 2026-05-24T00:00:00.000Z

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'revision', 'mock_test', 'study', 'general'
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'
  completed BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
