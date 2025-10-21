/*
  Warnings:

  - A unique constraint covering the columns `[ptUsername]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."WorkerLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "public"."WorkerJobType" AS ENUM ('EXPIRE_SERVERS');

-- CreateTable
CREATE TABLE "public"."WorkerLog" (
    "id" SERIAL NOT NULL,
    "jobType" "public"."WorkerJobType" NOT NULL,
    "jobRun" TEXT,
    "level" "public"."WorkerLogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "gameServerId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerLog_jobType_level_createdAt_idx" ON "public"."WorkerLog"("jobType", "level", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerLog_gameServerId_idx" ON "public"."WorkerLog"("gameServerId");

-- CreateIndex
CREATE INDEX "WorkerLog_userId_idx" ON "public"."WorkerLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ptUsername_key" ON "public"."user"("ptUsername");

-- AddForeignKey
ALTER TABLE "public"."WorkerLog" ADD CONSTRAINT "WorkerLog_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "public"."GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkerLog" ADD CONSTRAINT "WorkerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
