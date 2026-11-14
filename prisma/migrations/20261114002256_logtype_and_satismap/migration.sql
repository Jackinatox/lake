/*
  Warnings:

  - The values [PAYMENT_LOG] on the enum `LogType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
UPDATE "Log" SET "type" = 'PAYMENT' WHERE "type" = 'PAYMENT_LOG';
CREATE TYPE "LogType_new" AS ENUM ('SYSTEM', 'AUTHENTICATION', 'PAYMENT', 'GAME_SERVER', 'EMAIL', 'SUPPORT_TICKET', 'FREE_SERVER_EXTEND', 'TELEGRAM');
ALTER TABLE "Log" ALTER COLUMN "type" TYPE "LogType_new" USING ("type"::text::"LogType_new");
ALTER TYPE "LogType" RENAME TO "LogType_old";
ALTER TYPE "LogType_new" RENAME TO "LogType";
DROP TYPE "public"."LogType_old";
COMMIT;

-- CreateTable
CREATE TABLE "MapShareLink" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapShareLink_gameServerId_key" ON "MapShareLink"("gameServerId");

-- AddForeignKey
ALTER TABLE "MapShareLink" ADD CONSTRAINT "MapShareLink_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapShareLink" ADD CONSTRAINT "MapShareLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
