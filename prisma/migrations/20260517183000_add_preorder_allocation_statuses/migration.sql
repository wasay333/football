CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING',
  'AWAITING_STOCK',
  'READY_TO_SHIP',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED'
);

ALTER TABLE "Order"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order"
ALTER COLUMN "status" TYPE "OrderStatus_new"
USING ("status"::text::"OrderStatus_new");

ALTER TABLE "OrderStatusHistory"
ALTER COLUMN "status" TYPE "OrderStatus_new"
USING ("status"::text::"OrderStatus_new");

DROP TYPE "OrderStatus";

ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

ALTER TABLE "Order"
ALTER COLUMN "status" SET DEFAULT 'PENDING';

UPDATE "Order"
SET "status" = 'AWAITING_STOCK'
WHERE "isPreorder" = TRUE
  AND "status" = 'CONFIRMED'
  AND "trackingNumber" IS NULL
  AND "shippingLabelBase64" IS NULL;
