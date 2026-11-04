-- Migration number: 0024 	 2026-11-04
-- Rename Samhita Adhyayan subjects in years 1, 2, and 3 to Charak Samhita - 1, Charak Samhita - 2, and Charak Samhita - 3

UPDATE subjects
SET name = 'Charak Samhita - 1', updated_at = CURRENT_TIMESTAMP
WHERE id = 'fy1-7f6ac210d83f01d3' OR (academic_year_id = 'year_1' AND (name LIKE '%Samhita Adhyayan%' OR name LIKE '%Samhita%'));

UPDATE subjects
SET name = 'Charak Samhita - 2', updated_at = CURRENT_TIMESTAMP
WHERE id = '11dca16728ae' OR (academic_year_id = 'year_2' AND (name = 'Charak Samhita' OR name = 'Charak  Samhita' OR name LIKE '%Samhita%'));

UPDATE subjects
SET name = 'Charak Samhita - 3', updated_at = CURRENT_TIMESTAMP
WHERE id = '57ab02508d0f' OR (academic_year_id = 'year_3' AND (name LIKE '%Samhita Adhyayan%' OR name LIKE '%Samhita%'));
