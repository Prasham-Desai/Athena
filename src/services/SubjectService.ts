import { Database } from '../db/client';
import { Subject, ChapterWithTopics } from '../types';
import { generateId } from '../api/helpers';

export class SubjectService {
  constructor(private db: Database) {}

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
   * This handles joining all the data efficiently.
   */
  async getFullHierarchy(subjectId: string) {
    // We fetch flat rows and construct the hierarchy in JS to avoid complex json_group_array SQLite limits
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

    const topicIds = topics.map(t => t.id);
    let subtopics: any[] = [];
    
    if (topicIds.length > 0) {
      const topicPlaceholders = topicIds.map(() => '?').join(',');
      subtopics = await this.db.query<any>(
        `SELECT * FROM subtopics WHERE topic_id IN (${topicPlaceholders}) ORDER BY order_index ASC`,
        topicIds
      );
    }

    // Reconstruct hierarchy
    return chapters.map(chapter => {
      const chapterTopics = topics.filter(t => t.chapter_id === chapter.id);
      return {
        ...chapter,
        topics: chapterTopics.map(topic => ({
          ...topic,
          subtopics: subtopics.filter(s => s.topic_id === topic.id)
        }))
      };
    });
  }
}
