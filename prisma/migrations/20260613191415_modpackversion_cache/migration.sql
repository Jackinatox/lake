-- CreateTable
CREATE TABLE "ModpackVersionCache" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModpackVersionCache_pkey" PRIMARY KEY ("id")
);
