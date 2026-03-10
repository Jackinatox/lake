/*
  Warnings:

  - You are about to drop the column `preselectedPackageId` on the `HardwareRecommendation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "HardwareRecommendation" DROP CONSTRAINT "HardwareRecommendation_preselectedPackageId_fkey";

-- AlterTable
ALTER TABLE "HardwareRecommendation" DROP COLUMN "preselectedPackageId",
ADD COLUMN     "preSelectedResourceTierId" INTEGER;

-- AddForeignKey
ALTER TABLE "HardwareRecommendation" ADD CONSTRAINT "HardwareRecommendation_preSelectedResourceTierId_fkey" FOREIGN KEY ("preSelectedResourceTierId") REFERENCES "ResourceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
