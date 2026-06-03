import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { title, description } = body;

    if (!title) {
      return errorResponse('title is required', 400);
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE stories
       SET title = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      [title, description || null, now, id]
    );

    const updated = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    if (!updated) {
      return errorResponse('Story not found', 404);
    }

    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);

    const existing = await db.get<any>('SELECT * FROM stories WHERE id = ?', [id]);
    
    if (!existing) {
      return errorResponse('Story not found', 404);
    }

    // Delete KV blob if exists
    if (existing.kv_key) {
      await env.KV.delete(existing.kv_key);
    }

    // Delete row
    await db.run('DELETE FROM stories WHERE id = ?', [id]);

    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
