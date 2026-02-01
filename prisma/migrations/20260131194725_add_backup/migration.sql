/*
  Warnings:

  - Added the required column `backupCount` to the `GameServerOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "backupCount" INTEGER NOT NULL;
