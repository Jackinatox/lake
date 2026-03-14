-- Backfill NULL publishedAt with createdAt
UPDATE "BlogPost" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL;
UPDATE "ChangelogEntry" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL;

-- AlterTable
ALTER TABLE "BlogPost" ALTER COLUMN "publishedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChangelogEntry" ALTER COLUMN "publishedAt" SET NOT NULL;
