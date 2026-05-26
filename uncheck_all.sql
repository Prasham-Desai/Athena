UPDATE topics SET status = 'pending'; UPDATE subtopics SET status = 'not-started'; UPDATE topics SET completed_at = NULL, revision_count = 0, last_revised = NULL, next_revision_due = NULL;
