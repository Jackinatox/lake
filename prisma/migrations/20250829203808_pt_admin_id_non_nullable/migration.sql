/*
  Warnings:

  - Made the column `ptAdminId` on table `GameServer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."GameServer" ALTER COLUMN "ptAdminId" SET NOT NULL;
