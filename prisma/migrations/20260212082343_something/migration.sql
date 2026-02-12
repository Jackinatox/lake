/*
  Warnings:

  - The primary key for the `GameServerOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `allocations` to the `GameServer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `allocations` to the `GameServerOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameServer" ADD COLUMN     "allocations" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "GameServerOrder" DROP CONSTRAINT "GameServerOrder_pkey",
ADD COLUMN     "allocations" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "GameServerOrder_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "GameServerOrder_id_seq";
