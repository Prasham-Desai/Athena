import * as fs from 'fs';
import * as path from 'path';

const contentDir = path.join(__dirname, 'src/lib/content');
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

let sql = '';
sql += 'DELETE FROM subtopics;\n';
sql += 'DELETE FROM topics;\n';
sql += 'DELETE FROM chapters;\n';
sql += 'DELETE FROM subjects;\n\n';

const SUBJECT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
];

const SUBJECT_ICONS = [
  'BookOpen', 'Calculator', 'Atom', 'Globe', 'Code', 'Palette',
  'Music', 'FlaskConical', 'Scale', 'Languages', 'Brain', 'Lightbulb',
  'GraduationCap', 'Microscope', 'Compass', 'PenTool',
];

let colorIndex = 0;
let iconIndex = 0;

function generateId() {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function escapeSql(str: string) {
  return str.replace(/'/g, "''");
}

for (const file of files) {
  const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
  const lines = content.split('\n');

  let subjectId = '';
  let currentPaper = 'Paper 1';
  let chapterId = '';
  let topicId = '';
  let topicOrder = 0;
  let chapterOrder = 0;
  
  let currentTopicName = '';
  let currentTopicImportance: string | null = null;
  let currentTopicNotes = '';

  const subjectName = file.replace('.md', '');
  subjectId = generateId();
  const color = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
  const icon = SUBJECT_ICONS[iconIndex % SUBJECT_ICONS.length];
  colorIndex++;
  iconIndex++;

  sql += `INSERT INTO subjects (id, name, color, icon, details) VALUES ('${subjectId}', '${escapeSql(subjectName)}', '${color}', '${icon}', '{}');\n`;
  chapterOrder = 0;

  function flushTopic() {
    if (topicId) {
      sql += `INSERT INTO topics (id, chapter_id, name, order_index, status, revision_count, importance, notes) VALUES ('${topicId}', '${chapterId}', '${escapeSql(currentTopicName)}', ${topicOrder - 1}, 'not-started', 0, ${currentTopicImportance ? `'${escapeSql(currentTopicImportance)}'` : 'NULL'}, '${escapeSql(currentTopicNotes)}');\n`;
    }
    topicId = '';
    currentTopicName = '';
    currentTopicImportance = null;
    currentTopicNotes = '';
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      continue;
    }
    else if (trimmed.startsWith('## ')) {
      flushTopic();
      currentPaper = trimmed.replace('## ', '').trim();
    }
    else if (trimmed.startsWith('### ')) {
      flushTopic();
      let chapterName = trimmed.replace('### ', '').trim();
      chapterName = chapterName.replace(/^[0-9]+\.\s*/, '').replace(/^Topic\s+[0-9]+:?\s*/i, '');
      chapterId = generateId();

      sql += `INSERT INTO chapters (id, subject_id, name, order_index, paper) VALUES ('${chapterId}', '${subjectId}', 'Topic ${chapterOrder + 1}: ${escapeSql(chapterName)}', ${chapterOrder}, '${escapeSql(currentPaper)}');\n`;
      chapterOrder++;
      topicOrder = 0;
    }
    else if (/^[0-9]+\.\s/.test(trimmed)) {
      flushTopic();
      if (!chapterId) continue;
      
      let topicStr = trimmed.replace(/^[0-9]+\.\s*/, '').trim();
      
      const match = topicStr.match(/(?:— |-\s*)?Importance:\s*(.*)$/i);
      if (match) {
        currentTopicImportance = match[1].trim();
        topicStr = topicStr.replace(/(?:— |-\s*)?Importance:\s*(.*)$/i, '').trim();
      }

      topicId = generateId();
      currentTopicName = topicStr;
      topicOrder++;
    }
    else if (trimmed.startsWith('* ')) {
      if (topicId) {
        if (currentTopicNotes) currentTopicNotes += '\n';
        currentTopicNotes += trimmed;
      }
    }
    else if (trimmed.match(/\*\*Importance:\*\*\s*(.*)$/i) || trimmed.match(/Importance:\s*(.*)$/i)) {
      if (topicId) {
        const match = trimmed.match(/(?:\*\*Importance:\*\*|Importance:)\s*(.*)$/i);
        if (match) {
           currentTopicImportance = match[1].trim();
        }
      }
    }
  }
  flushTopic();
}

fs.writeFileSync(path.join(__dirname, 'seed-new.sql'), sql);
console.log('Generated seed-new.sql successfully.');
