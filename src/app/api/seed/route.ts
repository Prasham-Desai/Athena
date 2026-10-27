import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';
import { INITIAL_SUBJECTS } from '@/lib/curriculum-data';

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    const db = new Database(env.DB);
    
    // Seed Second Year idempotently without removing either year's existing data or progress.
    for (const subject of INITIAL_SUBJECTS) {
      await db.run(
        `INSERT INTO subjects (id, name, color, icon, details, academic_year_id) VALUES (?, ?, ?, ?, ?, 'year_2')
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color, icon=excluded.icon,
           details=excluded.details, academic_year_id='year_2'`,
        [subject.id, subject.name, subject.color, subject.icon, JSON.stringify(subject.details || {})]
      );

      for (const chapter of subject.chapters) {
        await db.run(
          `INSERT INTO chapters (id, subject_id, name, order_index, paper, tag, estimated_marks) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id, name=excluded.name,
             order_index=excluded.order_index, paper=excluded.paper, tag=excluded.tag, estimated_marks=excluded.estimated_marks`,
          [chapter.id, subject.id, chapter.name, chapter.order, chapter.paper || 'Paper 1', chapter.tag || null, chapter.estimatedMarks || null]
        );

        for (const topic of chapter.topics) {
          await db.run(
            `INSERT INTO topics (id, chapter_id, name, status, order_index, revision_count, last_revised, next_revision_due, completed_at, notes, importance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET chapter_id=excluded.chapter_id, name=excluded.name, order_index=excluded.order_index,
               notes=excluded.notes, importance=excluded.importance`,
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
              topic.notes || null,
              topic.importance || 'Not Specified'
            ]
          );

          for (const [index, subtopic] of (topic.subtopics || []).entries()) {
            await db.run(
              `INSERT INTO subtopics (id, topic_id, name, content, status, order_index, importance)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET topic_id=excluded.topic_id, name=excluded.name,
                 content=excluded.content, order_index=excluded.order_index, importance=excluded.importance`,
              [
                subtopic.id || `${topic.id}:subtopic:${index}`,
                topic.id,
                subtopic.name,
                subtopic.content || '',
                subtopic.status || 'not-started',
                subtopic.order_index ?? index,
                subtopic.importance || topic.importance || 'Not Specified',
              ]
            );
          }
        }
      }
    }

    return successResponse({ seeded: true, message: "Database seeded successfully" }, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
