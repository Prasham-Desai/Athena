const { execSync } = require('child_process');

function run(sql) {
  const out = execSync(`npx wrangler d1 execute athena-db --remote --command "${sql.replace(/"/g, '\\"')}" --json`).toString();
  const jsonStart = out.indexOf('[');
  return JSON.parse(out.substring(jsonStart))[0].results;
}

console.log('--- Topic statuses: ---');
console.log(run('SELECT status, count(id) as count FROM topics GROUP BY status;'));

console.log('--- Subjects and topics: ---');
console.log(run(`
  SELECT subjects.id, subjects.name, subjects.academic_year_id,
         count(topics.id) as total_topics,
         sum(CASE WHEN topics.status IN ('completed', 'revised') THEN 1 ELSE 0 END) as completed_topics
  FROM subjects
  LEFT JOIN chapters ON chapters.subject_id = subjects.id
  LEFT JOIN topics ON topics.chapter_id = chapters.id
  GROUP BY subjects.id;
`));

console.log('--- Daily progress / logs sample: ---');
console.log(run('SELECT * FROM daily_progress LIMIT 5;'));

console.log('--- Study sessions sample: ---');
console.log(run('SELECT count(id) as total_sessions, min(date) as min_date, max(date) as max_date FROM study_sessions;'));
