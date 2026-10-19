const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('./backup/json/tasks.json', 'utf8'));

console.log('Total tasks:', tasks.length);
tasks.forEach((t, i) => {
  const flags = [];
  if (t.completed) flags.push(`completed=${t.completed}`);
  if (t.completed_at) flags.push(`completed_at=${t.completed_at}`);
  if (t.actual_minutes) flags.push(`actual_mins=${t.actual_minutes}`);
  if (t.updated_at !== t.created_at) flags.push(`updated!`);
  console.log(`[${i}] ${t.id} "${t.title}" (${t.date || t.due_date}) ${flags.join(', ')}`);
});
