import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    if (body.status !== undefined) {
      await db.run('UPDATE subtopics SET status = ? WHERE id = ?', [body.status, id]);
    }
    
    return successResponse({ id, updated: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
