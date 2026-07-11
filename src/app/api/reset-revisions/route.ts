import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    // Reset all topics
    await db.run('UPDATE topics SET revision_count = 0');
    // Reset all subtopics
    await db.run('UPDATE subtopics SET revision_count = 0');
    
    return successResponse({ reset: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
