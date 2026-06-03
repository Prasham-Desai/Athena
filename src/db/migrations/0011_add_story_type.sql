-- Migration number: 0011 	 2026-06-03
-- Add type column to stories to support Imaginations tab

ALTER TABLE stories ADD COLUMN type TEXT DEFAULT 'story';
