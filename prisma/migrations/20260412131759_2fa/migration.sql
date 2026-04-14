/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `twoFactor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "twoFactor" ADD COLUMN     "verified" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "twoFactor_userId_key" ON "twoFactor"("userId");
