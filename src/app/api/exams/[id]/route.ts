import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = getEnv(request);
    const db = env.DB;
    const { id } = await params;
    
    await db.prepare('DELETE FROM exams WHERE id = ?').bind(id).run();
    
    return successResponse(null);
  } catch (error: any) {
    console.error('Error deleting exam:', error);
    return errorResponse(error.message, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = getEnv(request);
    const db = env.DB;
    const { id } = await params;
    const data: any = await request.json();
    
    if (data.completed !== undefined) {
      await db.prepare('UPDATE exams SET completed = ? WHERE id = ?')
        .bind(data.completed ? 1 : 0, id)
        .run();
    }
    
    return successResponse(null);
  } catch (error: any) {
    console.error('Error updating exam:', error);
    return errorResponse(error.message, 500);
  }
}
