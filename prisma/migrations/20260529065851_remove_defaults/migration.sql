/*
  Warnings:

  - You are about to drop the column `multiScore` on the `CPU` table. All the data in the column will be lost.
  - You are about to drop the column `singleScore` on the `CPU` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CPU" DROP COLUMN "multiScore",
DROP COLUMN "singleScore",
ALTER COLUMN "pricePerCore" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GameData" ALTER COLUMN "sorting" DROP DEFAULT,
ALTER COLUMN "nestId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GameServer" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "enabled" SET DEFAULT false,
ALTER COLUMN "ptLocationId" DROP DEFAULT,
ALTER COLUMN "cpuId" DROP DEFAULT;
