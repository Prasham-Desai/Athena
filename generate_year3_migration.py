from pathlib import Path
import csv
import hashlib
import json

csv_path = Path("third_year_curriculum.csv")
migration_path = Path("src/db/migrations/0021_add_third_year_curriculum.sql")
with csv_path.open(newline="", encoding="utf-8-sig") as stream:
    records = list(csv.DictReader(stream))

subjects = {}
chapters = {}
topics = []
for row in records:
    if row["record_type"] != "learning_objective":
        continue
    code = row["subject_code"]
    subjects[code] = (row["sanskrit_subject_name"], row["english_title"])
    chapter_key = (code, int(row["paper_order"]), int(row["topic_order"]), row["topic_name"])
    chapters.setdefault(chapter_key, {
        "paper": f"Paper {row['paper_order']}",
        "order": len([key for key in chapters if key[0] == code]),
        "name": f"Chapter {row['topic_order']}: {row['topic_name']}",
    })
    topics.append((chapter_key, row))

def stable_id(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()[:12]

def sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"

colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#22c55e", "#14b8a6", "#06b6d4"]
icons = ["Microscope", "Brain", "BookOpen", "Eye", "BookOpen", "GraduationCap", "BookOpen", "Calculator", "Heart"]
codes = sorted(subjects)
subject_ids = {code: stable_id("year_3:subject:" + code) for code in codes}
chapter_ids = {key: stable_id("year_3:chapter:" + "|".join(map(str, key))) for key in chapters}

lines = [
    "-- Third Year curriculum from third_year_curriculum.csv.",
    "-- Table 3 topic headings become Chapters; rated learning objectives become Topics.",
    "-- Existing study progress is preserved on reruns by stable IDs and conflict updates.",
    "",
    "-- Remove only the confirmed empty Third Year placeholder subject.",
    "DELETE FROM subjects WHERE id = '2621ceaf-6d2b-407c-bb92-9c112ec471cd' AND academic_year_id = 'year_3' AND name = 'Dravyaguna';",
    "",
    "-- Give unrated Second Year Topics an explicit source-faithful value; do not infer a rating.",
    "UPDATE topics SET importance = 'Not Specified'",
    "WHERE (importance IS NULL OR TRIM(importance) = '')",
    "  AND chapter_id IN (SELECT c.id FROM chapters c JOIN subjects s ON s.id = c.subject_id WHERE s.academic_year_id = 'year_2');",
    "",
    "-- Rename the existing Second Year section headings in place.",
    "UPDATE chapters SET name = 'Chapter ' || SUBSTR(name, 7)",
    "WHERE name LIKE 'Topic %'",
    "  AND subject_id IN (SELECT id FROM subjects WHERE academic_year_id = 'year_2');",
    "",
]

for index, code in enumerate(codes):
    name, english = subjects[code]
    details = json.dumps({"Subject Code": code, "English Title": english}, ensure_ascii=False, separators=(",", ":"))
    sid = subject_ids[code]
    lines.append(
        "INSERT INTO subjects (id, name, color, icon, details, academic_year_id) VALUES "
        f"({sql(sid)}, {sql(name)}, {sql(colors[index])}, {sql(icons[index])}, {sql(details)}, 'year_3') "
        "ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color, icon=excluded.icon, "
        "details=excluded.details, academic_year_id=excluded.academic_year_id, updated_at=CURRENT_TIMESTAMP;"
    )

for key, chapter in chapters.items():
    code = key[0]
    cid = chapter_ids[key]
    lines.append(
        "INSERT INTO chapters (id, subject_id, name, order_index, paper) VALUES "
        f"({sql(cid)}, {sql(subject_ids[code])}, {sql(chapter['name'])}, {chapter['order']}, {sql(chapter['paper'])}) "
        "ON CONFLICT(id) DO UPDATE SET name=excluded.name, order_index=excluded.order_index, paper=excluded.paper;"
    )

for key, row in topics:
    code = row["subject_code"]
    topic_id = stable_id("year_3:topic:" + "|".join([
        code, row["paper_order"], row["topic_order"], row["subtopic_order"], row["subtopic_name"]
    ]))
    lines.append(
        "INSERT INTO topics (id, chapter_id, name, status, order_index, revision_count, importance, notes) VALUES "
        f"({sql(topic_id)}, {sql(chapter_ids[key])}, {sql(row['subtopic_name'])}, 'not-started', "
        f"{int(row['subtopic_order']) - 1}, 0, {sql(row['importance_level'])}, '') "
        "ON CONFLICT(id) DO UPDATE SET chapter_id=excluded.chapter_id, name=excluded.name, "
        "order_index=excluded.order_index, importance=excluded.importance;"
    )

migration_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {migration_path}: {len(codes)} subjects, {len(chapters)} chapters, {len(topics)} topics")
