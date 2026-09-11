-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
