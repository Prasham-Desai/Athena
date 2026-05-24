import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { TopicService } from '@/services/TopicService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new TopicService(db);
    const body = await request.json();
    
    await service.update(params.id, body);
    return successResponse({ id: params.id, updated: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new TopicService(db);
    
    await service.delete(params.id);
    return successResponse({ id: params.id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
