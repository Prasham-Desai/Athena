import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id, audioId } = await params;
    const env = getEnv(request);
    const db = new Database(env.DB);

    const existingAudio = await db.get<any>(
      'SELECT * FROM story_audios WHERE id = ? AND story_id = ?',
      [audioId, id]
    );
    
    if (!existingAudio) {
      return errorResponse('Audio not found', 404);
    }

    // Delete KV blob if exists
    if (existingAudio.kv_key) {
      await env.KV.delete(existingAudio.kv_key);
    }

    // Delete row
    await db.run('DELETE FROM story_audios WHERE id = ?', [audioId]);

    // Return the updated story
    const updatedStory = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    const storyAudios = await db.query(
      `SELECT * FROM story_audios WHERE story_id = ? ORDER BY sequence_index ASC`,
      [id]
    );

    return successResponse({
      ...updatedStory,
      audios: storyAudios || []
    });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
