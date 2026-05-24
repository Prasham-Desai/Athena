import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { INITIAL_SUBJECTS } from '@/lib/curriculum-data';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    // Clear existing data
    await db.run('DELETE FROM subjects');
    await db.run('DELETE FROM chapters');
    await db.run('DELETE FROM topics');
    await db.run('DELETE FROM subtopics');

    // Seed data
    for (const subject of INITIAL_SUBJECTS) {
      await db.run(
        'INSERT INTO subjects (id, name, color, icon) VALUES (?, ?, ?, ?)',
        [subject.id, subject.name, subject.color, subject.icon]
      );

      for (const chapter of subject.chapters) {
        await db.run(
          'INSERT INTO chapters (id, subject_id, name, order_index, paper, tag, estimated_marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [chapter.id, subject.id, chapter.name, chapter.order, chapter.paper || 'Paper 1', chapter.tag || null, chapter.estimatedMarks || null]
        );

        for (const topic of chapter.topics) {
          await db.run(
            'INSERT INTO topics (id, chapter_id, name, status, order_index, revision_count, last_revised, next_revision_due, completed_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              topic.id, 
              chapter.id, 
              topic.name, 
              topic.status || 'not-started', 
              topic.order, 
              topic.revisionCount || 0,
              topic.lastRevised || null,
              topic.nextRevisionDue || null,
              topic.completedAt || null,
              topic.notes || null
            ]
          );
        }
      }
    }

    return successResponse({ seeded: true, message: "Database seeded successfully" }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
