import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    
    const body: any = await request.json().catch(() => ({}));
    const academicYearId = body.academicYearId || body.academic_year_id;
    
    if (academicYearId) {
      await db.run(`
        UPDATE topics SET revision_count = 0 
        WHERE chapter_id IN (
          SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE academic_year_id = ?
          )
        )
      `, [academicYearId]);
      await db.run(`
        UPDATE subtopics SET revision_count = 0 
        WHERE topic_id IN (
          SELECT id FROM topics WHERE chapter_id IN (
            SELECT id FROM chapters WHERE subject_id IN (
              SELECT id FROM subjects WHERE academic_year_id = ?
            )
          )
        )
      `, [academicYearId]);
    } else {
      await db.run('UPDATE topics SET revision_count = 0');
      await db.run('UPDATE subtopics SET revision_count = 0');
    }
    
    return successResponse({ reset: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
