import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

async function ensureStudyTrackingTables(db: Database) {
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

  await db.run('CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date)');
}

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    await ensureStudyTrackingTables(db);
    
    // We get all dates that have ANY activity
    const sessions = await db.query('SELECT * FROM study_sessions');
    
    // Aggregate dynamically
    const tasksAgg = await db.query(`
      SELECT date(completed_at) as dt, COUNT(*) as cnt 
      FROM tasks 
      WHERE (completed = 1 OR completed = '1' OR completed = 'true') AND completed_at IS NOT NULL 
      GROUP BY dt
    `);
    
    const topicsAgg = await db.query(`
      SELECT date(completed_at) as dt, COUNT(*) as cnt 
      FROM topics 
      WHERE status IN ('completed', 'revised') AND completed_at IS NOT NULL 
      GROUP BY dt
    `);
    
    const revisionsAgg = await db.query(`
      SELECT date(timestamp) as dt, COUNT(*) as cnt 
      FROM activities 
      WHERE type = 'topic-revised' 
      GROUP BY dt
    `);

    // We need to merge all dates that appear in any of the above
    const dateMap = new Map<string, any>();
    
    const getOrInitDate = (dt: string) => {
      if (!dateMap.has(dt)) {
        dateMap.set(dt, {
          date: dt,
          studyMinutes: 0,
          topicsCompleted: 0,
          tasksCompleted: 0,
          revisionsCompleted: 0,
          sessions: []
        });
      }
      return dateMap.get(dt);
    };

    // Process tasks
    tasksAgg.forEach((row: any) => {
      if (row.dt) getOrInitDate(row.dt).tasksCompleted = row.cnt;
    });

    // Process topics
    topicsAgg.forEach((row: any) => {
      if (row.dt) getOrInitDate(row.dt).topicsCompleted = row.cnt;
    });

    // Process revisions
    revisionsAgg.forEach((row: any) => {
      if (row.dt) getOrInitDate(row.dt).revisionsCompleted = row.cnt;
    });

    // Process sessions — always recalculate duration from actual start/end times
    sessions.forEach((s: any) => {
      if (s.date) {
        const entry = getOrInitDate(s.date);
        
        // Recalculate correct duration from timestamps
        const startMs = new Date(s.start_time).getTime();
        const endMs = new Date(s.end_time).getTime();
        const correctDuration = (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs)
          ? Math.max(1, Math.round((endMs - startMs) / 60000))
          : (Number(s.duration_minutes) || 0);
        
        if (s.type !== 'break') {
          entry.studyMinutes += correctDuration;
        }
        entry.sessions.push({
          id: s.id,
          startTime: s.start_time,
          endTime: s.end_time,
          durationMinutes: correctDuration,
          type: s.type,
          title: s.title,
          taskId: s.task_id
        });
      }
    });
    
    // Also include any explicitly stored dates in daily_progress just in case they have 0 sessions but are tracked
    const progressRecords = await db.query('SELECT date FROM daily_progress');
    progressRecords.forEach((log: any) => {
      if (log.date) getOrInitDate(log.date);
    });

    const mappedLogs = Array.from(dateMap.values());
    
    return successResponse(mappedLogs, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    await ensureStudyTrackingTables(db);
    const body: any = await request.json();
    const { date, updates } = body;
    
    if (!date) return errorResponse('date is required', 400);
    
    const existing = await db.get('SELECT * FROM daily_progress WHERE date = ?', [date]);
    
    if (existing) {
      // For dynamic tracking, we don't strictly need to update topics/tasks/revisions counts here, 
      // but we update them just in case the legacy data is useful or if study_minutes needs manual updates.
      await db.run(
        `UPDATE daily_progress SET 
          study_minutes = COALESCE(?, study_minutes),
          topics_completed = COALESCE(?, topics_completed),
          tasks_completed = COALESCE(?, tasks_completed),
          revisions_completed = COALESCE(?, revisions_completed),
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ?`,
        [updates?.studyMinutes, updates?.topicsCompleted, updates?.tasksCompleted, updates?.revisionsCompleted, date]
      );
    } else {
      await db.run(
        `INSERT INTO daily_progress (date, study_minutes, topics_completed, tasks_completed, revisions_completed)
         VALUES (?, ?, ?, ?, ?)`,
        [date, updates?.studyMinutes || 0, updates?.topicsCompleted || 0, updates?.tasksCompleted || 0, updates?.revisionsCompleted || 0]
      );
    }
    
    const updated = await db.get('SELECT * FROM daily_progress WHERE date = ?', [date]);
    return successResponse(updated, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
