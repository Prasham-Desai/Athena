const { execSync } = require('child_process');

const out = execSync('npx wrangler d1 execute athena-db --remote --command "SELECT count(id) as total, min(date) as min_date, max(date) as max_date, count(distinct strftime(\'%Y\', date)) as num_years FROM study_sessions;" --json').toString();
const jsonStart = out.indexOf('[');
const rows = JSON.parse(out.substring(jsonStart))[0].results;
console.log('All study sessions in DB:', rows);

const out2 = execSync('npx wrangler d1 execute athena-db --remote --command "SELECT distinct strftime(\'%Y\', date) as yr, count(id) as session_count, sum(duration_minutes) as total_mins FROM study_sessions GROUP BY yr ORDER BY yr DESC;" --json').toString();
const jsonStart2 = out2.indexOf('[');
const rows2 = JSON.parse(out2.substring(jsonStart2))[0].results;
console.log('Sessions by calendar year:', rows2);
