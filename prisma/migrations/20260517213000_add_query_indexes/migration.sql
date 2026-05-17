CREATE INDEX IF NOT EXISTS "Footballer_createdAt_idx" ON "Footballer"("createdAt");

CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_categoryId_createdAt_idx" ON "Product"("categoryId", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_footballerId_createdAt_idx" ON "Product"("footballerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_allowPreorder_stock_createdAt_idx" ON "Product"("allowPreorder", "stock", "createdAt");

CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_customerEmail_createdAt_idx" ON "Order"("customerEmail", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_isPreorder_status_createdAt_idx" ON "Order"("isPreorder", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
