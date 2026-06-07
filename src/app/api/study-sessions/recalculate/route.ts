import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    // Ensure tables exist
    await db.run(
      `CREATE TABLE IF NOT EXISTS daily_progress (
        date TEXT PRIMARY KEY,
        study_minutes INTEGER DEFAULT 0,
        topics_completed INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        revisions_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );
    
    await db.run(
      `CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        duration_minutes INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        task_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (date) REFERENCES daily_progress(date) ON DELETE CASCADE
      )`
    );

    // Step 1: Recalculate all session durations from start_time and end_time
    const sessions = await db.query('SELECT id, date, start_time, end_time, duration_minutes FROM study_sessions');
    
    let fixedCount = 0;
    for (const session of sessions as any[]) {
      const startMs = new Date(session.start_time).getTime();
      const endMs = new Date(session.end_time).getTime();
      
      if (isNaN(startMs) || isNaN(endMs)) continue;
      
      const correctDuration = Math.max(1, Math.round((endMs - startMs) / 60000));
      
      if (correctDuration !== Number(session.duration_minutes)) {
        await db.run(
          'UPDATE study_sessions SET duration_minutes = ? WHERE id = ?',
          [correctDuration, session.id]
        );
        fixedCount++;
      }
    }

    // Step 2: Recalculate daily_progress.study_minutes for all dates
    const dateSums = await db.query(
      "SELECT date, SUM(duration_minutes) as total FROM study_sessions WHERE type != 'break' GROUP BY date"
    );
    
    let datesUpdated = 0;
    for (const row of dateSums as any[]) {
      await db.run(
        `INSERT INTO daily_progress (date, study_minutes) VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET study_minutes = ?, updated_at = CURRENT_TIMESTAMP`,
        [row.date, row.total, row.total]
      );
      datesUpdated++;
    }
    
    // Also zero out any dates in daily_progress that have no sessions
    await db.run(
      `UPDATE daily_progress SET study_minutes = 0, updated_at = CURRENT_TIMESTAMP
       WHERE date NOT IN (SELECT DISTINCT date FROM study_sessions)`
    );

    return successResponse({
      fixed: fixedCount,
      totalSessions: sessions.length,
      datesUpdated
    }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
