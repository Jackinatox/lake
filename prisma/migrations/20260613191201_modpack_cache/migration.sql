-- CreateTable
CREATE TABLE "ModpackCache" (
    "id" SERIAL NOT NULL,
    "searchString" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModpackCache_pkey" PRIMARY KEY ("id")
);
