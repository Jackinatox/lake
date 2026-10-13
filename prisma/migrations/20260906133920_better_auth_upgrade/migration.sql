-- AlterTable
ALTER TABLE "apikey" ALTER COLUMN "rateLimitTimeWindow" DROP NOT NULL,
ALTER COLUMN "rateLimitMax" DROP NOT NULL,
ALTER COLUMN "requestCount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "twoFactor" ADD COLUMN     "failedVerificationCount" INTEGER DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);
