/*
  Warnings:

  - You are about to drop the column `receiptPdfUrl` on the `GameServerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_url` on the `GameServerOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GameServerOrder" DROP COLUMN "receiptPdfUrl",
DROP COLUMN "receipt_url";
