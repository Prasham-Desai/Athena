const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('./backup/athena_full_backup.json', 'utf8'));

console.log('--- Tasks in athena_full_backup.json ---');
const sampleTasks = backup.tasks.slice(0, 5);
console.log('Sample task fields:', Object.keys(sampleTasks[0]));
console.log('Sample task 0:', sampleTasks[0]);

// Check any completed in backup.tasks
const completedInTasks = backup.tasks.filter(t => t.completed == 1 || t.completed === true || t.completed_at);
console.log('Completed in tasks:', completedInTasks.length);

// What about study_sessions that reference tasks?
const taskSessions = backup.study_sessions.filter(s => s.task_id || s.type === 'task');
console.log('Task sessions in study_sessions:', taskSessions.length);
taskSessions.forEach(s => {
  console.log(`Session ${s.id}: date=${s.date}, task_id=${s.task_id}, title=${s.title}, duration=${s.duration_minutes}`);
});

// What about activities?
const taskActivities = backup.activities.filter(a => a.type && a.type.includes('task'));
console.log('Task activities in activities:', taskActivities.length);
taskActivities.forEach(a => console.log(a));
