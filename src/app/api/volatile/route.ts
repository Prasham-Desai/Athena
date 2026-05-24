import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { KVService } from '@/kv';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    if (!env.KV) return errorResponse('KV binding not found', 500);

    const kvService = new KVService(env.KV);
    
    // Example: Fetch active session state
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    
    if (!key) return errorResponse('Key query parameter is required', 400);

    const value = await kvService.get(key);
    return successResponse({ key, value });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const kvService = new KVService(env.KV);
    const body = await request.json();
    
    const { key, value, ttl } = body;
    if (!key || value === undefined) return errorResponse('Key and value are required', 400);
    
    await kvService.set(key, value, ttl);
    return successResponse({ key, saved: true, ttl: ttl || null });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const env = getEnv(request);
    const kvService = new KVService(env.KV);
    
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    if (!key) return errorResponse('Key query parameter is required', 400);

    await kvService.delete(key);
    return successResponse({ key, deleted: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
