// Helper function to generate unique IDs
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Standard API Response format
 */
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400) {
  return Response.json({ success: false, error }, { status });
}

/**
 * Safely extracts environment variables in Next.js Cloudflare contexts
 */
export function getEnv(request: Request): any {
  // @opennextjs/cloudflare usually makes env available globally on process.env
  // Or via context. Here we fallback safely.
  return process.env as any;
}
