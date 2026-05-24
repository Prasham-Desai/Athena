import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { generateId } from '@/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const tasks = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return successResponse(tasks);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    // Fallback to auto-generating an ID if the frontend doesn't provide one
    const id = body.id || generateId();
    
    await db.run(
      'INSERT INTO tasks (id, title, category, priority, due_date, completed, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        body.title, 
        body.category, 
        body.priority, 
        body.dueDate || null, 
        body.completed ? 1 : 0, 
        body.completedAt || null,
        body.createdAt || new Date().toISOString()
      ]
    );
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    return successResponse(task, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
