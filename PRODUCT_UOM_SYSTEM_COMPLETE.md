# Product UoM Catalog System - Complete Implementation

## What Was Done

### 1. Fixed Product Controller Routes
- Reordered GET endpoints so list endpoint comes before parameterized routes
- Fixes 404 error when listing products
- Routes now properly match in order: list → sku → category → subcategory → id

### 2. Fixed UoM Catalog Migration
- Removed TypeScript errors in migration
- Added safety checks for column existence
- Successfully migrated database schema

### 3. Seeded UoM Catalog
- Created 8 global units of measure:
  - Pieza (Individual unit)
  - Display (Display package)
  - Caja (Complete box)
  - Pallet (Complete pallet)
  - Bulto (Product bundle)
  - Docena (Twelve units)
  - Metro (Linear meter)
  - Kilogramo (Kilogram weight)

### 4. Updated UoM Service & Controller
- Changed from product-specific UoM creation to catalog-based assignment
- Products now reference UoMs from the global catalog
- Removed code/name fields from product UoM creation
- Added `assignUoMFromCatalog()` method
- Added validation to prevent duplicate UoM assignments

### 5. Created UoMCatalogRepository
- New repository for accessing catalog UoMs
- Supports CRUD operations on catalog
- Integrated into ProductsModule

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UoM Catalog (Global)                     │
│                   Non-tenant specific                       │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │   Pieza      │   Display    │    Caja      │             │
│  │ (Individual) │  (Package)   │   (Box)      │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    (Select & Assign)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Product UoMs (Product-Specific)                │
│                  Tenant-specific                            │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │   Pieza      │   Display    │    Caja      │             │
│  │ (from cat)   │ (from cat)   │ (from cat)   │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  (Define Conversions)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           UoM Relationships (Conversion Rules)              │
│                  Tenant-specific                            │
│  ┌──────────────────────────────────────────────┐           │
│  │  Caja → Display (factor: 5)                  │           │
│  │  Display → Pieza (factor: 10)                │           │
│  │  Result: Caja → Pieza (factor: 50)           │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Global UoM Catalog
- Shared across all tenants
- Managed via `/api/uom-catalog` endpoints
- Contains standard units of measure
- Immutable by products (only referenced)

### 2. Product UoM Assignment
- Products select UoMs from catalog
- One product cannot use same catalog UoM twice
- Unique constraint: `(product_id, uom_catalog_id)`
- Supports multiple UoMs per product

### 3. UoM Conversions
- Define conversion factors between UoMs
- Bidirectional conversions (forward and reverse)
- Multi-step conversions (automatic path finding)
- Example: Caja → Display → Pieza

### 4. Quantity Conversion
- Convert quantities between any UoMs
- Automatic path finding through relationships
- BFS algorithm for finding conversion paths
- Supports complex conversion chains

### 5. Vendor Pricing
- Set prices per UoM for each vendor
- Different prices for different UoMs
- Example: Pieza = $999.99, Caja = $9,999.90

## API Endpoints

### UoM Catalog (Global)
```
GET    /api/uom-catalog              - List all catalog UoMs
GET    /api/uom-catalog/:id          - Get specific catalog UoM
POST   /api/uom-catalog              - Create new catalog UoM
PATCH  /api/uom-catalog/:id          - Update catalog UoM
DELETE /api/uom-catalog/:id          - Delete catalog UoM
```

### Product UoMs
```
POST   /api/tenant/products/:productId/uoms              - Assign UoM from catalog
GET    /api/tenant/products/:productId/uoms              - Get product UoMs
GET    /api/tenant/products/:productId/uoms/:uomId       - Get specific product UoM
DELETE /api/tenant/products/:productId/uoms/:uomId       - Remove UoM from product
```

### UoM Relationships
```
POST   /api/tenant/products/:productId/uom-relationships              - Create conversion
GET    /api/tenant/products/:productId/uom-relationships              - Get conversions
DELETE /api/tenant/products/:productId/uom-relationships/:relationshipId - Delete conversion
```

### Quantity Conversion
```
POST   /api/tenant/products/:productId/uom-convert       - Convert quantity
```

### Vendor Prices
```
POST   /api/tenant/products/:productId/vendor-prices     - Set vendor price
GET    /api/tenant/products/:productId/vendor-prices     - Get vendor prices
DELETE /api/tenant/products/:productId/vendor-prices/:priceId - Delete vendor price
```

## Database Schema

### uom_catalog (Global)
```sql
CREATE TABLE uom_catalog (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uom_catalog_name (name)
);
```

### uoms (Product-Specific)
```sql
CREATE TABLE uoms (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  uom_catalog_id VARCHAR(36),
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY product_catalog_index (product_id, uom_catalog_id),
  INDEX product_index (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (uom_catalog_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT
);
```

