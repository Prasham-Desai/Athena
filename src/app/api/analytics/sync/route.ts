import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    // Reset the counters but keep study_minutes
    await db.run(`
      UPDATE daily_progress 
      SET topics_completed = 0, tasks_completed = 0, revisions_completed = 0
    `);

    // Backfill Tasks Completed
    // We assume completed_at is an ISO string. date(completed_at) gives YYYY-MM-DD.
    await db.run(`
      INSERT INTO daily_progress (date, tasks_completed)
      SELECT date(completed_at) as dt, COUNT(*) as cnt
      FROM tasks
      WHERE completed = 1 AND completed_at IS NOT NULL
      GROUP BY dt
      ON CONFLICT(date) DO UPDATE SET tasks_completed = tasks_completed + excluded.tasks_completed
    `);

    // Backfill Topics Completed
    await db.run(`
      INSERT INTO daily_progress (date, topics_completed)
      SELECT date(completed_at) as dt, COUNT(*) as cnt
      FROM topics
      WHERE status IN ('completed', 'revised') AND completed_at IS NOT NULL
      GROUP BY dt
      ON CONFLICT(date) DO UPDATE SET topics_completed = topics_completed + excluded.topics_completed
    `);

    // Backfill Revisions
    await db.run(`
      INSERT INTO daily_progress (date, revisions_completed)
      SELECT date(last_revised) as dt, SUM(revision_count) as cnt
      FROM topics
      WHERE revision_count > 0 AND last_revised IS NOT NULL
      GROUP BY dt
      ON CONFLICT(date) DO UPDATE SET revisions_completed = revisions_completed + excluded.revisions_completed
    `);

    return successResponse({ synced: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
