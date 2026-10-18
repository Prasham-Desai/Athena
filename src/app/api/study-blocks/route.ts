import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

function calculateMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function snakeToCamel(row: any) {
  if (!row) return row;
  const calculated = calculateMinutes(row.start_time, row.end_time);
  const duration = row.duration_minutes !== null && row.duration_minutes !== undefined ? Number(row.duration_minutes) : calculated;
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    academic_year_id: row.academic_year_id,
    taskId: row.task_id || null,
    task_id: row.task_id || null,
    date: row.date,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: duration,
    duration_minutes: duration,
    priority: row.priority,
    completed: Boolean(row.completed),
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    const academicYearId = request.nextUrl.searchParams.get('academic_year_id');
    const rows = academicYearId
      ? await db.query('SELECT * FROM study_blocks WHERE academic_year_id = ? ORDER BY date DESC, start_time ASC', [academicYearId])
      : await db.query('SELECT * FROM study_blocks ORDER BY date DESC, start_time ASC');
    return successResponse(rows.map(snakeToCamel), 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    const id = body.id || generateId();
    const academicYearId = body.academicYearId || body.academic_year_id || 'year_3';
    const taskId = body.taskId || body.task_id || null;
    const durationMinutes = body.durationMinutes ?? body.duration_minutes ?? calculateMinutes(body.startTime, body.endTime);

    await db.run(
      `INSERT INTO study_blocks (id, date, subject_id, topic_id, title, start_time, end_time, duration_minutes, priority, completed, notes, academic_year_id, task_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.date,
        body.subjectId,
        body.topicId || null,
        body.title,
        body.startTime,
        body.endTime,
        durationMinutes,
        body.priority || 'medium',
        body.completed ? 1 : 0,
        body.notes || null,
        academicYearId,
        taskId
      ]
    );

    const row = await db.get('SELECT * FROM study_blocks WHERE id = ?', [id]);
    return successResponse(snakeToCamel(row), 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}