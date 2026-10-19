const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('./backup/json/tasks.json', 'utf8'));

for (const t of tasks) {
  if (t.actual_minutes || t.completed || t.completed_at || t.updated_at !== t.created_at) {
    console.log(JSON.stringify(t, null, 2));
  }
}
