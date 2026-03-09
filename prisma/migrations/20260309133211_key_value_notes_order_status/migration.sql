-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FAILED');

-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "provisioningStatus" "ProvisioningStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "KeyValue" ADD COLUMN     "category" VARCHAR(30);

-- CreateIndex
CREATE INDEX "KeyValue_category_idx" ON "KeyValue"("category");
