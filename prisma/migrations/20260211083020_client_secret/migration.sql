/*
  Warnings:

  - Made the column `slug` on table `GameData` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GameData" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "stripeClientSecret" TEXT;
