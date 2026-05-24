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
  let topicOrder = 0;
  let chapterOrder = 0;

  const subjectName = file.replace('.md', '');
  subjectId = generateId();
  const color = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
  const icon = SUBJECT_ICONS[iconIndex % SUBJECT_ICONS.length];
  colorIndex++;
  iconIndex++;

  sql += `INSERT INTO subjects (id, name, color, icon, details) VALUES ('${subjectId}', '${escapeSql(subjectName)}', '${color}', '${icon}', '{}');\n`;
  chapterOrder = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ignore # Subject Name inside the file since we use the filename
    if (trimmed.startsWith('# ')) {
      continue;
    }
    // ## Paper X
    else if (trimmed.startsWith('## ')) {
      currentPaper = trimmed.replace('## ', '').trim();
    }
    // ### Chapter (was previously Topic in markdown)
    else if (trimmed.startsWith('### ')) {
      let chapterName = trimmed.replace('### ', '').trim();
      // Remove leading number like "1. " and "Topic 1: " or "Topic 1 "
      chapterName = chapterName.replace(/^[0-9]+\.\s*/, '').replace(/^Topic\s+[0-9]+:?\s*/i, '');
      chapterId = generateId();

      sql += `INSERT INTO chapters (id, subject_id, name, order_index, paper) VALUES ('${chapterId}', '${subjectId}', 'Topic ${chapterOrder + 1}: ${escapeSql(chapterName)}', ${chapterOrder}, '${escapeSql(currentPaper)}');\n`;
      chapterOrder++;
      topicOrder = 0;
    }
    // 1. Topic (was previously Subtopic in user terminology)
    else if (/^[0-9]+\.\s/.test(trimmed)) {
      if (!chapterId) continue;
      
      let topicStr = trimmed.replace(/^[0-9]+\.\s*/, '').trim();
      let importance = null;
      
      const match = topicStr.match(/(?:— |-\s*)?Importance:\s*(.*)$/i);
      if (match) {
        importance = match[1].trim();
        topicStr = topicStr.replace(/(?:— |-\s*)?Importance:\s*(.*)$/i, '').trim();
      }

      const topicId = generateId();
      sql += `INSERT INTO topics (id, chapter_id, name, order_index, status, revision_count, importance) VALUES ('${topicId}', '${chapterId}', '${escapeSql(topicStr)}', ${topicOrder}, 'not-started', 0, ${importance ? `'${escapeSql(importance)}'` : 'NULL'});\n`;
      topicOrder++;
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'seed-new.sql'), sql);
console.log('Generated seed-new.sql successfully.');
