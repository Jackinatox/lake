/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntent]` on the table `GameServerOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeChargeId]` on the table `GameServerOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripePaymentIntent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripePaymentIntent_key" ON "GameServerOrder"("stripePaymentIntent");

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeChargeId_key" ON "GameServerOrder"("stripeChargeId");
