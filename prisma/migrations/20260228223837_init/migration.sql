-- CreateEnum
CREATE TYPE "GameServerType" AS ENUM ('CUSTOM', 'PACKAGE', 'FREE');

-- CreateEnum
CREATE TYPE "GameServerStatus" AS ENUM ('CREATED', 'CREATION_FAILED', 'ACTIVE', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "RefundStripeStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('WITHDRAWAL', 'REFUND');

-- CreateEnum
CREATE TYPE "RefundServerAction" AS ENUM ('SUSPEND', 'SHORTEN', 'NONE');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('NEW', 'UPGRADE', 'DOWNGRADE', 'RENEW', 'FREE_SERVER', 'TO_PAYED', 'PACKAGE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED', 'PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('TRACE', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "WorkerJobType" AS ENUM ('EXPIRE_SERVERS', 'SEND_EMAILS', 'GENERATE_EMAILS', 'DELETE_SERVERS', 'GENERATE_DELETION_EMAILS', 'CHECK_NEW_VERSIONS');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('SYSTEM', 'AUTHENTICATION', 'PAYMENT', 'PAYMENT_LOG', 'GAME_SERVER', 'EMAIL', 'SUPPORT_TICKET', 'FREE_SERVER_EXTEND', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('EMAIL_VERIFICATION', 'REQUEST_PASSWORD_RESET', 'PASSWORD_RESET_SUCCESS', 'TWO_FACTOR_CREATED', 'TWO_FACTOR_REMOVED', 'TWO_FAKTOR_OPT_SEND', 'SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET_RESPONSE', 'GAME_SERVER_EXPIRED', 'GAME_SERVER_EXPIRING_7_DAYS', 'GAME_SERVER_EXPIRING_1_DAY', 'GAME_SERVER_DELETION_1_DAY', 'GAME_SERVER_DELETION_7_DAYS', 'SERVER_BOOKING_CONFIRMATION', 'FREE_SERVER_CREATED', 'INVOICE', 'REFUND', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "KeyValueType" AS ENUM ('STRING', 'JSON', 'NUMBER', 'BOOLEAN', 'TEXT');

-- CreateTable
CREATE TABLE "GameData" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "data" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sorting" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "diskPrice" DOUBLE PRECISION NOT NULL,
    "portsLimit" INTEGER NOT NULL,
    "backupsLimit" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "freeServer" BOOLEAN NOT NULL DEFAULT false,
    "ptLocationId" INTEGER NOT NULL DEFAULT 1,
    "cpuId" INTEGER NOT NULL DEFAULT 1,
    "ramId" INTEGER NOT NULL,
    "sorting" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CPU" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cores" INTEGER,
    "threads" INTEGER,
    "singleScore" INTEGER,
    "multiScore" INTEGER,
    "maxThreads" INTEGER NOT NULL,
    "minThreads" INTEGER NOT NULL,
    "pricePerCore" DOUBLE PRECISION NOT NULL DEFAULT 0.2,

    CONSTRAINT "CPU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAM" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "speed" INTEGER,
    "pricePerGb" DOUBLE PRECISION NOT NULL,
    "minGb" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "maxGb" DOUBLE PRECISION NOT NULL DEFAULT 12,

    CONSTRAINT "RAM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameServer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "backupCount" INTEGER NOT NULL,
    "allocations" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" "GameServerType" NOT NULL DEFAULT 'CUSTOM',
    "lastExtended" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ptServerId" TEXT,
    "ptAdminId" INTEGER,
    "name" TEXT NOT NULL,
    "status" "GameServerStatus" NOT NULL,
    "errorText" TEXT,
    "gameConfig" JSONB,
    "gameDataId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameServerOrder" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT,
    "userId" TEXT NOT NULL,
    "workerJobId" TEXT,
    "type" "OrderType" NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "backupCount" INTEGER NOT NULL,
    "allocations" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntent" TEXT,
    "stripeChargeId" TEXT,
    "stripeClientSecret" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
    "errorText" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "gameConfig" JSONB,
    "creationGameDataId" INTEGER NOT NULL,
    "creationLocationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripeRefundId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "internalNote" TEXT,
    "status" "RefundStripeStatus" NOT NULL DEFAULT 'PENDING',
    "type" "RefundType" NOT NULL DEFAULT 'WITHDRAWAL',
    "serverAction" "RefundServerAction" NOT NULL DEFAULT 'SUSPEND',
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "initiatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "ptUserId" INTEGER,
    "ptKey" TEXT,
    "stripeUserId" TEXT,
    "lastLoginMethod" TEXT,
    "ptUsername" TEXT,
    "UserSettings" JSONB NOT NULL DEFAULT '{}',
    "twoFactorEnabled" BOOLEAN DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobType" "WorkerJobType" NOT NULL,
    "status" "JobRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsTotal" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "metadata" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerLog" (
    "id" SERIAL NOT NULL,
    "jobType" "WorkerJobType" NOT NULL,
    "jobRun" TEXT,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "gameServerId" TEXT,
    "userId" TEXT,
    "jobRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" SERIAL NOT NULL,
    "level" "LogLevel" NOT NULL,
    "type" "LogType" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "method" TEXT,
    "path" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "userId" TEXT,
    "gameServerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "GameServerId" TEXT,
    "errorText" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "nodeMailerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyValue" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "type" "KeyValueType" NOT NULL,
    "string" TEXT,
    "json" JSONB,
    "number" DOUBLE PRECISION,
    "boolean" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "imageName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "diskMB" INTEGER NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "backups" INTEGER NOT NULL,
    "allocations" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "sorting" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggFeature" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EggFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDataFeature" (
    "gameDataId" INTEGER NOT NULL,
    "featureId" INTEGER NOT NULL,

    CONSTRAINT "GameDataFeature_pkey" PRIMARY KEY ("gameDataId","featureId")
);

-- CreateTable
CREATE TABLE "HardwareRecommendation" (
    "id" SERIAL NOT NULL,
    "eggId" INTEGER,
    "gameDataId" INTEGER NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "GameData_slug_key" ON "GameData"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeSessionId_key" ON "GameServerOrder"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripePaymentIntent_key" ON "GameServerOrder"("stripePaymentIntent");

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeChargeId_key" ON "GameServerOrder"("stripeChargeId");

-- CreateIndex
CREATE INDEX "GameServerOrder_stripeSessionId_idx" ON "GameServerOrder"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_stripeRefundId_idx" ON "Refund"("stripeRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketId_key" ON "SupportTicket"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketId_idx" ON "SupportTicket"("ticketId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_ptUsername_key" ON "user"("ptUsername");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_token_idx" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "JobRun_jobType_status_idx" ON "JobRun"("jobType", "status");

-- CreateIndex
CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "WorkerLog_jobType_level_createdAt_idx" ON "WorkerLog"("jobType", "level", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerLog_gameServerId_idx" ON "WorkerLog"("gameServerId");

-- CreateIndex
CREATE INDEX "WorkerLog_userId_idx" ON "WorkerLog"("userId");

-- CreateIndex
CREATE INDEX "WorkerLog_jobRunId_idx" ON "WorkerLog"("jobRunId");

-- CreateIndex
CREATE INDEX "ApplicationLog_level_createdAt_idx" ON "ApplicationLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationLog_type_createdAt_idx" ON "ApplicationLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationLog_userId_idx" ON "ApplicationLog"("userId");

-- CreateIndex
CREATE INDEX "ApplicationLog_gameServerId_idx" ON "ApplicationLog"("gameServerId");

-- CreateIndex
CREATE INDEX "ApplicationLog_path_method_idx" ON "ApplicationLog"("path", "method");

-- CreateIndex
CREATE INDEX "ApplicationLog_createdAt_idx" ON "ApplicationLog"("createdAt");

-- CreateIndex
CREATE INDEX "Email_GameServerId_status_idx" ON "Email"("GameServerId", "status");

-- CreateIndex
CREATE INDEX "Email_GameServerId_type_expiresAt_idx" ON "Email"("GameServerId", "type", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "KeyValue_key_key" ON "KeyValue"("key");

-- CreateIndex
CREATE INDEX "KeyValue_key_idx" ON "KeyValue"("key");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE INDEX "GameDataFeature_gameDataId_idx" ON "GameDataFeature"("gameDataId");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "RAM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServer" ADD CONSTRAINT "GameServer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationGameDataId_fkey" FOREIGN KEY ("creationGameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationLocationId_fkey" FOREIGN KEY ("creationLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "GameServerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_GameServerId_fkey" FOREIGN KEY ("GameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDataFeature" ADD CONSTRAINT "GameDataFeature_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDataFeature" ADD CONSTRAINT "GameDataFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "EggFeature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareRecommendation" ADD CONSTRAINT "HardwareRecommendation_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareRecommendation" ADD CONSTRAINT "HardwareRecommendation_preselectedPackageId_fkey" FOREIGN KEY ("preselectedPackageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
