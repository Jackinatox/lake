-- CreateTable
CREATE TABLE "InvoicePdf" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePdf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePdf_orderId_key" ON "InvoicePdf"("orderId");

-- AddForeignKey
ALTER TABLE "InvoicePdf" ADD CONSTRAINT "InvoicePdf_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "GameServerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
