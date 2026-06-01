import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);

    const note = await db.get<any>('SELECT * FROM audio_notes WHERE id = ?', [id]);
    if (!note) {
      return errorResponse('Audio note not found', 404);
    }

    const arrayBuffer = await env.KV.get(note.kv_key, { type: 'arrayBuffer' });
    if (!arrayBuffer) {
      return errorResponse('Audio data not found in storage', 404);
    }

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': note.mime_type,
        'Content-Length': String(note.file_size),
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
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

    const { audio_data } = body;
    if (!audio_data) {
      return errorResponse('audio_data is required', 400);
    }

    const existing = await db.get<any>('SELECT * FROM audio_notes WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Audio note not found', 404);
    }

    // Decode base64 to ArrayBuffer
    const binaryData = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
    const fileSize = binaryData.byteLength;

    // Delete old KV blob and store new one
    await env.KV.delete(existing.kv_key);
    const kvKey = `audio:${id}`;
    await env.KV.put(kvKey, binaryData.buffer);

    // Update D1 metadata
    const mimeType = body.mime_type ?? existing.mime_type;
    const durationSeconds = body.duration_seconds ?? existing.duration_seconds;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE audio_notes
       SET duration_seconds = ?, mime_type = ?, file_size = ?, kv_key = ?, updated_at = ?
       WHERE id = ?`,
      [durationSeconds, mimeType, fileSize, kvKey, now, id]
    );

    const updated = await db.get('SELECT * FROM audio_notes WHERE id = ?', [id]);
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
    const env = getEnv(request);
    const db = new Database(env.DB);

    const note = await db.get<any>('SELECT * FROM audio_notes WHERE id = ?', [id]);
    if (!note) {
      return errorResponse('Audio note not found', 404);
    }

    // Delete KV blob
    await env.KV.delete(note.kv_key);

    // Delete D1 row
    await db.run('DELETE FROM audio_notes WHERE id = ?', [id]);

    return successResponse({ id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
