import { NextRequest } from 'next/server';
import { getEnv, errorResponse } from '@/api/helpers';
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
    if (!env.KV) return errorResponse('Cloudflare KV binding not found', 500);

    const db = new Database(env.DB);
    const note = await db.get<any>('SELECT * FROM notes WHERE id = ?', [id]);

    if (!note) {
      return errorResponse('Note document not found', 404);
    }

    const arrayBuffer = await env.KV.get(note.kv_key, { type: 'arrayBuffer' });
    if (!arrayBuffer) {
      return errorResponse('File content not found in storage', 404);
    }

    // Determine inline content disposition with safe filename
    const safeFilename = encodeURIComponent(note.file_name || 'document');

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': note.mime_type || 'application/octet-stream',
        'Content-Length': String(arrayBuffer.byteLength),
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
