-- Migration number: 0017 	 2026-10-18T00:00:00.000Z
-- Link tasks, study blocks, and study sessions for unified Focus Planner

-- 1. Link study_blocks to tasks (optional association)
ALTER TABLE study_blocks ADD COLUMN task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_study_blocks_task ON study_blocks(task_id);

-- 2. Link study_sessions to study_blocks (optional association)
ALTER TABLE study_sessions ADD COLUMN study_block_id TEXT REFERENCES study_blocks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_study_sessions_study_block ON study_sessions(study_block_id);
