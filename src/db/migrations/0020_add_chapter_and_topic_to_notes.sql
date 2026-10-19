-- Migration 0020: Add chapter_id and topic_id to notes table
ALTER TABLE notes ADD COLUMN chapter_id TEXT DEFAULT NULL REFERENCES chapters(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN topic_id TEXT DEFAULT NULL REFERENCES topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notes_chapter_id ON notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes(topic_id);
