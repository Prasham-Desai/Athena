-- Audio notes table: stores metadata for audio recordings attached to subtopics.
-- Audio blobs are stored in Cloudflare KV, referenced by kv_key.
-- This migration ONLY creates a new table — no existing tables are modified.

CREATE TABLE IF NOT EXISTS audio_notes (
  id TEXT PRIMARY KEY,
  subtopic_id TEXT NOT NULL UNIQUE,
  duration_seconds REAL NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  kv_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subtopic_id) REFERENCES subtopics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audio_notes_subtopic ON audio_notes(subtopic_id);
