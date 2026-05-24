import { Database } from '../db/client';
import { Subject, ChapterWithTopics } from '../types';
import { generateId } from '../api/helpers';

/**
 * Maps a DB topic row (snake_case) to the frontend Topic shape (camelCase).
 */
function mapTopic(row: any) {
  return {
    id: row.id,
    chapter_id: row.chapter_id,
    name: row.name,
    status: row.status || 'not-started',
    revisionCount: row.revision_count ?? 0,
    lastRevised: row.last_revised ?? null,
    nextRevisionDue: row.next_revision_due ?? null,
    order: row.order_index ?? 0,
    notes: row.notes ?? '',
    completedAt: row.completed_at ?? null,
  };
}

/**
 * Maps a DB chapter row (snake_case) to the frontend Chapter shape (camelCase).
 */
function mapChapter(row: any, topics: any[]) {
  return {
    id: row.id,
    subject_id: row.subject_id,
    name: row.name,
    order: row.order_index ?? 0,
    tag: row.tag ?? null,
    estimatedMarks: row.estimated_marks ?? null,
    paper: row.paper ?? 'Paper 1',
    topics: topics.map(mapTopic),
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

    const subjectIds = subjects.map(s => s.id);
    const placeholders = subjectIds.map(() => '?').join(',');

    // Fetch ALL chapters for ALL subjects in one query
    const chapters = await this.db.query<any>(
      `SELECT * FROM chapters WHERE subject_id IN (${placeholders}) ORDER BY order_index ASC`,
      subjectIds
    );

    // Fetch ALL topics for ALL those chapters in one query
    let topics: any[] = [];
    if (chapters.length > 0) {
      const chapterIds = chapters.map(c => c.id);
      const chPlaceholders = chapterIds.map(() => '?').join(',');
      topics = await this.db.query<any>(
        `SELECT * FROM topics WHERE chapter_id IN (${chPlaceholders}) ORDER BY order_index ASC`,
        chapterIds
      );
    }

    // Reconstruct the full hierarchy with proper camelCase mapping
    return subjects.map(subject => {
      const subjectChapters = chapters.filter(c => c.subject_id === subject.id);
      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        icon: subject.icon,
        createdAt: subject.created_at,
        order: 0,
        chapters: subjectChapters.map(ch => {
          const chapterTopics = topics.filter(t => t.chapter_id === ch.id);
          return mapChapter(ch, chapterTopics);
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

    const chapterIds = chapters.map(c => c.id);
    const placeholders = chapterIds.map(() => '?').join(',');

    const topics = await this.db.query<any>(
      `SELECT * FROM topics WHERE chapter_id IN (${placeholders}) ORDER BY order_index ASC`,
      chapterIds
    );

    // Reconstruct hierarchy with camelCase mapping
    return chapters.map(chapter => {
      const chapterTopics = topics.filter(t => t.chapter_id === chapter.id);
      return mapChapter(chapter, chapterTopics);
    });
  }
}
