import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const activities = await db.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 100');
    return successResponse(activities, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    if (!body.type || !body.description || !body.timestamp) {
      return errorResponse('type, description, and timestamp are required', 400);
    }
    
    const id = body.id || generateId();
    
    await db.run(
      `INSERT INTO activities (id, type, description, timestamp, subject_id, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, body.type, body.description, body.timestamp, body.subjectId, body.color]
    );
    
    const activity = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
    
    // Also prune old activities to keep under 100
    await db.run(`
      DELETE FROM activities WHERE id NOT IN (
        SELECT id FROM activities ORDER BY timestamp DESC LIMIT 100
      )
    `);

    return successResponse(activity, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
