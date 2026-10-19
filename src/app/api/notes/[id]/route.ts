import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const note = await db.get<any>('SELECT * FROM notes WHERE id = ?', [id]);

    if (!note) {
      return errorResponse('Note not found', 404);
    }

    return successResponse(note);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const body: any = await request.json();

    const existing = await db.get<any>('SELECT * FROM notes WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Note not found', 404);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title.trim());
    }

    if (body.subtitle !== undefined) {
      updates.push('subtitle = ?');
      values.push(body.subtitle ? body.subtitle.trim() : null);
    }

    if (body.page_count !== undefined) {
      updates.push('page_count = ?');
      values.push(body.page_count);
    }

    if (body.chapter_id !== undefined) {
      updates.push('chapter_id = ?');
      values.push(body.chapter_id ? body.chapter_id.trim() : null);
    }

    if (body.topic_id !== undefined) {
      updates.push('topic_id = ?');
      values.push(body.topic_id ? body.topic_id.trim() : null);
    }

    if (updates.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await db.run(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await db.get<any>('SELECT * FROM notes WHERE id = ?', [id]);
    return successResponse(updated);
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
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const note = await db.get<any>('SELECT * FROM notes WHERE id = ?', [id]);

    if (!note) {
      return errorResponse('Note not found', 404);
    }

    // Delete KV blob if exists
    if (env.KV && note.kv_key) {
      try {
        await env.KV.delete(note.kv_key);
      } catch (kvErr) {
        console.error('Failed to delete KV blob:', kvErr);
      }
    }

    // Delete note from D1 (cascade delete deletes note_annotations)
    await db.run('DELETE FROM notes WHERE id = ?', [id]);

    return successResponse({ id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
