-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "normalizedAttributes" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL,
    "cost" DECIMAL,
    "quantityTotal" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "quantityRented" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "ProductVariant" (
    "id",
    "productId",
    "companyId",
    "sku",
    "label",
    "attributes",
    "normalizedAttributes",
    "price",
    "cost",
    "quantityTotal",
    "quantityReserved",
    "quantityRented",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    'var-' || "id",
    "id",
    "companyId",
    "code",
    'Único',
    '{}',
    '',
    NULL,
    NULL,
    "quantityTotal",
    "quantityReserved",
    "quantityRented",
    "isActive",
    "createdAt",
    "updatedAt"
FROM "Product";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT,
    "basePrice" DECIMAL NOT NULL,
    "baseCost" DECIMAL,
    "type" TEXT NOT NULL DEFAULT 'BOTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" (
    "id",
    "companyId",
    "name",
    "categoryId",
    "description",
    "basePrice",
    "baseCost",
    "type",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "companyId",
    "name",
    "categoryId",
    "description",
    "price",
    "cost",
    "type",
    "isActive",
    "createdAt",
    "updatedAt"
FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" (
    "id",
    "companyId",
    "productVariantId",
    "userId",
    "type",
    "quantity",
    "referenceType",
    "referenceId",
    "notes",
    "createdAt"
)
SELECT
    "id",
    "companyId",
    'var-' || "productId",
    "userId",
    "type",
    "quantity",
    "referenceType",
    "referenceId",
    "notes",
    "createdAt"
FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_companyId_productVariantId_idx" ON "StockMovement"("companyId", "productVariantId");

CREATE TABLE "new_SaleOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleOrderId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "SaleOrderItem_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleOrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SaleOrderItem" (
    "id",
    "saleOrderId",
    "productVariantId",
    "quantity",
    "unitPrice"
)
SELECT
    "id",
    "saleOrderId",
    'var-' || "productId",
    "quantity",
    "unitPrice"
FROM "SaleOrderItem";
DROP TABLE "SaleOrderItem";
ALTER TABLE "new_SaleOrderItem" RENAME TO "SaleOrderItem";

CREATE TABLE "new_RentalOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalOrderId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "RentalOrderItem_rentalOrderId_fkey" FOREIGN KEY ("rentalOrderId") REFERENCES "RentalOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalOrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RentalOrderItem" (
    "id",
    "rentalOrderId",
    "productVariantId",
    "quantity",
    "unitPrice"
)
SELECT
    "id",
    "rentalOrderId",
    'var-' || "productId",
    "quantity",
    "unitPrice"
FROM "RentalOrderItem";
DROP TABLE "RentalOrderItem";
ALTER TABLE "new_RentalOrderItem" RENAME TO "RentalOrderItem";

CREATE TABLE "new_RentalReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalReturnId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantityReturned" INTEGER NOT NULL,
    "quantityMissing" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RentalReturnItem_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalReturnItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RentalReturnItem" (
    "id",
    "rentalReturnId",
    "productVariantId",
    "quantityReturned",
    "quantityMissing"
)
SELECT
    "id",
    "rentalReturnId",
    'var-' || "productId",
    "quantityReturned",
    "quantityMissing"
FROM "RentalReturnItem";
DROP TABLE "RentalReturnItem";
ALTER TABLE "new_RentalReturnItem" RENAME TO "RentalReturnItem";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProductVariant_companyId_idx" ON "ProductVariant"("companyId");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE UNIQUE INDEX "ProductVariant_companyId_sku_key" ON "ProductVariant"("companyId", "sku");
CREATE UNIQUE INDEX "ProductVariant_productId_normalizedAttributes_key" ON "ProductVariant"("productId", "normalizedAttributes");
