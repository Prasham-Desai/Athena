import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);

    const stories = await db.query(
      `SELECT * FROM stories ORDER BY created_at DESC`
    );
    
    // Fetch all audios for these stories
    const storyAudios = await db.query(
      `SELECT * FROM story_audios ORDER BY sequence_index ASC`
    );

    // Group audios by story_id
    const audiosByStoryId = storyAudios.reduce((acc: any, audio: any) => {
      if (!acc[audio.story_id]) {
        acc[audio.story_id] = [];
      }
      acc[audio.story_id].push(audio);
      return acc;
    }, {});

    // Attach audios to each story
    const storiesWithAudios = stories.map((story: any) => ({
      ...story,
      audios: audiosByStoryId[story.id] || [],
    }));

    return successResponse(storiesWithAudios);
  } catch (err: any) {
    console.error('GET /api/stories ERROR:', err);
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();

    const { title, description, type } = body;

    if (!title) {
      return errorResponse('title is required', 400);
    }

    const now = new Date().toISOString();
    const id = generateId();
    const storyType = type || 'story';

    await db.run(
      `INSERT INTO stories (id, title, description, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, description || null, storyType, now, now]
    );

    const created = await db.get('SELECT * FROM stories WHERE id = ?', [id]);
    return successResponse(created, 201);
  } catch (err: any) {
    console.error('POST /api/stories ERROR:', err);
    return errorResponse(err.message, 500);
  }
}
