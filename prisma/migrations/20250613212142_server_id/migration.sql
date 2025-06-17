/*
  Warnings:

  - You are about to drop the column `provisind` on the `ServerIntend` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServerIntend" DROP COLUMN "provisind",
ADD COLUMN     "serverId" TEXT;
