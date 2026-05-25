import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);

    await db.run('DELETE FROM study_sessions');
    await db.run('DELETE FROM daily_progress');
    await db.run('DELETE FROM study_blocks');
    await db.run('DELETE FROM activities');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM subtopics');
    await db.run('DELETE FROM topics');
    await db.run('DELETE FROM chapters');
    await db.run('DELETE FROM subjects');
    await db.run('DELETE FROM exams');

    return successResponse({ reset: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}