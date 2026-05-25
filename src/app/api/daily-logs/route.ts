import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
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
