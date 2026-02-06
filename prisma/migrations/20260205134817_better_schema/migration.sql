/*
  Warnings:

  - Made the column `creationGameDataId` on table `GameServerOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `creationLocationId` on table `GameServerOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ApplicationLog" DROP CONSTRAINT "ApplicationLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameServerOrder" DROP CONSTRAINT "GameServerOrder_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerLog" DROP CONSTRAINT "WorkerLog_jobRunId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerLog" DROP CONSTRAINT "WorkerLog_userId_fkey";

-- AlterTable
ALTER TABLE "GameServerOrder" ALTER COLUMN "creationGameDataId" SET NOT NULL,
ALTER COLUMN "creationLocationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
