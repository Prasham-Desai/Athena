import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.order !== undefined) { updates.push('order_index = ?'); values.push(body.order); }

    if (updates.length > 0) {
      values.push(params.id);
      await db.run(
        `UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    return successResponse({ id: params.id, updated: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    await db.run('DELETE FROM chapters WHERE id = ?', [params.id]);
    return successResponse({ id: params.id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
