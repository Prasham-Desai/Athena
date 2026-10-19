const { execSync } = require('child_process');

function d1(sql) {
  const cmd = `npx wrangler d1 execute athena-db --remote --command "${sql.replace(/"/g, '\\"')}" --json`;
  const out = execSync(cmd).toString();
  const jsonStart = out.indexOf('[');
  return JSON.parse(out.substring(jsonStart))[0].results;
}

console.log('--- Checking activities table for task ---');
const activities = d1("SELECT * FROM activities WHERE type LIKE '%task%' OR description LIKE '%task%' OR description LIKE '%Task%' LIMIT 50;");
console.log('Activities matching task:', activities);

console.log('--- Checking study_sessions for type=task or task_id ---');
const sessions = d1("SELECT * FROM study_sessions WHERE task_id IS NOT NULL OR type = 'task';");
console.log('Study sessions with task:', sessions.length, sessions.map(s => ({ id: s.id, date: s.date, title: s.title, task_id: s.task_id })));

console.log('--- Checking tasks table summary ---');
const tasks = d1("SELECT count(*) as total, sum(completed) as completed_count FROM tasks WHERE academic_year_id = 'year_2';");
console.log('Year 2 tasks summary:', tasks);
