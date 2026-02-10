/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `GameData` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GameData" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GameData_slug_key" ON "GameData"("slug");
