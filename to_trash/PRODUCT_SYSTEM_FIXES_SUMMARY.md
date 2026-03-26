# Product System Fixes Summary

## Issues Fixed

### 1. ✅ Product Controller Route Ordering
**Problem**: The `@Get()` list endpoint was defined after parameterized routes like `@Get(':id')`, causing NestJS to match `:id` before the list endpoint, resulting in 404 errors.

**Solution**: Reordered routes in `product.controller.ts`:
- `@Get()` - List all products (now first)
- `@Get('sku/:sku')` - Get by SKU
- `@Get('category/:categoryId')` - List by category
- `@Get('subcategory/:subcategoryId')` - List by subcategory
- `@Get(':id')` - Get by ID (now last)

**File**: `src/api/products/controllers/product.controller.ts`

### 2. ✅ UoM Catalog Migration Fix
**Problem**: Migration `1772812691000-remove-code-from-uom-catalog.ts` had TypeScript errors with `TableIndex` syntax and was trying to drop a column that didn't exist in the initial schema.

**Solution**: 
- Removed unused `TableIndex` import
- Added safety check to verify column exists before dropping
- Used raw SQL for index recreation in the `down()` method
- Migration successfully ran and removed the `code` column from `uom_catalog` table

**File**: `src/database/migrations/1772812691000-remove-code-from-uom-catalog.ts`

### 3. ✅ UoM Catalog Seeding
**Problem**: Seed script was failing with "Field 'code' doesn't have a default value" error.

**Solution**: 
- Ran migrations first to ensure schema is correct
- Seed script now successfully creates 8 UoMs in the catalog:
  - Pieza (Individual unit)
  - Display (Display package)
  - Caja (Complete box)
  - Pallet (Complete pallet)
  - Bulto (Product bundle)
  - Docena (Twelve units)
  - Metro (Linear meter)
  - Kilogramo (Kilogram weight)

**File**: `src/database/scripts/seed-uom-catalog.ts`

## Product System API Endpoints

### List Products
```
GET /api/tenant/products
```
Returns all products for the tenant with relations (UoMs, relationships, vendor prices, photos).

### Get Product by ID
```
GET /api/tenant/products/:id
```
Returns a specific product with all relations.

### Get Product by SKU
```
GET /api/tenant/products/sku/:sku
```
Returns a product by its SKU code.

### List Products by Category
```
GET /api/tenant/products/category/:categoryId
```
Returns all products in a specific category.

### List Products by Subcategory
```
GET /api/tenant/products/subcategory/:subcategoryId
```
Returns all products in a specific subcategory.

### Create Product
```
POST /api/tenant/products
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Optional description",
  "category_id": "uuid-optional",
  "subcategory_id": "uuid-optional"
}
```

### Update Product
```
PATCH /api/tenant/products/:id
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Updated Name",
  "description": "Updated description",
  "category_id": "uuid-or-null",
  "subcategory_id": "uuid-or-null"
}
```

### Delete Product
```
DELETE /api/tenant/products/:id
```

## UoM Catalog API Endpoints

### List All UoMs in Catalog
```
GET /api/uom-catalog
```
Returns all available units of measure in the global catalog.

### Get UoM by ID
```
GET /api/uom-catalog/:id
```

### Create UoM in Catalog
```
POST /api/uom-catalog
Content-Type: application/json

{
  "name": "Unidad",
  "description": "Optional description"
}
```

### Update UoM in Catalog
```
PATCH /api/uom-catalog/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete UoM from Catalog
```
DELETE /api/uom-catalog/:id
```

## Product UoM Assignment Flow

### 1. Get Available UoMs
```
GET /api/uom-catalog
```

### 2. Assign UoM to Product
```
POST /api/tenant/products/:productId/uoms
Content-Type: application/json

{
  "uom_catalog_id": "uuid-from-catalog"
}
```

### 3. Create UoM Relationships (Conversions)
```
POST /api/tenant/products/:productId/uom-relationships
Content-Type: application/json

{
  "source_uom_id": "uuid",
  "target_uom_id": "uuid",
  "conversion_factor": "10.5"
}
```

Example: 1 Caja = 5 Displays
- source_uom_id: Caja
- target_uom_id: Display
- conversion_factor: 5

## Key Points

- **Categories & Subcategories**: Optional fields on products (can be null)
- **UoM Catalog**: Global, non-tenant-specific catalog of units of measure
- **Product UoMs**: Each product can have multiple UoMs from the catalog
- **UoM Relationships**: Define conversion factors between UoMs for a specific product
- **Vendor Prices**: Can be set per UoM for each vendor

## Next Steps

1. Test product endpoints with proper JWT tokens and permissions
2. Verify category/subcategory assignment works correctly
3. Test UoM assignment and relationship creation
4. Implement vendor price assignment endpoints
5. Test product photo upload functionality
