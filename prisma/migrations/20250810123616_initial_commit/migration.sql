-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'CREATED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."GameServerStatus" AS ENUM ('CREATED', 'INSTALLING', 'CREATION_FAILED', 'ACTIVE', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('NEW', 'UPGRADE', 'DOWNGRADE', 'RENEW');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "ptKey" TEXT,
    "ptUser" INTEGER,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Authenticator" (
    "credentialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialId")
);

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
    "name" TEXT DEFAULT 'GameServer',
    "status" "public"."GameServerStatus" NOT NULL DEFAULT 'CREATED',
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
    "reciept_url" TEXT,
    "stripeSessionId" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "errorText" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "gameConfig" JSONB,
    "creationGameDataId" INTEGER NOT NULL,
    "creationLocationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameServerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialId_key" ON "public"."Authenticator"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "GameServerOrder_stripeSessionId_key" ON "public"."GameServerOrder"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "public"."CPU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "public"."RAM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "public"."GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServer" ADD CONSTRAINT "GameServer_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "public"."GameServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationGameDataId_fkey" FOREIGN KEY ("creationGameDataId") REFERENCES "public"."GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameServerOrder" ADD CONSTRAINT "GameServerOrder_creationLocationId_fkey" FOREIGN KEY ("creationLocationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
