-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CREATED', 'FAILED');

-- CreateTable
CREATE TABLE "ServerOrder" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "gameConfig" JSONB,
    "gameDataId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "serverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerOrder_stripeSessionId_key" ON "ServerOrder"("stripeSessionId");

-- CreateIndex
CREATE INDEX "ServerOrder_stripeSessionId_idx" ON "ServerOrder"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "ServerOrder" ADD CONSTRAINT "ServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerOrder" ADD CONSTRAINT "ServerOrder_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerOrder" ADD CONSTRAINT "ServerOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
