-- This is an empty migration.
-- Made by me to add the suspension_default_reason config entry, so existing deployments get
-- the prefilled text of the admin suspend dialog without anyone touching /admin/keyvalue.

INSERT INTO "KeyValue" ("key", "type", "string", "note", "updatedAt")
VALUES (
    'suspension_default_reason',
    'TEXT',
    'Wir haben Aktivitäten auf deinem Server entdeckt die gegen unsere Regeln verstoßen.',
    'Prefilled reason in the admin suspend dialog. It is emailed to the user verbatim.',
    NOW()
)
ON CONFLICT ("key") DO NOTHING;