### uom_relationships (Conversion Rules)
```sql
CREATE TABLE uom_relationships (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  source_uom_id VARCHAR(36) NOT NULL,
  target_uom_id VARCHAR(36) NOT NULL,
  conversion_factor DECIMAL(18,6) NOT NULL CHECK (conversion_factor > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY product_source_target_index (product_id, source_uom_id, target_uom_id),
  INDEX product_index (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (source_uom_id) REFERENCES uoms(id) ON DELETE CASCADE,
  FOREIGN KEY (target_uom_id) REFERENCES uoms(id) ON DELETE CASCADE,
  CHECK (source_uom_id != target_uom_id)
);
```

## Example Workflow

### 1. Create Product
```bash
POST /api/tenant/products
{
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop"
}
```

### 2. Get Catalog UoMs
```bash
GET /api/uom-catalog
```

### 3. Assign UoMs to Product
```bash
POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "pieza-id" }

POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "display-id" }

POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "caja-id" }
```

### 4. Create Conversions
```bash
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "caja-uom-id",
  "target_uom_id": "display-uom-id",
  "conversion_factor": 5
}

POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "display-uom-id",
  "target_uom_id": "pieza-uom-id",
  "conversion_factor": 10
}
```

### 5. Test Conversion
```bash
POST /api/tenant/products/{productId}/uom-convert
{
  "quantity": 2,
  "from_uom_id": "caja-uom-id",
  "to_uom_id": "pieza-uom-id"
}
# Response: { "converted_quantity": 100 }
# Calculation: 2 Cajas × 5 Displays/Caja × 10 Piezas/Display = 100 Piezas
```

### 6. Set Vendor Prices
```bash
POST /api/tenant/products/{productId}/vendor-prices
{
  "vendor_id": "vendor-id",
  "uom_id": "pieza-uom-id",
  "price": 999.99
}

POST /api/tenant/products/{productId}/vendor-prices
{
  "vendor_id": "vendor-id",
  "uom_id": "caja-uom-id",
  "price": 9999.90
}
```

## Files Modified/Created

### Modified
- `src/api/products/controllers/product.controller.ts` - Fixed route ordering
- `src/api/products/controllers/uom.controller.ts` - Updated for catalog-based UoMs
- `src/api/products/services/uom.service.ts` - Updated for catalog-based UoMs
- `src/api/products/dto/create-uom.dto.ts` - Changed to use catalog ID
- `src/api/products/products.module.ts` - Added UoMCatalogRepository
- `src/database/migrations/1772812691000-remove-code-from-uom-catalog.ts` - Fixed migration

### Created
- `src/api/products/repositories/uom-catalog.repository.ts` - New repository
- `PRODUCT_UOM_CATALOG_INTEGRATION.md` - Integration guide
- `PRODUCT_UOM_UI_IMPLEMENTATION.md` - UI implementation guide
- `PRODUCT_UOM_SYSTEM_COMPLETE.md` - This file

## Next Steps for UI

1. **Display Catalog UoMs**
   - Fetch from `/api/uom-catalog`
   - Show in list/table format
   - Allow selection for assignment

2. **Assign UoMs to Product**
   - Multi-select interface
   - POST to `/api/tenant/products/{productId}/uoms`
   - Show assigned UoMs with remove option

3. **Create Conversions**
   - Form with source/target dropdowns
   - Number input for conversion factor
   - POST to `/api/tenant/products/{productId}/uom-relationships`
   - Display conversion graph

4. **Test Conversions**
   - Quantity input
   - From/To UoM dropdowns
   - POST to `/api/tenant/products/{productId}/uom-convert`
   - Display result

5. **Set Vendor Prices**
   - Table with vendor/UoM/price
   - Add/edit/delete functionality
   - POST/PATCH/DELETE to `/api/tenant/products/{productId}/vendor-prices`

## Error Handling

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common errors:
- **409 Conflict**: Duplicate UoM assignment, UoM in use
- **400 Bad Request**: Invalid conversion factor, no conversion path
- **404 Not Found**: Product/UoM/Catalog not found
- **403 Forbidden**: Permission denied

## Testing

### Manual Testing
1. Create product
2. Assign multiple UoMs
3. Create conversions
4. Test quantity conversions
5. Set vendor prices
6. Verify product retrieval includes all relations

### Edge Cases
- Duplicate UoM assignment (should fail)
- Circular conversions (should work)
- Multi-step conversions (should calculate correctly)
- Removing UoM with vendor prices (should fail)
- Removing UoM with relationships (should fail)

## Performance Considerations

- UoM Catalog is global and cached
- Product UoMs are loaded with product
- Relationships use BFS for path finding (O(V+E))
- Indexes on product_id, uom_catalog_id for fast lookups
- Unique constraints prevent duplicates

## Security

- All endpoints require JWT authentication
- RBAC permissions enforced (Product:Read, Product:Update)
- Tenant isolation via tenant_id
- Foreign key constraints prevent orphaned records
- Check constraints ensure valid data (conversion_factor > 0)
