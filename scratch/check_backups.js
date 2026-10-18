const fs = require('fs');

function inspectBackup(path) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  console.log(`=== ${path} ===`);
  const lines = content.split('\n');
  const tableSet = new Set();
  lines.forEach(l => {
    const m = l.match(/INSERT INTO [`"']?([a-zA-Z0-9_]+)[`"']?/i);
    if (m) tableSet.add(m[1]);
  });
  console.log('Tables:', Array.from(tableSet));
}

inspectBackup('./backup/remote_backup_before_0015.sql');
inspectBackup('./backup/athena_full_backup.sql');

if (fs.existsSync('./backup/athena_full_backup.json')) {
  try {
    const json = JSON.parse(fs.readFileSync('./backup/athena_full_backup.json', 'utf8'));
    console.log('Keys in athena_full_backup.json:', Object.keys(json));
    if (json.tasks) {
      console.log('Total tasks in full backup:', json.tasks.length);
      const completed = json.tasks.filter(t => t.completed || t.is_completed || t.status === 'completed');
      console.log('Completed tasks in full backup:', completed.length);
      console.log('Sample completed:', completed.slice(0, 5));
    }
  } catch (e) {
    console.error('Error reading athena_full_backup.json:', e);
  }
}
