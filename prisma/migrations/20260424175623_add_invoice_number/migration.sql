/*
  Warnings:

  - A unique constraint covering the columns `[stripeInvoiceNumber]` on the table `GameServerOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "stripeInvoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeInvoiceNumber_key" ON "GameServerOrder"("stripeInvoiceNumber");
