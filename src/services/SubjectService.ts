import { Database } from '../db/client';
import { Subject, ChapterWithTopics } from '../types';
import { generateId } from '../api/helpers';

/**
 * Maps a DB topic row (snake_case) to the frontend Topic shape (camelCase).
 */
function mapTopic(row: any, allSubtopics: any[] = []): any {
  const topicSubtopics = allSubtopics.filter(s => s.topic_id === row.id).map(s => ({
    id: s.id,
    topic_id: s.topic_id,
    name: s.name,
    content: s.content,
    order_index: s.order_index,
    created_at: s.created_at,
  }));

  return {
    id: row.id,
    chapter_id: row.chapter_id,
    name: row.name,
    status: row.status || 'not-started',
    order: row.order_index,
    revisionCount: row.revision_count || 0,
    lastRevised: row.last_revised,
    nextRevisionDue: row.next_revision_due,
    completedAt: row.completed_at,
    notes: row.notes || '',
    subtopics: topicSubtopics,
  };
}

/**
 * Maps a DB chapter row (snake_case) to the frontend Chapter shape (camelCase).
 */
function mapChapter(row: any, topicRows: any[], allSubtopics: any[] = []): any {
  return {
    id: row.id,
    subject_id: row.subject_id,
    name: row.name,
    order: row.order_index,
    paper: row.paper || 'Paper 1',
    tag: row.tag,
    estimatedMarks: row.estimated_marks,
    topics: topicRows.map(t => mapTopic(t, allSubtopics)),
  };
}

export class SubjectService {
  constructor(private db: Database) {}

  /**
   * Returns ALL subjects with their full nested hierarchy (chapters → topics).
   * This is the primary data source for the frontend store.
   */
  async getAllWithHierarchy(): Promise<any[]> {
    const subjects = await this.db.query<any>('SELECT * FROM subjects ORDER BY created_at DESC');
    if (!subjects.length) return [];

    // Fetch ALL chapters, topics, and subtopics directly to avoid SQLite's 100 variable limit in IN() clauses
    const chapters = await this.db.query<any>('SELECT * FROM chapters ORDER BY order_index ASC');
    const topics = await this.db.query<any>('SELECT * FROM topics ORDER BY order_index ASC');
    const subtopics = await this.db.query<any>('SELECT * FROM subtopics ORDER BY order_index ASC');

    // Reconstruct the full hierarchy with proper camelCase mapping
    return subjects.map(subject => {
      const subjectChapters = chapters.filter(c => c.subject_id === subject.id);
      let parsedDetails = {};
      try {
        parsedDetails = subject.details ? JSON.parse(subject.details) : {};
      } catch (e) {}

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        details: parsedDetails,
        createdAt: subject.created_at,
        order: 0,
        chapters: subjectChapters.map(ch => {
          const chapterTopics = topics.filter(t => t.chapter_id === ch.id);
          return mapChapter(ch, chapterTopics, subtopics);
        }),
      };
    });
  }

  async getAll(): Promise<Subject[]> {
    return this.db.query<Subject>('SELECT * FROM subjects ORDER BY created_at DESC');
  }

  async getById(id: string): Promise<Subject | null> {
    return this.db.get<Subject>('SELECT * FROM subjects WHERE id = ?', [id]);
  }

  async create(data: { name: string; color?: string; icon?: string }): Promise<Subject> {
    const id = generateId();
    await this.db.run(
      'INSERT INTO subjects (id, name, color, icon) VALUES (?, ?, ?, ?)',
      [id, data.name, data.color || null, data.icon || null]
    );
    const subject = await this.getById(id);
    if (!subject) throw new Error('Failed to create subject');
    return subject;
  }

  async update(id: string, data: Partial<Subject>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }

    if (updates.length === 0) return;

    values.push(id);
    await this.db.run(
      `UPDATE subjects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM subjects WHERE id = ?', [id]);
  }

  /**
   * Fetches a full nested subject hierarchy (Chapters -> Topics -> Subtopics)
   * for a single subject. Returns data with camelCase keys.
   */
  async getFullHierarchy(subjectId: string) {
    const chapters = await this.db.query<any>(
      'SELECT * FROM chapters WHERE subject_id = ? ORDER BY order_index ASC',
      [subjectId]
    );
    
    if (!chapters.length) return [];

    // To avoid D1's 100-variable limit for IN(), we fetch all and filter in JS
    const topics = await this.db.query<any>('SELECT * FROM topics ORDER BY order_index ASC');
    const subtopics = await this.db.query<any>('SELECT * FROM subtopics ORDER BY order_index ASC');

    // Reconstruct hierarchy with camelCase mapping
    return chapters.map(chapter => {
      const chapterTopics = topics.filter(t => t.chapter_id === chapter.id);
      return mapChapter(chapter, chapterTopics, subtopics);
    });
  }
}
