import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { audio_data, duration_seconds } = body;
    if (!audio_data || duration_seconds === undefined) {
      return errorResponse('audio_data and duration_seconds are required', 400);
    }

    const existing = await db.get<any>('SELECT * FROM audio_notes WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Audio note not found', 404);
    }

    // Decode new chunk from base64
    const newChunk = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));

    // Read existing blob from KV (may be empty for a freshly created note)
    const kvKey = existing.kv_key;
    let combinedBuffer: ArrayBuffer;

    const existingData = await env.KV.get(kvKey, { type: 'arrayBuffer' });
    if (existingData && existingData.byteLength > 0) {
      // Append: concat existing + new
      const combined = new Uint8Array(existingData.byteLength + newChunk.byteLength);
      combined.set(new Uint8Array(existingData), 0);
      combined.set(newChunk, existingData.byteLength);
      combinedBuffer = combined.buffer;
    } else {
      // First chunk
      combinedBuffer = newChunk.buffer;
    }

    // Write combined blob back to KV
    await env.KV.put(kvKey, combinedBuffer);

    // Update DB metadata
    const newDuration = (existing.duration_seconds || 0) + duration_seconds;
    const newFileSize = combinedBuffer.byteLength;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE audio_notes SET duration_seconds = ?, file_size = ?, updated_at = ? WHERE id = ?`,
      [newDuration, newFileSize, now, id]
    );

    const updated = await db.get('SELECT * FROM audio_notes WHERE id = ?', [id]);
    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
