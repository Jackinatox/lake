-- AlterEnum
ALTER TYPE "OrderType" ADD VALUE 'CONFIGURED';

-- CreateTable
CREATE TABLE "ResourceTier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "backups" INTEGER NOT NULL,
    "ports" INTEGER NOT NULL,
    "sorting" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceTier_pkey" PRIMARY KEY ("id")
);
