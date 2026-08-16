-- DropForeignKey
ALTER TABLE "ApplicationLog" DROP CONSTRAINT "ApplicationLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerLog" DROP CONSTRAINT "WorkerLog_userId_fkey";

-- AlterTable
ALTER TABLE "Feedback" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "KeyValue" ("key", "type", "boolean", "updatedAt")
VALUES ('free_server_creation_enabled', 'BOOLEAN', true, NOW())
ON CONFLICT ("key") DO NOTHING;
