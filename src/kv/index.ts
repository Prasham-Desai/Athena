import { CloudflareEnv } from '../types/env';

export class KVService {
  constructor(private kv: KVNamespace) {}

  /**
   * Retrieves a value from KV and attempts to parse it as JSON
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Sets a value in KV with an optional TTL (Time-To-Live) in seconds
   */
  async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // KV requires a minimum TTL of 60 seconds
    const options = ttlInSeconds && ttlInSeconds >= 60 
      ? { expirationTtl: ttlInSeconds } 
      : undefined;

    await this.kv.put(key, stringValue, options);
  }

  /**
   * Deletes a key from KV
   */
  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
