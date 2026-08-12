-- This is an empty migration.
-- Made by me to add the minecraft_modpacks_enabled config entry

INSERT INTO "KeyValue" ("key", "type", "boolean", "updatedAt")
VALUES ('minecraft_modpacks_enabled', 'BOOLEAN', false, NOW())
ON CONFLICT ("key") DO NOTHING;