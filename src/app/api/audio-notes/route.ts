import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const topicId = request.nextUrl.searchParams.get('topic_id');

    if (!topicId) {
      return errorResponse('topic_id is required', 400);
    }

    const notes = await db.query(
      `SELECT an.* FROM audio_notes an
       INNER JOIN subtopics s ON an.subtopic_id = s.id
       WHERE s.topic_id = ?`,
      [topicId]
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

    const { subtopic_id, audio_data, mime_type, duration_seconds } = body;

    if (!subtopic_id || !audio_data || !mime_type || duration_seconds === undefined) {
      return errorResponse('subtopic_id, audio_data, mime_type, and duration_seconds are required', 400);
    }

    // Decode base64 to ArrayBuffer
    const binaryData = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
    const fileSize = binaryData.byteLength;

    // Check if an audio note already exists for this subtopic
    const existing = await db.get<any>(
      'SELECT * FROM audio_notes WHERE subtopic_id = ?',
      [subtopic_id]
    );

    const now = new Date().toISOString();

    if (existing) {
      // Delete old KV blob
      await env.KV.delete(existing.kv_key);

      // Store new blob in KV (reuse existing id)
      const kvKey = `audio:${existing.id}`;
      await env.KV.put(kvKey, binaryData.buffer);

      // Update D1 row
      await db.run(
        `UPDATE audio_notes
         SET duration_seconds = ?, mime_type = ?, file_size = ?, kv_key = ?, updated_at = ?
         WHERE id = ?`,
        [duration_seconds, mime_type, fileSize, kvKey, now, existing.id]
      );

      const updated = await db.get('SELECT * FROM audio_notes WHERE id = ?', [existing.id]);
      return successResponse(updated);
    } else {
      // Create new audio note
      const id = generateId();
      const kvKey = `audio:${id}`;

      // Store blob in KV
      await env.KV.put(kvKey, binaryData.buffer);

      // Insert D1 row
      await db.run(
        `INSERT INTO audio_notes (id, subtopic_id, duration_seconds, mime_type, file_size, kv_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, subtopic_id, duration_seconds, mime_type, fileSize, kvKey, now, now]
      );

      const created = await db.get('SELECT * FROM audio_notes WHERE id = ?', [id]);
      return successResponse(created, 201);
    }
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
