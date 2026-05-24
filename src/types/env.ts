export interface D1Database {
  prepare(query: string): any;
  batch(statements: any[]): Promise<any[]>;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface D1Result {
  success: boolean;
  meta: any;
  results?: any[];
}

export interface D1PreparedStatement {
  bind(...params: any[]): D1PreparedStatement;
  all<T = any>(): Promise<D1Result>;
  first<T = any>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
}
