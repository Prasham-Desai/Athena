-- Migration number: 0003 	 2026-05-24T00:00:00.000Z

ALTER TABLE chapters ADD COLUMN paper TEXT DEFAULT 'Paper 1';
ALTER TABLE chapters ADD COLUMN tag TEXT;
ALTER TABLE chapters ADD COLUMN estimated_marks INTEGER;

ALTER TABLE topics ADD COLUMN revision_count INTEGER DEFAULT 0;
ALTER TABLE topics ADD COLUMN last_revised TEXT;
ALTER TABLE topics ADD COLUMN next_revision_due TEXT;
ALTER TABLE topics ADD COLUMN completed_at TEXT;
ALTER TABLE topics ADD COLUMN notes TEXT;
