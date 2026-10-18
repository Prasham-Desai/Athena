import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

async function ensureStudyTrackingTables(db: Database) {
  await db.run(
    `CREATE TABLE IF NOT EXISTS daily_progress (
      date TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      study_minutes INTEGER DEFAULT 0,
      topics_completed INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      revisions_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (date, academic_year_id)
    )`
  );

  await db.run(
    `CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      academic_year_id TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_minutes INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      task_id TEXT,
      study_block_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await db.run('CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date)');
}

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    await ensureStudyTrackingTables(db);
    const body: any = await request.json();
    const { date, session } = body;
    
    if (!date || !session) {
      return errorResponse('date and session are required', 400);
    }
    
    const id = session.id || generateId();
    const academicYearId = body.academicYearId || body.academic_year_id || session.academicYearId || session.academic_year_id || 'year_3';
    const studyBlockId = session.studyBlockId || session.study_block_id || null;
    
    // Always recalculate duration from the actual start/end times
    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();
    const calculatedDuration = (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs)
      ? Math.max(1, Math.round((endMs - startMs) / 60000))
      : (session.durationMinutes || 0);
    
    // Ensure daily progress exists and update study_minutes if it's not a break
    const isBreak = session.type === 'break';
    const addedMinutes = isBreak ? 0 : calculatedDuration;

    const existingProgress = await db.get(
      'SELECT * FROM daily_progress WHERE date = ? AND academic_year_id = ?',
      [date, academicYearId]
    );
    if (!existingProgress) {
      await db.run(
        `INSERT INTO daily_progress (date, academic_year_id, study_minutes) VALUES (?, ?, ?)`,
        [date, academicYearId, addedMinutes]
      );
    } else {
      await db.run(
        `UPDATE daily_progress SET study_minutes = study_minutes + ? WHERE date = ? AND academic_year_id = ?`,
        [addedMinutes, date, academicYearId]
      );
    }
    
    await db.run(
      `INSERT INTO study_sessions (id, date, start_time, end_time, duration_minutes, type, title, task_id, study_block_id, academic_year_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        session.startTime,
        session.endTime,
        calculatedDuration,
        session.type,
        session.title || null,
        session.taskId || null,
        studyBlockId,
        academicYearId
      ]
    );
    
    return successResponse({ id, academicYearId }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    await ensureStudyTrackingTables(db);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const date = url.searchParams.get('date');
    
    if (!id || !date) {
      return errorResponse('id and date are required', 400);
    }
    
    const session = await db.get('SELECT duration_minutes, type, academic_year_id FROM study_sessions WHERE id = ?', [id]);
    if (!session) {
      return errorResponse('session not found', 404);
    }
    
    // Deduct minutes if it wasn't a break
    if (session.type !== 'break') {
      const yearId = session.academic_year_id || 'year_2';
      await db.run(
        `UPDATE daily_progress SET study_minutes = MAX(0, study_minutes - ?) WHERE date = ? AND academic_year_id = ?`,
        [session.duration_minutes, date, yearId]
      );
    }
    
    await db.run('DELETE FROM study_sessions WHERE id = ?', [id]);
    
    return successResponse({ deleted: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
