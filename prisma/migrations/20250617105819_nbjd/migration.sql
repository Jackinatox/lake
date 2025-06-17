/*
  Warnings:

  - You are about to drop the column `cpuId` on the `ServerIntend` table. All the data in the column will be lost.
  - You are about to drop the column `ramId` on the `ServerIntend` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServerIntend" DROP CONSTRAINT "ServerIntend_cpuId_fkey";

-- DropForeignKey
ALTER TABLE "ServerIntend" DROP CONSTRAINT "ServerIntend_ramId_fkey";

-- AlterTable
ALTER TABLE "ServerIntend" DROP COLUMN "cpuId",
DROP COLUMN "ramId",
ADD COLUMN     "locationId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "ServerIntend" ADD CONSTRAINT "ServerIntend_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
