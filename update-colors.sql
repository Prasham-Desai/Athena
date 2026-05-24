UPDATE subjects SET color = '#FF4D8D', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#7A1CAC', '$.textAccent', '#FFB3C7') WHERE name = 'Agad Tantra evam Vidhi Vaidyaka';
UPDATE subjects SET color = '#00D1C7', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#0061FF', '$.textAccent', '#8FFFEF') WHERE name = 'Charak Samhita';
UPDATE subjects SET color = '#F7B500', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#8A5A00', '$.textAccent', '#FFE28A') WHERE name = 'Dravyaguna Vigyan';
UPDATE subjects SET color = '#A855F7', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#4338CA', '$.textAccent', '#D8B4FE') WHERE name = 'Rasashastra evam Bhaishajyakalpana';
UPDATE subjects SET color = '#FF6B6B', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#C44569', '$.textAccent', '#FFC2C2') WHERE name = 'Roga Nidan evam Vikriti Vigyan';
UPDATE subjects SET color = '#2DD4BF', details = json_set(coalesce(details, '{}'), '$.secondaryGlow', '#0F766E', '$.textAccent', '#99F6E4') WHERE name = 'Swasthavritta evam Yoga';
