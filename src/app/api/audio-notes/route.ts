import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const chapterId = request.nextUrl.searchParams.get('chapter_id');

    if (!chapterId) {
      return errorResponse('chapter_id is required', 400);
    }

    const notes = await db.query(
      `SELECT an.* FROM audio_notes an
       INNER JOIN topics t ON an.topic_id = t.id
       WHERE t.chapter_id = ?`,
      [chapterId]
    );

    return successResponse(notes);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { topic_id, audio_data, mime_type, duration_seconds } = body;

    if (!topic_id || !mime_type || duration_seconds === undefined) {
      return errorResponse('topic_id, mime_type, and duration_seconds are required', 400);
    }

    let fileSize = 0;

    // Decode base64 to ArrayBuffer if provided
    if (audio_data) {
      const binaryData = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
      fileSize = binaryData.byteLength;

      const countRes = await db.get<{c: number}>('SELECT COUNT(*) as c FROM audio_notes WHERE topic_id = ?', [topic_id]);
      const sequenceIndex = countRes?.c || 0;

      const now = new Date().toISOString();
      const id = generateId();
      const kvKey = `audio:${id}`;

      // Store blob in KV
      await env.KV.put(kvKey, binaryData.buffer);

      // Insert D1 row
      await db.run(
        `INSERT INTO audio_notes (id, topic_id, duration_seconds, mime_type, file_size, kv_key, sequence_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, topic_id, duration_seconds, mime_type, fileSize, kvKey, sequenceIndex, now, now]
      );

      const created = await db.get('SELECT * FROM audio_notes WHERE id = ?', [id]);
      return successResponse(created, 201);
    } else {
      // Reserve a DB row with empty KV blob (for auto-save flow)
      const countRes = await db.get<{c: number}>('SELECT COUNT(*) as c FROM audio_notes WHERE topic_id = ?', [topic_id]);
      const sequenceIndex = countRes?.c || 0;

      const now = new Date().toISOString();
      const id = generateId();
      const kvKey = `audio:${id}`;

      // Store empty blob in KV
      await env.KV.put(kvKey, new ArrayBuffer(0));

      // Insert D1 row with zero size
      await db.run(
        `INSERT INTO audio_notes (id, topic_id, duration_seconds, mime_type, file_size, kv_key, sequence_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, topic_id, 0, mime_type, 0, kvKey, sequenceIndex, now, now]
      );

      const created = await db.get('SELECT * FROM audio_notes WHERE id = ?', [id]);
      return successResponse(created, 201);
    }
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
