import { getCloudflareContext } from '@opennextjs/cloudflare';

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
  try {
    // OpenNext securely exposes the Cloudflare bindings here
    const { env } = getCloudflareContext();
    if (env && env.DB) return env;
  } catch (err) {
    // Fallback if not available
  }
  return process.env as any;
}
