-- CreateTable
CREATE TABLE "CheckoutDiscountRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "fixedTotal" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutDiscountRule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "discountLabel" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutDiscountRule_itemCount_key" ON "CheckoutDiscountRule"("itemCount");

-- CreateIndex
CREATE INDEX "CheckoutDiscountRule_isActive_itemCount_idx" ON "CheckoutDiscountRule"("isActive", "itemCount");
