const fs = require('fs');

const json = JSON.parse(fs.readFileSync('./backup/athena_full_backup.json', 'utf8'));
console.log('Activities count:', json.activities ? json.activities.length : 0);
if (json.activities && json.activities.length > 0) {
  console.log('Sample activity:', json.activities[0]);
  const completedActivities = json.activities.filter(a => a.completed || a.is_completed || a.status === 'completed');
  console.log('Completed activities count:', completedActivities.length);
  console.log('Completed activities:', completedActivities.map(a => ({ id: a.id, title: a.title, completed: a.completed, academic_year_id: a.academic_year_id })));
}

// Let's also check study_sessions
console.log('Study sessions count:', json.study_sessions ? json.study_sessions.length : 0);
const sessionsWithTaskId = json.study_sessions.filter(s => s.task_id);
console.log('Study sessions with task_id:', sessionsWithTaskId.length);
if (sessionsWithTaskId.length > 0) {
  console.log('Sample session with task_id:', sessionsWithTaskId[0]);
}

// What about study_blocks?
console.log('Study blocks count:', json.study_blocks ? json.study_blocks.length : 0);
if (json.study_blocks) {
  console.log('Sample study block:', json.study_blocks[0]);
}
