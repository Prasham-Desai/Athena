import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import type { Exam } from '@/types';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = env.DB;
    const { results } = await db.prepare('SELECT * FROM exams ORDER BY date ASC').all();
    
    const exams = results.map((row: any) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      date: row.date,
      subjectIds: JSON.parse(row.subject_ids as string),
      completed: row.completed === 1,
      createdAt: row.created_at,
    }));
    
    return successResponse(exams);
  } catch (error: any) {
    console.error('Error fetching exams:', error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: any = await request.json();
    const env = getEnv(request);
    const db = env.DB;
    
    const id = generateId();
    const title = data.title;
    const type = data.type;
    const date = data.date;
    const subjectIds = JSON.stringify(data.subjectIds || []);
    
    await db.prepare(
      'INSERT INTO exams (id, title, type, date, subject_ids, completed) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, title, type, date, subjectIds, 0).run();
    
    const newExam = {
      id,
      title,
      type,
      date,
      subjectIds: data.subjectIds || [],
      completed: false,
    };
    
    return successResponse(newExam);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return errorResponse(error.message, 500);
  }
}
