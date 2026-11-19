-- Terms of use for free game servers. The app refuses to boot without these
-- rows (lib/startup.ts); the actual HTML is pasted in at /admin/keyvalue.
INSERT INTO "KeyValue" ("key", "type", "string", "note", "updatedAt")
VALUES
    ('legal_free_terms_de', 'STRING', '<div></div>', 'German terms of use for free game servers', NOW()),
    ('legal_free_terms_en', 'STRING', '<div></div>', 'English terms of use for free game servers', NOW())
ON CONFLICT ("key") DO NOTHING;
