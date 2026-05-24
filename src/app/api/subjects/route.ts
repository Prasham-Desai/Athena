import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { SubjectService } from '@/services/SubjectService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const service = new SubjectService(db);
    
    const subjects = await service.getAllWithHierarchy();
    return successResponse(subjects);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const service = new SubjectService(db);
    const body: any = await request.json();
    
    if (!body.name) return errorResponse('Subject name is required', 400);
    
    const subject = await service.create(body);
    return successResponse(subject, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
