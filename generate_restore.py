import json
import re

sql = '''
UPDATE topics SET status = 'pending';
UPDATE subtopics SET status = 'not-started';
'''

with open('activities.json', 'r', encoding='utf-16') as f:
    data = json.load(f)

for row in data[0]['results']:
    desc = row['description']
    
    # Try match 'Completed all topics in "CHAPTER" (SUBJECT)'
    m1 = re.match(r'Completed all topics in "(.*?)" \((.*?)\)', desc)
    if m1:
        chapter = m1.group(1).replace("'", "''")
        subject = m1.group(2).replace("'", "''")
        
        sql += f"""
UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = '{chapter}' AND subject_id IN (
        SELECT id FROM subjects WHERE name = '{subject}'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = '{chapter}' AND subject_id IN (
            SELECT id FROM subjects WHERE name = '{subject}'
        )
    )
);
"""
        continue
        
    # Try match 'Completed "TOPIC" in SUBJECT'
    m2 = re.match(r'Completed "(.*?)" in (.*)', desc)
    if m2:
        item = m2.group(1).replace("'", "''")
        subject = m2.group(2).replace("'", "''")
        
        sql += f"""
UPDATE topics SET status = 'completed' WHERE name = '{item}' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = '{subject}'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = '{item}' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = '{subject}'
        )
    )
);
"""
        continue

with open('restore.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print('Generated restore.sql')
