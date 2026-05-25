import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

function snakeToCamel(row: any) {
  if (!row) return row;
  return {
    id: row.id,
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
    const env = getEnv(request);
    const db = new Database(env.DB);
    const rows = await db.query('SELECT * FROM study_blocks ORDER BY date DESC, start_time ASC');
    return successResponse(rows.map(snakeToCamel), 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    const id = body.id || generateId();

    await db.run(
      `INSERT INTO study_blocks (id, date, subject_id, topic_id, title, start_time, end_time, priority, completed, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );

    const row = await db.get('SELECT * FROM study_blocks WHERE id = ?', [id]);
    return successResponse(snakeToCamel(row), 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}