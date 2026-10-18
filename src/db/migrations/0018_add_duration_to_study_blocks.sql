-- Migration number: 0018 	 2026-10-18T00:00:00.000Z
-- Add duration_minutes to study_blocks for explicit retrospective study log duration

ALTER TABLE study_blocks ADD COLUMN duration_minutes INTEGER;
