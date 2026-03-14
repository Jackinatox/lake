/*
  Warnings:

  - Added the required column `instanceId` to the `ApplicationLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChangelogEntryType" AS ENUM ('NEW', 'IMPROVED', 'FIXED', 'SECURITY', 'REMOVED');

-- AlterTable
ALTER TABLE "ApplicationLog" ADD COLUMN "instanceId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ApplicationLog" ALTER COLUMN "instanceId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChangelogEntry" ADD COLUMN     "type" "ChangelogEntryType" NOT NULL DEFAULT 'NEW';
