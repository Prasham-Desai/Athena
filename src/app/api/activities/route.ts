import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    
    // 1. Fetch raw activities for custom events (milestone, subject-added, etc.)
    // We MUST fetch topic-revised from here because topics table only stores the LAST revision, not the history.
    const legacyActivities = await db.query("SELECT * FROM activities WHERE type NOT IN ('topic-completed', 'task-completed', 'study-block-completed')");

    
    // 2. Fetch Tasks
    const completedTasks = await db.query("SELECT id, title, completed_at FROM tasks WHERE (completed = 1 OR completed = '1' OR completed = 'true') AND completed_at IS NOT NULL");
    
    // 3. Fetch Topics (completed and revised)
    const topics = await db.query('SELECT id, name, status, completed_at, last_revised, revision_count FROM topics WHERE (status IN ("completed", "revised") AND completed_at IS NOT NULL) OR (revision_count > 0 AND last_revised IS NOT NULL)');
    
    // 4. Fetch Study Sessions
    const sessions = await db.query('SELECT id, title, duration_minutes, end_time FROM study_sessions');

    let allActivities: any[] = [...legacyActivities];

    // Map tasks
    completedTasks.forEach((task: any) => {
      allActivities.push({
        id: `task-${task.id}`,
        type: 'task-completed',
        description: `Completed task: ${task.title}`,
        timestamp: task.completed_at,
        color: '#6366f1'
      });
    });

    // Map topics (completed)
    topics.forEach((topic: any) => {
      if (topic.completed_at) {
        allActivities.push({
          id: `topic-comp-${topic.id}`,
          type: 'topic-completed',
          description: `Completed topic: ${topic.name}`,
          timestamp: topic.completed_at,
          color: '#22c55e'
        });
      }
    });

    // Map study sessions
    sessions.forEach((session: any) => {
      if (session.end_time) {
        const titlePart = session.title ? ` (${session.title})` : '';
        allActivities.push({
          id: `session-${session.id}`,
          type: 'study-block-completed',
          description: `Studied for ${session.duration_minutes}m${titlePart}`,
          timestamp: session.end_time,
          color: '#f59e0b'
        });
      }
    });

    // Sort descending by timestamp
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Deduplicate any accidental overlapping IDs or exact duplicate descriptions at the exact same timestamp (rare but possible if legacy DB was dirty)
    const uniqueActivities = [];
    const seen = new Set();
    for (const act of allActivities) {
      const key = `${act.type}-${act.timestamp}-${act.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueActivities.push(act);
      }
    }

    // Limit to 100
    const finalActivities = uniqueActivities.slice(0, 100);

    return successResponse(finalActivities, 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    const body: any = await request.json();
    
    if (!body.type || !body.description || !body.timestamp) {
      return errorResponse('type, description, and timestamp are required', 400);
    }
    
    const id = body.id || generateId();
    
    await db.run(
      `INSERT INTO activities (id, type, description, timestamp, subject_id, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, body.type, body.description, body.timestamp, body.subjectId, body.color]
    );
    
    const activity = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
    
    // Also prune old activities to keep under 100
    await db.run(`
      DELETE FROM activities WHERE id NOT IN (
        SELECT id FROM activities ORDER BY timestamp DESC LIMIT 100
      )
    `);

    return successResponse(activity, 201);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
