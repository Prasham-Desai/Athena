import json
import uuid
import datetime

sql = ''
with open('activities.json', 'r', encoding='utf-16') as f:
    data = json.load(f)

for row in data[0]['results']:
    desc = row['description'].replace("'", "''")
    ts = (datetime.datetime.utcnow() - datetime.timedelta(hours=12)).isoformat() + 'Z'
    sql += f"INSERT INTO activities (id, type, description, timestamp, subject_id, color) VALUES ('{uuid.uuid4().hex[:16]}', 'topic-completed', '{desc}', '{ts}', 'subject-1', '#10b981');\n"

with open('restore_activities.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print('Generated restore_activities.sql')
