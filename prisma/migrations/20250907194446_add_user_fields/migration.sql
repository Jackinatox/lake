-- AlterTable
ALTER TABLE "public"."session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "ptKey" TEXT,
ADD COLUMN     "ptUserId" INTEGER,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "stripeUserId" TEXT;

-- CreateIndex
CREATE INDEX "GameServerOrder_stripeSessionId_idx" ON "public"."GameServerOrder"("stripeSessionId");
