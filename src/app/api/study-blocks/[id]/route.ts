import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.date !== undefined) { updates.push('date = ?'); values.push(body.date); }
    if (body.subjectId !== undefined) { updates.push('subject_id = ?'); values.push(body.subjectId); }
    if (body.topicId !== undefined) { updates.push('topic_id = ?'); values.push(body.topicId); }
    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.startTime !== undefined) { updates.push('start_time = ?'); values.push(body.startTime); }
    if (body.endTime !== undefined) { updates.push('end_time = ?'); values.push(body.endTime); }
    if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
    if (body.completed !== undefined) { updates.push('completed = ?'); values.push(body.completed ? 1 : 0); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }

    if (updates.length > 0) {
      values.push(id);
      await db.run(
        `UPDATE study_blocks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const row = await db.get('SELECT * FROM study_blocks WHERE id = ?', [id]);
    return successResponse(snakeToCamel(row), 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);

    await db.run('DELETE FROM study_blocks WHERE id = ?', [id]);
    return successResponse({ id, deleted: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}