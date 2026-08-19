-- CreateEnum
CREATE TYPE "SuspensionType" AS ENUM ('QUARANTINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmailType" ADD VALUE 'GAME_SERVER_SUSPENDED';
ALTER TYPE "EmailType" ADD VALUE 'GAME_SERVER_UNSUSPENDED';

-- AlterEnum
ALTER TYPE "TicketCategory" ADD VALUE 'SUSPENSION';

-- CreateTable
CREATE TABLE "GameServerSuspension" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "type" "SuspensionType" NOT NULL DEFAULT 'QUARANTINE',
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deleteAfterExpiry" BOOLEAN NOT NULL DEFAULT true,
    "liftedAt" TIMESTAMP(3),
    "liftedByUserId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServerSuspension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameServerSuspension_gameServerId_liftedAt_idx" ON "GameServerSuspension"("gameServerId", "liftedAt");

-- CreateIndex
CREATE INDEX "GameServerSuspension_expiresAt_idx" ON "GameServerSuspension"("expiresAt");

-- AddForeignKey
ALTER TABLE "GameServerSuspension" ADD CONSTRAINT "GameServerSuspension_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerSuspension" ADD CONSTRAINT "GameServerSuspension_liftedByUserId_fkey" FOREIGN KEY ("liftedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerSuspension" ADD CONSTRAINT "GameServerSuspension_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
