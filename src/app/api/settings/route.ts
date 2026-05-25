import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

async function ensureSettingsTable(db: Database) {
  await db.run(
    `CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY DEFAULT 'global',
      theme TEXT DEFAULT 'dark',
      daily_study_goal_hours INTEGER DEFAULT 6,
      show_welcome BOOLEAN DEFAULT TRUE,
      pomodoro_minutes INTEGER DEFAULT 25,
      break_minutes INTEGER DEFAULT 5,
      font_size TEXT DEFAULT 'small',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await db.run(`INSERT OR IGNORE INTO user_settings (id) VALUES ('global')`);
}

function camelToSnake(obj: any) {
  if (!obj) return obj;
  return {
    theme: obj.theme,
    daily_study_goal_hours: obj.dailyStudyGoalHours,
    show_welcome: obj.showWelcome,
    pomodoro_minutes: obj.pomodoroMinutes,
    break_minutes: obj.breakMinutes,
    font_size: obj.fontSize,
  };
}

function snakeToCamel(obj: any) {
  if (!obj) return obj;
  return {
    theme: obj.theme,
    dailyStudyGoalHours: obj.daily_study_goal_hours,
    showWelcome: Boolean(obj.show_welcome),
    pomodoroMinutes: obj.pomodoro_minutes,
    breakMinutes: obj.break_minutes,
    fontSize: obj.font_size,
  };
}

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    await ensureSettingsTable(db);
    let settings = await db.get('SELECT * FROM user_settings WHERE id = ?', ['global']);
    
    if (!settings) {
      // Return defaults if not found
      settings = {
        theme: 'dark',
        daily_study_goal_hours: 6,
        show_welcome: 1,
        pomodoro_minutes: 25,
        break_minutes: 5,
        font_size: 'small',
      };
    }
    return successResponse(snakeToCamel(settings), 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request);
    const db = new Database(env.DB);
    await ensureSettingsTable(db);
    const body: any = await request.json();
    const mapped = camelToSnake(body);
    
    const exists = await db.get('SELECT id FROM user_settings WHERE id = ?', ['global']);
    
    if (exists) {
      await db.run(
        `UPDATE user_settings SET 
          theme = COALESCE(?, theme),
          daily_study_goal_hours = COALESCE(?, daily_study_goal_hours),
          show_welcome = COALESCE(?, show_welcome),
          pomodoro_minutes = COALESCE(?, pomodoro_minutes),
          break_minutes = COALESCE(?, break_minutes),
          font_size = COALESCE(?, font_size),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          mapped.theme,
          mapped.daily_study_goal_hours,
          mapped.show_welcome,
          mapped.pomodoro_minutes,
          mapped.break_minutes,
          mapped.font_size,
          'global'
        ]
      );
    } else {
      await db.run(
        `INSERT INTO user_settings (id, theme, daily_study_goal_hours, show_welcome, pomodoro_minutes, break_minutes, font_size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'global',
          mapped.theme ?? 'dark',
          mapped.daily_study_goal_hours ?? 6,
          mapped.show_welcome ?? 1,
          mapped.pomodoro_minutes ?? 25,
          mapped.break_minutes ?? 5,
          mapped.font_size ?? 'small'
        ]
      );
    }
    
    const updated = await db.get('SELECT * FROM user_settings WHERE id = ?', ['global']);
    return successResponse(snakeToCamel(updated), 200);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
