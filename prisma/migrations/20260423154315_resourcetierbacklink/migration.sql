-- AlterTable
ALTER TABLE "GameServer" ADD COLUMN     "resourceTierId" INTEGER;

-- AlterTable
ALTER TABLE "GameServerOrder" ADD COLUMN     "resourceTierId" INTEGER;

-- CreateIndex
CREATE INDEX "GameServer_resourceTierId_idx" ON "GameServer"("resourceTierId");

-- CreateIndex
CREATE INDEX "GameServerOrder_resourceTierId_idx" ON "GameServerOrder"("resourceTierId");

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_resourceTierId_fkey" FOREIGN KEY ("resourceTierId") REFERENCES "ResourceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_resourceTierId_fkey" FOREIGN KEY ("resourceTierId") REFERENCES "ResourceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
