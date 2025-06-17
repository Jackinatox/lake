/*
  Warnings:

  - Added the required column `stripeSession` to the `ServerIntend` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServerIntend" ADD COLUMN     "stripeSession" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ServerIntend_stripeSession_idx" ON "ServerIntend"("stripeSession");
