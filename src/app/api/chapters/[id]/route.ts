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
    const body = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.order !== undefined) { updates.push('order_index = ?'); values.push(body.order); }
    if (body.paper !== undefined) { updates.push('paper = ?'); values.push(body.paper); }
    if (body.tag !== undefined) { updates.push('tag = ?'); values.push(body.tag); }
    if (body.estimatedMarks !== undefined) { updates.push('estimated_marks = ?'); values.push(body.estimatedMarks); }

    if (updates.length > 0) {
      values.push(id);
      await db.run(
        `UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`,
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
    
    await db.run('DELETE FROM chapters WHERE id = ?', [id]);
    return successResponse({ id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
