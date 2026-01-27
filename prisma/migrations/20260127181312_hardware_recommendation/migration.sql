-- CreateTable
CREATE TABLE "HardwareRecommendation" (
    "id" SERIAL NOT NULL,
    "eggId" INTEGER NOT NULL,
    "minCpuPercent" INTEGER NOT NULL,
    "recCpuPercent" INTEGER NOT NULL,
    "minramMb" INTEGER NOT NULL,
    "recRamMb" INTEGER NOT NULL,
    "preselectedPackageId" INTEGER,
    "note" TEXT,
    "sorting" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HardwareRecommendation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HardwareRecommendation" ADD CONSTRAINT "HardwareRecommendation_preselectedPackageId_fkey" FOREIGN KEY ("preselectedPackageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
