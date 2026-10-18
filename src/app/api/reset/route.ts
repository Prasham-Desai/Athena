import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);

    const body: any = await request.json().catch(() => ({}));
    const academicYearId = body.academicYearId || body.academic_year_id;

    if (academicYearId) {
      await db.run('DELETE FROM study_sessions WHERE academic_year_id = ?', [academicYearId]);
      await db.run('DELETE FROM daily_progress WHERE academic_year_id = ?', [academicYearId]);
      await db.run('DELETE FROM study_blocks WHERE academic_year_id = ?', [academicYearId]);
      await db.run('DELETE FROM activities WHERE academic_year_id = ?', [academicYearId]);
      await db.run('DELETE FROM tasks WHERE academic_year_id = ?', [academicYearId]);
      await db.run('DELETE FROM exams WHERE academic_year_id = ?', [academicYearId]);
      await db.run(`
        DELETE FROM subtopics WHERE topic_id IN (
          SELECT id FROM topics WHERE chapter_id IN (
            SELECT id FROM chapters WHERE subject_id IN (
              SELECT id FROM subjects WHERE academic_year_id = ?
            )
          )
        )
      `, [academicYearId]);
      await db.run(`
        DELETE FROM topics WHERE chapter_id IN (
          SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE academic_year_id = ?
          )
        )
      `, [academicYearId]);
      await db.run(`
        DELETE FROM chapters WHERE subject_id IN (
          SELECT id FROM subjects WHERE academic_year_id = ?
        )
      `, [academicYearId]);
      await db.run('DELETE FROM subjects WHERE academic_year_id = ?', [academicYearId]);
    } else {
      await db.run('DELETE FROM study_sessions');
      await db.run('DELETE FROM daily_progress');
      await db.run('DELETE FROM study_blocks');
      await db.run('DELETE FROM activities');
      await db.run('DELETE FROM tasks');
      await db.run('DELETE FROM subtopics');
      await db.run('DELETE FROM topics');
      await db.run('DELETE FROM chapters');
      await db.run('DELETE FROM subjects');
      await db.run('DELETE FROM exams');
    }

    return successResponse({ reset: true }, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}