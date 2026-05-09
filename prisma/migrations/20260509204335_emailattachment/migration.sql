-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" SERIAL NOT NULL,
    "emailId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
