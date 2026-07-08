-- CreateTable
CREATE TABLE "CheckoutCustomerSnapshot" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateOrProvinceCode" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutCustomerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutCustomerSnapshot_paymentIntentId_key" ON "CheckoutCustomerSnapshot"("paymentIntentId");

-- CreateIndex
CREATE INDEX "CheckoutCustomerSnapshot_createdAt_idx" ON "CheckoutCustomerSnapshot"("createdAt");
