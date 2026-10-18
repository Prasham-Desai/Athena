import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
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
    const pageParam = request.nextUrl.searchParams.get('page');

    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      const row = await db.get<any>(
        'SELECT * FROM note_annotations WHERE note_id = ? AND page_number = ?',
        [id, pageNumber]
      );

      let items = [];
      if (row && row.data) {
        try {
          items = JSON.parse(row.data);
        } catch (e) {
          items = [];
        }
      }

      return successResponse({ page_number: pageNumber, annotations: items });
    }

    // Return all pages
    const rows = await db.query<any>(
      'SELECT * FROM note_annotations WHERE note_id = ? ORDER BY page_number ASC',
      [id]
    );

    const result: Record<number, any[]> = {};
    for (const r of rows) {
      try {
        result[r.page_number] = JSON.parse(r.data);
      } catch (e) {
        result[r.page_number] = [];
      }
    }

    return successResponse(result);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const body: any = await request.json();

    const { page_number, annotations } = body;
    if (page_number === undefined || !Array.isArray(annotations)) {
      return errorResponse('page_number and annotations array are required', 400);
    }

    // Verify note exists
    const note = await db.get<any>('SELECT id FROM notes WHERE id = ?', [id]);
    if (!note) {
      return errorResponse('Note document not found', 404);
    }

    const dataJson = JSON.stringify(annotations);
    const now = new Date().toISOString();

    const existing = await db.get<any>(
      'SELECT id FROM note_annotations WHERE note_id = ? AND page_number = ?',
      [id, page_number]
    );

    if (existing) {
      await db.run(
        `UPDATE note_annotations
         SET data = ?, updated_at = ?
         WHERE id = ?`,
        [dataJson, now, existing.id]
      );
    } else {
      const annotationId = generateId();
      await db.run(
        `INSERT INTO note_annotations (
          id, note_id, page_number, type, data, created_at, updated_at
        ) VALUES (?, ?, ?, 'canvas', ?, ?, ?)`,
        [annotationId, id, page_number, dataJson, now, now]
      );
    }

    // Update note's updated_at
    await db.run('UPDATE notes SET updated_at = ? WHERE id = ?', [now, id]);

    return successResponse({ saved: true, page_number, count: annotations.length });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
