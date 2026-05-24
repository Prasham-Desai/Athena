UPDATE subjects SET color = '#3B82F6', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#1E3A8A', '$.textAccent', '#93C5FD') WHERE name = 'Agad Tantra evam Vidhi Vaidyaka';
UPDATE subjects SET color = '#10B981', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#064E3B', '$.textAccent', '#6EE7B7') WHERE name = 'Charak Samhita';
UPDATE subjects SET color = '#EC4899', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#831843', '$.textAccent', '#F9A8D4') WHERE name = 'Dravyaguna Vigyan';
