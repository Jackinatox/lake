-- DropForeignKey
ALTER TABLE "public"."GameServerOrder" DROP CONSTRAINT "GameServerOrder_gameServerId_fkey";

-- AlterTable
ALTER TABLE "public"."GameServer" ALTER COLUMN "ptServerId" DROP NOT NULL,
ALTER COLUMN "ptAdminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "public"."GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
