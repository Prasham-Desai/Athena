import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { SubjectService } from '@/services/SubjectService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new SubjectService(db);
    
    const subject = await service.getById(id);
    if (!subject) return errorResponse('Subject not found', 404);

    const hierarchy = await service.getFullHierarchy(id);
    
    return successResponse({
      ...subject,
      chapters: hierarchy
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new SubjectService(db);
    const body: any = await request.json();
    
    await service.update(id, body);
    return successResponse({ id, updated: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new SubjectService(db);
    
    await service.delete(id);
    return successResponse({ id, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
