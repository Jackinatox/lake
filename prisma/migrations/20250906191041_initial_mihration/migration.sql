-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."GameServerStatus" AS ENUM ('CREATED', 'CREATION_FAILED', 'ACTIVE', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('NEW', 'UPGRADE', 'DOWNGRADE', 'RENEW');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'CLOSED', 'PENDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."GameData" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "data" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GameData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "diskPrice" DOUBLE PRECISION,
    "portsLimit" INTEGER,
    "backupsLimit" INTEGER,
    "enabled" BOOLEAN DEFAULT true,
    "ptLocationId" INTEGER NOT NULL DEFAULT 1,
    "cpuId" INTEGER NOT NULL DEFAULT 1,
    "ramId" INTEGER NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CPU" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "cores" INTEGER,
    "threads" INTEGER,
    "singleScore" INTEGER,
    "multiScore" INTEGER,
    "maxThreads" INTEGER,
    "minThreads" INTEGER,
    "pricePerCore" DOUBLE PRECISION NOT NULL DEFAULT 0.2,

    CONSTRAINT "CPU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RAM" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "speed" INTEGER,
    "pricePerGb" DOUBLE PRECISION,
    "minGb" DOUBLE PRECISION DEFAULT 0.5,
    "maxGb" DOUBLE PRECISION DEFAULT 12,

    CONSTRAINT "RAM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameServer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "backupCount" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "ptServerId" TEXT,
    "ptAdminId" INTEGER,
    "name" TEXT DEFAULT 'GameServer',
    "status" "public"."GameServerStatus" NOT NULL DEFAULT 'CREATED',
    "errorText" TEXT,
    "gameConfig" JSONB,
    "gameDataId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameServerOrder" (
    "id" SERIAL NOT NULL,
    "gameServerId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "public"."OrderType" NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "diskMB" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT,
    "stripeSessionId" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "gameConfig" JSONB,
    "creationGameDataId" INTEGER,
    "creationLocationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
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

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeSessionId_key" ON "public"."GameServerOrder"("stripeSessionId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "public"."SupportTicket"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "public"."CPU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "public"."RAM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "public"."GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "public"."GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationGameDataId_fkey" FOREIGN KEY ("creationGameDataId") REFERENCES "public"."GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationLocationId_fkey" FOREIGN KEY ("creationLocationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
