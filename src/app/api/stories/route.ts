import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);

    const stories = await db.query(
      `SELECT * FROM stories ORDER BY created_at DESC`
    );

    return successResponse(stories);
  } catch (err: any) {
    console.error('GET /api/stories ERROR:', err);
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { title, description } = body;

    if (!title) {
      return errorResponse('title is required', 400);
    }

    const now = new Date().toISOString();
    const id = generateId();

    await db.run(
      `INSERT INTO stories (id, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, description || null, now, now]
    );

    const created = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    return successResponse(created, 201);
  } catch (err: any) {
    console.error('POST /api/stories ERROR:', err);
    return errorResponse(err.message, 500);
  }
}
