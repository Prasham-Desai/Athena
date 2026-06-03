import { NextRequest, NextResponse } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);

    const story = await db.get<any>('SELECT * FROM stories WHERE id = ?', [id]);
    
    if (!story || !story.kv_key) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    const audioData = await env.KV.get(story.kv_key, 'arrayBuffer');
    if (!audioData) {
      return new NextResponse('Audio blob not found in KV', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', story.mime_type || 'audio/webm');
    headers.set('Content-Length', audioData.byteLength.toString());
    // Enable caching for audio files
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Accept-Ranges', 'bytes');

    return new NextResponse(audioData, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { audio_data, mime_type, duration_seconds } = body;

    if (!audio_data || !mime_type || duration_seconds === undefined) {
      return errorResponse('audio_data, mime_type, and duration_seconds are required', 400);
    }

    const existing = await db.get<any>('SELECT * FROM stories WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Story not found', 404);
    }

    // Decode base64 to ArrayBuffer
    const binaryData = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
    const fileSize = binaryData.byteLength;

    const kvKey = `story_audio:${id}`;
    
    // Delete old KV blob if exists and different (though here they are the same key)
    if (existing.kv_key && existing.kv_key !== kvKey) {
      await env.KV.delete(existing.kv_key);
    }

    // Store blob in KV
    await env.KV.put(kvKey, binaryData.buffer);

    const now = new Date().toISOString();

    // Update D1 row
    await db.run(
      `UPDATE stories
       SET duration_seconds = ?, mime_type = ?, file_size = ?, kv_key = ?, updated_at = ?
       WHERE id = ?`,
      [duration_seconds, mime_type, fileSize, kvKey, now, id]
    );

    const updated = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
