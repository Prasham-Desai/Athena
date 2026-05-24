import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { TopicService } from '@/services/TopicService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const service = new TopicService(db);
    const body: any = await request.json();
    
    // Accept both 'order' (frontend) and 'order_index' (DB convention)
    const orderIndex = body.order_index ?? body.order ?? 0;
    
    if (!body.chapter_id || !body.name) {
      return errorResponse('chapter_id and name are required', 400);
    }
    
    const topic = await service.create({
      chapter_id: body.chapter_id,
      name: body.name,
      order_index: orderIndex,
    });
    return successResponse(topic, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

