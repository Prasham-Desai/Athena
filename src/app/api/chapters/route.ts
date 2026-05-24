import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { generateId } from '@/api/helpers';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    const id = body.id || generateId();
    await db.run(
      'INSERT INTO chapters (id, subject_id, name, order_index, paper, tag, estimated_marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, body.subject_id, body.name, body.order || 0, body.paper || 'Paper 1', body.tag || null, body.estimatedMarks || null]
    );
    
    return successResponse({ id, ...body }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
