
UPDATE topics SET status = 'pending';
UPDATE subtopics SET status = 'not-started';

UPDATE topics SET status = 'completed' WHERE name = 'Gambhari.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Gambhari.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Lavanga.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Lavanga.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Kalamegha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Kalamegha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Madanphala.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Madanphala.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Manjishta.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Manjishta.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Maricha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Maricha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Musta.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Musta.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Nimba.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Nimba.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Palasha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Palasha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Palasha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Palasha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Pippali.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Pippali.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Rasona.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Rasona.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Sariva.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Sariva.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Shatavari.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Shatavari.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Tulasi.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Tulasi.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Usheera.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Usheera.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Vacha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Vacha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Vasa.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Vasa.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Vatsanabha.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Vatsanabha.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Vibhitaki.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Vibhitaki.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Yashtimadhu.' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Yashtimadhu.' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Dravyaguna Vigyana' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Dravyaguna Vigyana' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Dravya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Dravya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 3: Guna' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 3: Guna' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Rasa' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Rasa' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 5: Vipaka' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 5: Vipaka' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 7: Prabhava' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 7: Prabhava' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 6: Virya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 6: Virya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 8: Interrelation of Rasa-Guna-Virya-Vipaka-Prabhava' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 8: Interrelation of Rasa-Guna-Virya-Vipaka-Prabhava' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 9: Karma' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 9: Karma' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 12: Mishraka Gana' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 12: Mishraka Gana' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Dravyagun Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Concepts of Agada Tantra (Clinical Toxicoiogy) (Lecture :8 hours, Non lecture: 1 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Concepts of Agada Tantra (Clinical Toxicoiogy) (Lecture :8 hours, Non lecture: 1 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Visha Chikitsa (Management of Poisoning) (Lecture :5 hours, Non lecture: 4 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Visha Chikitsa (Management of Poisoning) (Lecture :5 hours, Non lecture: 4 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 3: Vishakta aahara pariksha and Viruddha ahara (Lecture :3 hours, Non lecture: 2 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 3: Vishakta aahara pariksha and Viruddha ahara (Lecture :3 hours, Non lecture: 2 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Garavisha and Dooshivisha (Lecture :7 hours, Non lecture: 2 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Garavisha and Dooshivisha (Lecture :7 hours, Non lecture: 2 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 8: Therapeutic utility of Agada yoga (Lecture :1 hours, Non lecture: 0 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 8: Therapeutic utility of Agada yoga (Lecture :1 hours, Non lecture: 0 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 9: Sthavara visha ΓÇö Poisons of Plant origin (Lecture :4 hours, Non lecture: 2 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 9: Sthavara visha ΓÇö Poisons of Plant origin (Lecture :4 hours, Non lecture: 2 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 10: Sthavara Visha ΓÇö Poisons of Metallic origin (Lecture :4 hours, Non lecture: 2 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 10: Sthavara Visha ΓÇö Poisons of Metallic origin (Lecture :4 hours, Non lecture: 2 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 11: Jangama Visha (Lecture :10 hours, Non lecture: 6 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 11: Jangama Visha (Lecture :10 hours, Non lecture: 6 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 15: Forensic medicine (Vyavahara Ayurveda) and Medical jurisprudence (Vidhi vaidyaka): (Lecture :1 hours, Non lecture: 0 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 15: Forensic medicine (Vyavahara Ayurveda) and Medical jurisprudence (Vidhi vaidyaka): (Lecture :1 hours, Non lecture: 0 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 16: Vaidya sadvritta : Duties and Responsibilities of medical practitioner (Lecture :6 hours, Non lecture: 4 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 16: Vaidya sadvritta : Duties and Responsibilities of medical practitioner (Lecture :6 hours, Non lecture: 4 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 17: Legal Procedures (Lecture :4 hours, Non lecture: 4 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 17: Legal Procedures (Lecture :4 hours, Non lecture: 4 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 18: Personal identity (Lecture :2 hours, Non lecture: 2 hours)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Agad Tantra'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 18: Personal identity (Lecture :2 hours, Non lecture: 2 hours)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Agad Tantra'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Cha.Ni.01-Jwara nidana Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Cha.Ni.01-Jwara nidana Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Cha.Ni.02-Raktapitta nidana Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Cha.Ni.02-Raktapitta nidana Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 3: Cha.Ni.03-Gulma nidana Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 3: Cha.Ni.03-Gulma nidana Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Cha.Ni.04-Prameha nidana adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Cha.Ni.04-Prameha nidana adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 5: Cha.Ni.05-Kushta nidana Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 5: Cha.Ni.05-Kushta nidana Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 6: Cha.Ni.06-Shosha nidana Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 6: Cha.Ni.06-Shosha nidana Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 17: Cha.Sha.01-Katithapurusheeya Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 17: Cha.Sha.01-Katithapurusheeya Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 18: Cha.Sha.02-Atulyagothreeyam Adhyaaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 18: Cha.Sha.02-Atulyagothreeyam Adhyaaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 19: Cha.Sha.03-Khuddika garbhavakranti Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 19: Cha.Sha.03-Khuddika garbhavakranti Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 20: Cha.Sha.04-Mahatee garbhavakranti Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 20: Cha.Sha.04-Mahatee garbhavakranti Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 21: Cha.Sha.05-Purushavichaya Shareera Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 21: Cha.Sha.05-Purushavichaya Shareera Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 22: Cha.Sha.06-Sareeravichaya adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 22: Cha.Sha.06-Sareeravichaya adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 23: Cha.Sha.07- Sareerasankhya sareera Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 23: Cha.Sha.07- Sareerasankhya sareera Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 24: Cha.Sha.08-Jathisutreeya Adhyaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Charak  Samhita'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 24: Cha.Sha.08-Jathisutreeya Adhyaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Charak  Samhita'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Chronological development of Ayurvediya Aushadhi Nirmana' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Chronological development of Ayurvediya Aushadhi Nirmana' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Paribhasha ( Terminology)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Paribhasha ( Terminology)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 3: Adharbhuta Siddhanta (Application of fundamental principles )' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 3: Adharbhuta Siddhanta (Application of fundamental principles )' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Yantropakaranani- I (Equipments and machineries)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Yantropakaranani- I (Equipments and machineries)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 5: Yantropakaranani -II (Equipments, fuel and Heating Devices)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 5: Yantropakaranani -II (Equipments, fuel and Heating Devices)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 6: Kalpana Nirmana I (Primary & Secondary dosage forms)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 6: Kalpana Nirmana I (Primary & Secondary dosage forms)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 7: Kalpana Nirmana-II (Method of Preparation of different dosage forms & Dietary Supplements)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 7: Kalpana Nirmana-II (Method of Preparation of different dosage forms & Dietary Supplements)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 9: Rasa Dravya Parichaya II' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 9: Rasa Dravya Parichaya II' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 11: Kalpana Nirman -III (Method of Preparation of different dosage forms)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 11: Kalpana Nirman -III (Method of Preparation of different dosage forms)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 12: Chaturvidha Rasayana' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 12: Chaturvidha Rasayana' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 18: Aushadhi Kalpa -I (Compound formulations)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 18: Aushadhi Kalpa -I (Compound formulations)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 16: Single drug (Herbal & Mineral)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 16: Single drug (Herbal & Mineral)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 23: Aushadhi Prayoga Marga' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 23: Aushadhi Prayoga Marga' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Rasashastra evam Bhaishajyakalpana'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Roga nidana ΓÇö Pathophysiology and clinical diagnosis' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Roga nidana ΓÇö Pathophysiology and clinical diagnosis' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 3: Methods of Rogi pareeksha' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 3: Methods of Rogi pareeksha' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Pareeksha' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Pareeksha' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Sapeksha nidana - Vyavacchedaka nidana' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Sapeksha nidana - Vyavacchedaka nidana' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 5: Upashaya/ Anupashaya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 5: Upashaya/ Anupashaya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 6: Dosha Vikriti' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 6: Dosha Vikriti' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 29: Agnimandya ΓÇö Ajeerna, Anaha, Adhmana, Atopa' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 29: Agnimandya ΓÇö Ajeerna, Anaha, Adhmana, Atopa' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 30: Chhardi' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 30: Chhardi' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 33: Atisara, and Pravahika' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 33: Atisara, and Pravahika' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 34: Grahani' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 34: Grahani' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 37: Mutrakrichhra' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 37: Mutrakrichhra' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 38: Mutraghata' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 38: Mutraghata' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 40: Hikka' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 40: Hikka' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 42: Kasa' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 42: Kasa' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 43: Rajayakshma & Shosha' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 43: Rajayakshma & Shosha' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 45: Jwara' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 45: Jwara' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 46: Masurika ΓÇö Romantika' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 46: Masurika ΓÇö Romantika' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 48: Pandu' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 48: Pandu' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 49: Raktapitta' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 49: Raktapitta' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 54: Kamala' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 54: Kamala' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 55: Udara Roga' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 55: Udara Roga' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 57: Kushtha - Maha Kushtha & Kshudra Kushtha (According to Charaka)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 57: Kushtha - Maha Kushtha & Kshudra Kushtha (According to Charaka)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 66: Prameha' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 66: Prameha' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Roga Nidan evam Vikriti Vigyan'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 1: Swastha and Swasthya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 1: Swastha and Swasthya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 2: Healthy Life style -Dinacharya (Daily regimen)' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 2: Healthy Life style -Dinacharya (Daily regimen)' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 4: Ritucharya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 4: Ritucharya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 5: Roga nutpadaniya' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 5: Roga nutpadaniya' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 7: Ahara' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 7: Ahara' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE chapter_id IN (
    SELECT id FROM chapters WHERE name = 'Topic 6: Sadvritta' AND subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE name = 'Topic 6: Sadvritta' AND subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);

UPDATE topics SET status = 'completed' WHERE name = 'Explain Epidemiological determinants, brief pathology ,transmission, incubation period , clinical features, diagnosis and preventive measures of 1.Droplet Infections' AND chapter_id IN (
    SELECT id FROM chapters WHERE subject_id IN (
        SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
    )
);
UPDATE subtopics SET status = 'completed' WHERE name = 'Explain Epidemiological determinants, brief pathology ,transmission, incubation period , clinical features, diagnosis and preventive measures of 1.Droplet Infections' AND topic_id IN (
    SELECT id FROM topics WHERE chapter_id IN (
        SELECT id FROM chapters WHERE subject_id IN (
            SELECT id FROM subjects WHERE name = 'Swasthavritta evam Yoga'
        )
    )
);
