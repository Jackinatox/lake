-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "ptKey" TEXT,
    "ptUser" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
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
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Authenticator" (
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
CREATE TABLE "GameData" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "data" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GameData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
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
CREATE TABLE "CPU" (
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
CREATE TABLE "RAM" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "speed" INTEGER,
    "pricePerGb" DOUBLE PRECISION,
    "minGb" DOUBLE PRECISION DEFAULT 0.5,
    "maxGb" DOUBLE PRECISION DEFAULT 12,

    CONSTRAINT "RAM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerIntend" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cpuId" INTEGER NOT NULL,
    "ramId" INTEGER NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 1,
    "gameConfig" JSONB,
    "gameDataId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerIntend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialId_key" ON "Authenticator"("credentialId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "RAM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerIntend" ADD CONSTRAINT "ServerIntend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerIntend" ADD CONSTRAINT "ServerIntend_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerIntend" ADD CONSTRAINT "ServerIntend_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerIntend" ADD CONSTRAINT "ServerIntend_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "RAM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
