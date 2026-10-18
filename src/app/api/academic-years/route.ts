import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const years = await db.query('SELECT * FROM academic_years ORDER BY order_index ASC');
    return successResponse(years);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
