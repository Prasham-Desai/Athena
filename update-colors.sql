UPDATE subjects SET color = '#E11D48', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#881337', '$.textAccent', '#FDA4AF') WHERE name = 'Agad Tantra evam Vidhi Vaidyaka';
UPDATE subjects SET color = '#F59E0B', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#78350F', '$.textAccent', '#FDE68A') WHERE name = 'Charak Samhita';
UPDATE subjects SET color = '#4F46E5', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#312E81', '$.textAccent', '#C7D2FE') WHERE name = 'Dravyaguna Vigyan';
