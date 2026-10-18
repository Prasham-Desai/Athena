import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import type { Exam } from '@/types';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = env.DB;
    const academicYearId = request.nextUrl.searchParams.get('academic_year_id');
    const statement = academicYearId
      ? db.prepare('SELECT * FROM exams WHERE academic_year_id = ? ORDER BY date ASC').bind(academicYearId)
      : db.prepare('SELECT * FROM exams ORDER BY date ASC');
    const { results } = await statement.all();
    
    const exams = results.map((row: any) => ({
      id: row.id,
      academicYearId: row.academic_year_id,
      academic_year_id: row.academic_year_id,
      title: row.title,
      type: row.type,
      date: row.date,
      subjects: JSON.parse(row.subject_ids as string),
      completed: row.completed === 1,
      createdAt: row.created_at,
      topics_description: row.topics_description,
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
    const env = await getEnv(request);
    const db = env.DB;
    
    const id = generateId();
    const academicYearId = data.academicYearId || data.academic_year_id || 'year_3';
    const title = data.title;
    const type = data.type;
    const date = data.date;
    const subjectsStr = JSON.stringify(data.subjects || []);
    const topicsDescription = data.topics_description || null;
    
    await db.prepare(
      'INSERT INTO exams (id, title, type, date, subject_ids, completed, topics_description, academic_year_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, type, date, subjectsStr, 0, topicsDescription, academicYearId).run();
    
    const newExam = {
      id,
      academicYearId,
      academic_year_id: academicYearId,
      title,
      type,
      date,
      subjects: data.subjects || [],
      completed: false,
      topics_description: topicsDescription,
    };
    
    return successResponse(newExam);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return errorResponse(error.message, 500);
  }
}
