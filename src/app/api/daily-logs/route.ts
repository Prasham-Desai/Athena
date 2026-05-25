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
    const progressRecords = await db.query('SELECT * FROM daily_progress');
    const sessions = await db.query('SELECT * FROM study_sessions');
    
    const mappedLogs = progressRecords.map((log: any) => {
      return {
        date: log.date,
        studyMinutes: log.study_minutes || 0,
        topicsCompleted: log.topics_completed || 0,
        tasksCompleted: log.tasks_completed || 0,
        revisionsCompleted: log.revisions_completed || 0,
        sessions: sessions.filter((s: any) => s.date === log.date).map((s: any) => ({
          id: s.id,
          startTime: s.start_time,
          endTime: s.end_time,
          durationMinutes: s.duration_minutes,
          type: s.type,
          title: s.title,
          taskId: s.task_id
        }))
      };
    });
    
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
