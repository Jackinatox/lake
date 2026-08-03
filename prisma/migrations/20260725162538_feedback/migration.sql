-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('MODPACK_BETA', 'GENERAL');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "userId" TEXT NOT NULL,
    "gameServerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_type_idx" ON "Feedback"("type");

-- CreateIndex
CREATE INDEX "Feedback_gameServerId_idx" ON "Feedback"("gameServerId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
