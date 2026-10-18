import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

function snakeToCamel(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    academic_year_id: row.academic_year_id,
    date: row.date,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
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

    await db.run(
      `INSERT INTO study_blocks (id, date, subject_id, topic_id, title, start_time, end_time, priority, completed, notes, academic_year_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.date,
        body.subjectId,
        body.topicId || null,
        body.title,
        body.startTime,
        body.endTime,
        body.priority,
        body.completed ? 1 : 0,
        body.notes || null,
        academicYearId
      ]
    );

    const row = await db.get('SELECT * FROM study_blocks WHERE id = ?', [id]);
    return successResponse(snakeToCamel(row), 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}