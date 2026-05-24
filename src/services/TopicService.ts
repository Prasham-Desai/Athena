import { Database } from '../db/client';
import { Topic } from '../types';
import { generateId } from '../api/helpers';

export class TopicService {
  constructor(private db: Database) {}

  async create(data: { chapter_id: string; name: string; order_index: number }): Promise<Topic> {
    const id = generateId();
    await this.db.run(
      'INSERT INTO topics (id, chapter_id, name, order_index) VALUES (?, ?, ?, ?)',
      [id, data.chapter_id, data.name, data.order_index]
    );
    return this.db.get<Topic>('SELECT * FROM topics WHERE id = ?', [id]) as Promise<Topic>;
  }

  async update(id: string, data: Partial<Topic>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    if (data.order_index !== undefined) { updates.push('order_index = ?'); values.push(data.order_index); }

    if (updates.length === 0) return;

    values.push(id);
    await this.db.run(
      `UPDATE topics SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM topics WHERE id = ?', [id]);
  }

  async reorder(chapterId: string, orderedIds: string[]): Promise<void> {
    // Uses a batch transaction to update the order of multiple topics efficiently
    const statements = orderedIds.map((id, index) => {
      return this.db.prepare('UPDATE topics SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND chapter_id = ?').bind(index, id, chapterId);
    });
    
    if (statements.length > 0) {
      await this.db.batch(statements);
    }
  }
}
