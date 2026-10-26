const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath1 = path.join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', '93159a21eb7f4502edc7b08e3f622cba1df74033b0587ffada7687725f0f3e4c.sqlite');
const dbPath2 = path.join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject', 'ce6814ed618c047e3390cf237379e7e0022b5b51ee3e469f8bec69c930f6aab5.sqlite');

for (const p of [dbPath1, dbPath2]) {
  try {
    const db = new DatabaseSync(p);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log(`=== DB: ${p} ===`);
    console.log('Tables:', tables);
    if (tables.includes('subjects')) {
      const subjects = db.prepare('SELECT id, name, academic_year_id FROM subjects').all();
      console.log('Subjects:', subjects);
    }
    if (tables.includes('topics')) {
      const counts = db.prepare('SELECT status, count(*) as cnt FROM topics GROUP BY status').all();
      console.log('Topics status counts:', counts);
      const subProg = db.prepare(`
        SELECT s.name, s.academic_year_id,
          COUNT(t.id) as total,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN t.status = 'revised' THEN 1 ELSE 0 END) as revised,
          SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN t.status = 'not-started' THEN 1 ELSE 0 END) as not_started
        FROM subjects s
        LEFT JOIN chapters c ON c.subject_id = s.id
        LEFT JOIN topics t ON t.chapter_id = c.id
        GROUP BY s.id
      `).all();
      console.log('Progress per subject:', subProg);
    }
    if (tables.includes('study_sessions')) {
      const sess = db.prepare('SELECT * FROM study_sessions').all();
      console.log('Study sessions count:', sess.length);
      if (sess.length > 0) console.log('Sample session:', sess[0]);
    }
    if (tables.includes('daily_progress')) {
      const prog = db.prepare('SELECT * FROM daily_progress ORDER BY date ASC').all();
      console.log('Daily progress records count:', prog.length);
      console.log('Daily progress dates:', prog.map(p => `${p.date}: ${p.study_minutes}m, top:${p.topics_completed}, rev:${p.revisions_completed}`));
    }
    if (tables.includes('activities')) {
      const act = db.prepare('SELECT type, date(timestamp) as dt, count(*) as cnt FROM activities GROUP BY type, dt').all();
      console.log('Activities count by type & date:', act);
    }
  } catch (err) {
    console.log('Error reading', p, err.message);
  }
}
