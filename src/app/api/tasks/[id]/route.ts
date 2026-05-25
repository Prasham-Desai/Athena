import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

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

    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.category !== undefined) { updates.push('category = ?'); values.push(body.category); }
    if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
    if (body.dueDate !== undefined || body.date !== undefined) { updates.push('date = ?'); values.push(body.date || body.dueDate); }
    if (body.estimatedMinutes !== undefined) { updates.push('estimated_minutes = ?'); values.push(body.estimatedMinutes); }
    if (body.actualMinutes !== undefined) { updates.push('actual_minutes = ?'); values.push(body.actualMinutes); }
    if (body.completed !== undefined) { updates.push('completed = ?'); values.push(body.completed ? 1 : 0); }
    if (body.completedAt !== undefined) { updates.push('completed_at = ?'); values.push(body.completedAt); }

    if (updates.length > 0) {
      values.push(id);
      await db.run(
        `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }
    
    return successResponse({ id, updated: true });
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
    
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    return successResponse({ id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
