import { NextRequest, NextResponse } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const searchParams = request.nextUrl.searchParams;
    const audioId = searchParams.get('audioId');

    if (!audioId) {
      return new NextResponse('audioId is required', { status: 400 });
    }

    const storyAudio = await db.get<any>('SELECT * FROM story_audios WHERE id = ? AND story_id = ?', [audioId, id]);
    
    if (!storyAudio || !storyAudio.kv_key) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    const audioData = await env.KV.get(storyAudio.kv_key, 'arrayBuffer');
    if (!audioData) {
      return new NextResponse('Audio blob not found in KV', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', storyAudio.mime_type || 'audio/webm');
    headers.set('Content-Length', audioData.byteLength.toString());
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

    if (!mime_type || duration_seconds === undefined) {
      return errorResponse('mime_type and duration_seconds are required', 400);
    }

    const existing = await db.get<any>('SELECT * FROM stories WHERE id = ?', [id]);
    if (!existing) {
      return errorResponse('Story not found', 404);
    }

    const countRes = await db.get<{c: number}>('SELECT COUNT(*) as c FROM story_audios WHERE story_id = ?', [id]);
    const sequenceIndex = countRes?.c || 0;
    
    // Generate unique ID for this audio segment
    const audioId = `${id}-audio-${Date.now()}`;
    const kvKey = `story_audio:${audioId}`;

    let fileSize = 0;

    if (audio_data && audio_data.length > 0) {
      // Decode base64 to ArrayBuffer
      const binaryData = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0));
      fileSize = binaryData.byteLength;
      await env.KV.put(kvKey, binaryData.buffer);
    } else {
      // Reserve with empty blob
      await env.KV.put(kvKey, new ArrayBuffer(0));
    }

    const now = new Date().toISOString();

    // Insert D1 row
    await db.run(
      `INSERT INTO story_audios (id, story_id, duration_seconds, mime_type, file_size, kv_key, sequence_index, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [audioId, id, duration_seconds, mime_type, fileSize, kvKey, sequenceIndex, now]
    );

    const updatedStory = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    const storyAudios = await db.query(
      `SELECT * FROM story_audios WHERE story_id = ? ORDER BY sequence_index ASC`,
      [id]
    );

    return successResponse({
      ...updatedStory,
      audios: storyAudios || []
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
