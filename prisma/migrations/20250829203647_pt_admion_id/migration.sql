/*
  Warnings:

  - Made the column `ptServerId` on table `GameServer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."GameServer" ADD COLUMN     "ptAdminId" INTEGER,
ALTER COLUMN "ptServerId" SET NOT NULL;
