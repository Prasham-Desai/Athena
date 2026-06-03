-- Migration number: 0010 	 2026-06-03
-- Multi-audio support for stories and topics

-- 1. Topics (audio_notes)
CREATE TABLE IF NOT EXISTS audio_notes_new (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  duration_seconds REAL NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  kv_key TEXT NOT NULL,
  sequence_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

INSERT INTO audio_notes_new (id, topic_id, duration_seconds, mime_type, file_size, kv_key, created_at, updated_at)
SELECT id, topic_id, duration_seconds, mime_type, file_size, kv_key, created_at, updated_at FROM audio_notes;

DROP TABLE audio_notes;
ALTER TABLE audio_notes_new RENAME TO audio_notes;
CREATE INDEX IF NOT EXISTS idx_audio_notes_topic ON audio_notes(topic_id);

-- 2. Stories (story_audios)
CREATE TABLE IF NOT EXISTS story_audios (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  duration_seconds REAL NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  kv_key TEXT NOT NULL,
  sequence_index INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_story_audios_story ON story_audios(story_id);

INSERT INTO story_audios (id, story_id, duration_seconds, mime_type, file_size, kv_key, sequence_index)
SELECT id || '-audio', id, duration_seconds, mime_type, file_size, kv_key, 0
FROM stories
WHERE kv_key IS NOT NULL;
