/*
  Warnings:

  - You are about to drop the `ServerIntend` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServerIntend" DROP CONSTRAINT "ServerIntend_gameDataId_fkey";

-- DropForeignKey
ALTER TABLE "ServerIntend" DROP CONSTRAINT "ServerIntend_locationId_fkey";

-- DropForeignKey
ALTER TABLE "ServerIntend" DROP CONSTRAINT "ServerIntend_userId_fkey";

-- DropTable
DROP TABLE "ServerIntend";
