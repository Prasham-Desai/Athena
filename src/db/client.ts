export class Database {
  constructor(private db: D1Database) {}

  /**
   * Executes a query returning multiple rows
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const { results } = await this.db.prepare(sql).bind(...params).all<T>();
    return results || [];
  }

  /**
   * Executes a query returning a single row
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await this.db.prepare(sql).bind(...params).first<T>();
    return result || null;
  }

  /**
   * Executes a mutation (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = []): Promise<D1Result> {
    return await this.db.prepare(sql).bind(...params).run();
  }

  /**
   * Helper to perform a batch of mutations transactionally
   */
  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return await this.db.batch(statements);
  }

  /**
   * Expose raw prepare method for complex batching
   */
  prepare(sql: string) {
    return this.db.prepare(sql);
  }
}
