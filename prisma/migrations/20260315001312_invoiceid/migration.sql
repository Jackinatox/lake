/*
  Warnings:

  - A unique constraint covering the columns `[stripeInvoiceId]` on the table `GameServerOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "stripeInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeInvoiceId_key" ON "GameServerOrder"("stripeInvoiceId");
