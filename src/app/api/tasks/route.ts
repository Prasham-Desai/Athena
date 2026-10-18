import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { generateId } from '@/api/helpers';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);



    const academicYearId = request.nextUrl.searchParams.get('academic_year_id');
    const rows = academicYearId
      ? await db.query('SELECT * FROM tasks WHERE academic_year_id = ? ORDER BY created_at DESC', [academicYearId])
      : await db.query('SELECT * FROM tasks ORDER BY created_at DESC');

    const tasks = (rows as any[]).map(row => ({
      ...row,
      dueDate: undefined, // remove legacy
      date: row.date || row.due_date,
      estimatedMinutes: row.estimated_minutes,
      actualMinutes: row.actual_minutes,
      completed: Boolean(row.completed),
      completedAt: row.completed_at,
      createdAt: row.created_at,
      academicYearId: row.academic_year_id,
      academic_year_id: row.academic_year_id,
    }));
    return successResponse(tasks);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    // Fallback to auto-generating an ID if the frontend doesn't provide one
    const id = body.id || generateId();
    const academicYearId = body.academicYearId || body.academic_year_id || 'year_3';
    
    await db.run(
      'INSERT INTO tasks (id, title, category, priority, date, estimated_minutes, actual_minutes, completed, completed_at, created_at, academic_year_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        body.createdAt || new Date().toISOString(),
        academicYearId
      ]
    );
    
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    return successResponse({
      ...task,
      academicYearId: task.academic_year_id,
      academic_year_id: task.academic_year_id
    }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
