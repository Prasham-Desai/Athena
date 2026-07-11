-- Migration number: 0014 	 2026-07-12T00:00:00.000Z

ALTER TABLE subtopics ADD COLUMN revision_count INTEGER DEFAULT 0;
