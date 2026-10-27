-- Record the user's completed First Year and two revisions for every topic.
UPDATE topics
SET status = 'revised',
    revision_count = 2,
    completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
    last_revised = COALESCE(last_revised, date('now')),
    next_revision_due = COALESCE(next_revision_due, date('now', '+7 days'))
WHERE chapter_id IN (
  SELECT c.id
  FROM chapters c
  JOIN subjects s ON s.id = c.subject_id
  WHERE s.academic_year_id = 'year_1'
);

-- Subtopics use a completion status plus their own revision counter.
UPDATE subtopics
SET status = 'completed',
    revision_count = 2
WHERE topic_id IN (
  SELECT t.id
  FROM topics t
  JOIN chapters c ON c.id = t.chapter_id
  JOIN subjects s ON s.id = c.subject_id
  WHERE s.academic_year_id = 'year_1'
);
