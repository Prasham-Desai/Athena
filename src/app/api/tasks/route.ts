import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { generateId } from '@/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);

    // 1. One-time migration for currently completed tasks (completed before this feature was implemented).
    // Set their completed_at to NOW so they are deleted exactly 48 hours from today.
    await db.run(
      `UPDATE tasks 
       SET completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') 
       WHERE completed = 1 
       AND (completed_at IS NULL OR datetime(completed_at) < datetime('2026-06-01'))`
    );

    // 2. Auto-delete tasks that were completed more than 48 hours ago
    await db.run(
      `DELETE FROM tasks 
       WHERE completed = 1 
       AND completed_at IS NOT NULL 
       AND datetime(completed_at) <= datetime('now', '-48 hours')`
    );

    const rows = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    const tasks = (rows as any[]).map(row => ({
      ...row,
      dueDate: undefined, // remove legacy
      date: row.date || row.due_date,
      estimatedMinutes: row.estimated_minutes,
      actualMinutes: row.actual_minutes,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      createdAt: row.created_at,
    }));
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
      'INSERT INTO tasks (id, title, category, priority, date, estimated_minutes, actual_minutes, completed, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, 
        body.title, 
        body.category, 
        body.priority, 
        body.date || null,
        body.estimatedMinutes || null,
        body.actualMinutes || null,
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
