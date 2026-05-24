import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { TopicService } from '@/services/TopicService';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new TopicService(db);
    const body: any = await request.json();
    
    if (!body.chapter_id || !body.name || body.order_index === undefined) {
      return errorResponse('chapter_id, name, and order_index are required', 400);
    }
    
    const topic = await service.create(body);
    return successResponse(topic, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
