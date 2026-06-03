-- Migration number: 0009 	 2026-06-03
-- Add stories table for the Stories tab feature

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  mime_type TEXT,
  file_size INTEGER,
  kv_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
