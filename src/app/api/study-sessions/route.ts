import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    const { date, session } = body;
    
    if (!date || !session) {
      return errorResponse('date and session are required', 400);
    }
    
    const id = session.id || generateId();
    
    // Ensure daily progress exists
    const existingProgress = await db.get('SELECT * FROM daily_progress WHERE date = ?', [date]);
    if (!existingProgress) {
      await db.run(
        `INSERT INTO daily_progress (date, study_minutes) VALUES (?, ?)`,
        [date, session.durationMinutes || 0]
      );
    } else {
      await db.run(
        `UPDATE daily_progress SET study_minutes = study_minutes + ? WHERE date = ?`,
        [session.durationMinutes || 0, date]
      );
    }
    
    await db.run(
      `INSERT INTO study_sessions (id, date, start_time, end_time, duration_minutes, type, title, task_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        session.startTime,
        session.endTime,
        session.durationMinutes,
        session.type,
        session.title || null,
        session.taskId || null
      ]
    );
    
    return successResponse({ id }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const date = url.searchParams.get('date');
    
    if (!id || !date) {
      return errorResponse('id and date are required', 400);
    }
    
    const session = await db.get('SELECT duration_minutes FROM study_sessions WHERE id = ?', [id]);
    if (!session) {
      return errorResponse('session not found', 404);
    }
    
    // Deduct minutes
    await db.run(
      `UPDATE daily_progress SET study_minutes = MAX(0, study_minutes - ?) WHERE date = ?`,
      [session.duration_minutes, date]
    );
    
    await db.run('DELETE FROM study_sessions WHERE id = ?', [id]);
    
    return successResponse({ deleted: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
