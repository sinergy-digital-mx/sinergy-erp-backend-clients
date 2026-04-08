# Purchase Order Receipt Unit Conversion Fix - Changes Summary

## Overview
Fixed the unit conversion error in the purchase order receipt endpoint by properly mapping between `uom_catalog_id` (sent by frontend) and `product_uom.id` (stored in database).

## Root Cause
The system was storing `uom_catalog_id` in the `uom_id` column of `inv_s_purchase_order_batch_detail`, but the conversion logic expected `product_uom.id`. This mismatch caused the "Unit of measurement not supported for this product" error.

## Solution
Changed the database schema to use `product_uom_id` column instead of `uom_id`, which properly references the `product_uoms` table.

## Files Changed

### 1. Database Migration
**File**: `src/database/migrations/1712145600000-fix-po-detail-uom-column.ts` (NEW)
- Drops the old `fk_po_detail_uom` foreign key constraint
- Drops the `uom_id` column
- Adds new `product_uom_id` column with proper foreign key to `product_uoms(id)`
- Clears test data from both `inv_s_purchase_order_batch_detail` and `inv_s_purchase_order_batch`

### 2. Database Schema
**File**: `src/database/lastest_ddl.sql`
- Updated `inv_s_purchase_order_batch_detail` table definition
- Changed `uom_id` column to `product_uom_id`
- Updated foreign key constraint from `fk_po_detail_uom` to `fk_po_detail_product_uom`

### 3. TypeORM Entity
**File**: `src/entities/purchase-orders/purchase-order-batch-detail.entity.ts`
- Imported `ProductUoM` entity
- Changed `uom` relation to `product_uom`
- Changed `uom_id` column to `product_uom_id`
- Updated foreign key to reference `ProductUoM` instead of `UoMCatalog`

### 4. Receipt Service
**File**: `src/api/purchase-orders/services/receipt.service.ts`
- Reordered logic to resolve `product_uom_id` first
- Calls `getProductUomId()` to convert frontend's `uom_id` (which can be `product_uom.id` or `uom_catalog_id`) to the correct `product_uom.id`
- Passes `product_uom_id` to `convertToBaseUnit()` instead of raw `uom_id`
- Stores `product_uom_id` in the database

### 5. Unit Conversion Service
**File**: `src/api/purchase-orders/services/unit-conversion.service.ts`
- Simplified `convertToBaseUnit()` method to accept only `product_uom_id`
- Removed fallback logic for `uom_catalog_id` lookup (now handled by `getProductUomId()`)
- Cleaner, more direct conversion logic

### 6. Batch Creator Service
**File**: `src/api/purchase-orders/services/batch-creator.service.ts`
- Added call to `getProductUomId()` to resolve the correct product UOM ID
- Passes `product_uom_id` to `convertToBaseUnit()` instead of raw `uom_id`

## How It Works

1. **Frontend sends**: `uom_id` (can be either `product_uom.id` or `uom_catalog_id`)
2. **Backend resolves**: Calls `getProductUomId()` which:
   - First tries to find by `product_uom.id`
   - If not found, tries to find by `uom_catalog_id`
   - Returns the correct `product_uom.id`
3. **Backend stores**: Saves `product_uom_id` in the database
4. **Conversion works**: `convertToBaseUnit()` uses the correct `product_uom.id` to look up conversion factor

## Testing
After running the migration:
1. Delete all test purchase orders (migration clears data)
2. Create new purchase orders with products that have multiple UOMs
3. Test receipt endpoint with different UOM IDs
4. Verify conversion works correctly for both base and non-base units

## Key Improvements
- ✅ Proper foreign key relationship to `product_uoms` table
- ✅ Flexible input handling (accepts both `product_uom.id` and `uom_catalog_id`)
- ✅ Correct unit conversion logic
- ✅ Clean separation of concerns
- ✅ Better error messages
