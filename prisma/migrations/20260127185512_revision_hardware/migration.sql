/*
  Warnings:

  - Added the required column `gameDataId` to the `HardwareRecommendation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HardwareRecommendation" ADD COLUMN     "gameDataId" INTEGER NOT NULL,
ALTER COLUMN "eggId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HardwareRecommendation" ADD CONSTRAINT "HardwareRecommendation_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
