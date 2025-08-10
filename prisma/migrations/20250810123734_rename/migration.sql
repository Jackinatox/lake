/*
  Warnings:

  - You are about to drop the column `reciept_url` on the `GameServerOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."GameServerOrder" DROP COLUMN "reciept_url",
ADD COLUMN     "receipt_url" TEXT;
