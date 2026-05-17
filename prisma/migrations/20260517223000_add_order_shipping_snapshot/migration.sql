ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "stateOrProvinceCode" TEXT,
ADD COLUMN IF NOT EXISTS "shippingServiceType" TEXT,
ADD COLUMN IF NOT EXISTS "shippingServiceName" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCurrency" TEXT,
ADD COLUMN IF NOT EXISTS "shippingDeliveryTimestamp" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "shippingTransitTime" TEXT;
