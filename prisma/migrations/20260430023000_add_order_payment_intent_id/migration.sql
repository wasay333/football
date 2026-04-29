ALTER TABLE "Order"
ADD COLUMN "paymentIntentId" TEXT;

CREATE UNIQUE INDEX "Order_paymentIntentId_key"
ON "Order"("paymentIntentId");
