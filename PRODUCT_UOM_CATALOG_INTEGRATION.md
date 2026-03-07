# Product UoM Catalog Integration Guide

## Overview

The product system uses a **global UoM Catalog** as the source of truth for all units of measure. Products don't create their own UoMs; instead, they reference UoMs from the catalog and define conversion relationships between them.

## Architecture

### 1. UoM Catalog (Global)
- **Non-tenant specific** - shared across all tenants
- Contains standard units: Pieza, Display, Caja, Pallet, Bulto, Docena, Metro, Kilogramo
- Each UoM has: `id`, `name`, `description`
- Managed via `/api/uom-catalog` endpoints

### 2. Product UoMs (Product-Specific)
- Each product can use multiple UoMs from the catalog
- Links product to catalog via `uom_catalog_id`
- Stored in `uoms` table with reference to `uom_catalog`
- Unique constraint: one product cannot use the same catalog UoM twice

### 3. UoM Relationships (Conversion Rules)
- Define how UoMs convert for a specific product
- Example: 1 Caja = 5 Displays
- Bidirectional: can convert in both directions
- Supports multi-step conversions (Caja → Display → Pieza)

## API Workflow

### Step 1: Get Available UoMs from Catalog

```http
GET /api/uom-catalog
```

**Response:**
```json
[
  {
    "id": "39656255-872d-48b3-856d-27f2c8c47b28",
    "name": "Pieza",
    "description": "Unidad individual",
    "created_at": "2026-03-07T00:00:00Z",
    "updated_at": "2026-03-07T00:00:00Z"
  },
  {
    "id": "d238eaa4-720b-4a91-8d0e-282d2280b468",
    "name": "Display",
    "description": "Paquete de display",
    "created_at": "2026-03-07T00:00:00Z",
    "updated_at": "2026-03-07T00:00:00Z"
  },
  {
    "id": "d7b7dd31-1887-45e8-9657-bb003eea9f93",
    "name": "Caja",
    "description": "Caja completa",
    "created_at": "2026-03-07T00:00:00Z",
    "updated_at": "2026-03-07T00:00:00Z"
  }
]
```

### Step 2: Assign UoMs to Product

Assign one or more UoMs from the catalog to your product.

```http
POST /api/tenant/products/{productId}/uoms
Content-Type: application/json

{
  "uom_catalog_id": "39656255-872d-48b3-856d-27f2c8c47b28"
}
```

**Response:**
```json
{
  "id": "uom-uuid-1",
  "product_id": "product-uuid",
  "uom_catalog_id": "39656255-872d-48b3-856d-27f2c8c47b28",
  "catalog": {
    "id": "39656255-872d-48b3-856d-27f2c8c47b28",
    "name": "Pieza",
    "description": "Unidad individual"
  },
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

**Repeat for each UoM you want to assign:**
```http
POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "d238eaa4-720b-4a91-8d0e-282d2280b468" }  # Display

POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "d7b7dd31-1887-45e8-9657-bb003eea9f93" }  # Caja
```

### Step 3: Get Product UoMs

```http
GET /api/tenant/products/{productId}/uoms
```

**Response:**
```json
[
  {
    "id": "uom-uuid-1",
    "product_id": "product-uuid",
    "uom_catalog_id": "39656255-872d-48b3-856d-27f2c8c47b28",
    "catalog": {
      "id": "39656255-872d-48b3-856d-27f2c8c47b28",
      "name": "Pieza",
      "description": "Unidad individual"
    }
  },
  {
    "id": "uom-uuid-2",
    "product_id": "product-uuid",
    "uom_catalog_id": "d238eaa4-720b-4a91-8d0e-282d2280b468",
    "catalog": {
      "id": "d238eaa4-720b-4a91-8d0e-282d2280b468",
      "name": "Display",
      "description": "Paquete de display"
    }
  },
  {
    "id": "uom-uuid-3",
    "product_id": "product-uuid",
    "uom_catalog_id": "d7b7dd31-1887-45e8-9657-bb003eea9f93",
    "catalog": {
      "id": "d7b7dd31-1887-45e8-9657-bb003eea9f93",
      "name": "Caja",
      "description": "Caja completa"
    }
  }
]
```

### Step 4: Create UoM Relationships (Conversions)

Define how UoMs convert for this product.

**Example 1: 1 Caja = 5 Displays**
```http
POST /api/tenant/products/{productId}/uom-relationships
Content-Type: application/json

{
  "source_uom_id": "uom-uuid-3",
  "target_uom_id": "uom-uuid-2",
  "conversion_factor": 5
}
```

**Example 2: 1 Display = 10 Piezas**
```http
POST /api/tenant/products/{productId}/uom-relationships
Content-Type: application/json

{
  "source_uom_id": "uom-uuid-2",
  "target_uom_id": "uom-uuid-1",
  "conversion_factor": 10
}
```

**Response:**
```json
{
  "id": "relationship-uuid",
  "product_id": "product-uuid",
  "source_uom_id": "uom-uuid-3",
  "target_uom_id": "uom-uuid-2",
  "conversion_factor": 5,
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

### Step 5: Get Product UoM Relationships

```http
GET /api/tenant/products/{productId}/uom-relationships
```

**Response:**
```json
[
  {
    "id": "relationship-uuid-1",
    "product_id": "product-uuid",
    "source_uom_id": "uom-uuid-3",
    "target_uom_id": "uom-uuid-2",
    "conversion_factor": 5,
    "created_at": "2026-03-07T00:00:00Z"
  },
  {
    "id": "relationship-uuid-2",
    "product_id": "product-uuid",
    "source_uom_id": "uom-uuid-2",
    "target_uom_id": "uom-uuid-1",
    "conversion_factor": 10,
    "created_at": "2026-03-07T00:00:00Z"
  }
]
```

### Step 6: Convert Quantities

Convert quantities between UoMs using the defined relationships.

**Convert 2 Cajas to Piezas:**
```http
POST /api/tenant/products/{productId}/uom-convert
Content-Type: application/json

{
  "quantity": 2,
  "from_uom_id": "uom-uuid-3",
  "to_uom_id": "uom-uuid-1"
}
```

**Response:**
```json
{
  "converted_quantity": 100
}
```

Calculation: 2 Cajas × 5 Displays/Caja × 10 Piezas/Display = 100 Piezas

## Complete Example: Laptop Product

### 1. Create Product
```http
POST /api/tenant/products
{
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop"
}
```

### 2. Assign UoMs from Catalog
```http
POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "39656255-872d-48b3-856d-27f2c8c47b28" }  # Pieza

POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "d238eaa4-720b-4a91-8d0e-282d2280b468" }  # Display

POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "d7b7dd31-1887-45e8-9657-bb003eea9f93" }  # Caja
```

### 3. Define Conversions
```http
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "uom-uuid-display",
  "target_uom_id": "uom-uuid-pieza",
  "conversion_factor": 1
}

POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "uom-uuid-caja",
  "target_uom_id": "uom-uuid-display",
  "conversion_factor": 10
}
```

### 4. Set Vendor Prices
```http
POST /api/tenant/products/{productId}/vendor-prices
{
  "vendor_id": "vendor-uuid",
  "uom_id": "uom-uuid-pieza",
  "price": 999.99
}

POST /api/tenant/products/{productId}/vendor-prices
{
  "vendor_id": "vendor-uuid",
  "uom_id": "uom-uuid-caja",
  "price": 9999.90
}
```

### 5. Get Complete Product
```http
GET /api/tenant/products/{productId}
```

**Response:**
```json
{
  "id": "product-uuid",
  "tenant_id": "tenant-uuid",
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop",
  "category_id": null,
  "subcategory_id": null,
  "uoms": [
    {
      "id": "uom-uuid-1",
      "product_id": "product-uuid",
      "uom_catalog_id": "39656255-872d-48b3-856d-27f2c8c47b28",
      "catalog": {
        "id": "39656255-872d-48b3-856d-27f2c8c47b28",
        "name": "Pieza",
        "description": "Unidad individual"
      }
    },
    {
      "id": "uom-uuid-2",
      "product_id": "product-uuid",
      "uom_catalog_id": "d238eaa4-720b-4a91-8d0e-282d2280b468",
      "catalog": {
        "id": "d238eaa4-720b-4a91-8d0e-282d2280b468",
        "name": "Display",
        "description": "Paquete de display"
      }
    },
    {
      "id": "uom-uuid-3",
      "product_id": "product-uuid",
      "uom_catalog_id": "d7b7dd31-1887-45e8-9657-bb003eea9f93",
      "catalog": {
        "id": "d7b7dd31-1887-45e8-9657-bb003eea9f93",
        "name": "Caja",
        "description": "Caja completa"
      }
    }
  ],
  "uom_relationships": [
    {
      "id": "rel-uuid-1",
      "product_id": "product-uuid",
      "source_uom_id": "uom-uuid-2",
      "target_uom_id": "uom-uuid-1",
      "conversion_factor": 1
    },
    {
      "id": "rel-uuid-2",
      "product_id": "product-uuid",
      "source_uom_id": "uom-uuid-3",
      "target_uom_id": "uom-uuid-2",
      "conversion_factor": 10
    }
  ],
  "vendor_prices": [
    {
      "id": "price-uuid-1",
      "vendor_id": "vendor-uuid",
      "product_id": "product-uuid",
      "uom_id": "uom-uuid-1",
      "price": "999.990000"
    },
    {
      "id": "price-uuid-2",
      "vendor_id": "vendor-uuid",
      "product_id": "product-uuid",
      "uom_id": "uom-uuid-3",
      "price": "9999.900000"
    }
  ],
  "photos": [],
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

## Key Concepts

### Conversion Factor
- **Definition**: How many target units equal one source unit
- **Example**: 1 Caja = 5 Displays → conversion_factor = 5
- **Must be > 0**
- **Bidirectional**: Can convert in both directions

### Multi-Step Conversions
The system automatically finds conversion paths through multiple steps:
- Caja → Display (factor: 5)
- Display → Pieza (factor: 10)
- **Result**: Caja → Pieza (factor: 50)

### Unique Constraints
- One product cannot use the same catalog UoM twice
- One product cannot have duplicate relationships (same source + target)
- Source and target UoMs must be different

## UI Implementation Checklist

- [ ] Display available UoMs from catalog
- [ ] Allow selecting multiple UoMs to assign to product
- [ ] Show assigned UoMs with catalog details
- [ ] Allow creating conversion relationships with visual editor
- [ ] Show conversion graph/tree
- [ ] Allow testing conversions with quantity calculator
- [ ] Display vendor prices per UoM
- [ ] Handle errors (duplicate UoMs, invalid conversions, etc.)

## Error Handling

### Common Errors

**Duplicate UoM Assignment**
```json
{
  "statusCode": 409,
  "message": "This UoM is already assigned to this product",
  "error": "Conflict"
}
```

**Invalid Conversion Factor**
```json
{
  "statusCode": 400,
  "message": "Conversion factor must be greater than zero",
  "error": "Bad Request"
}
```

**No Conversion Path**
```json
{
  "statusCode": 400,
  "message": "No conversion path found between UoM X and UoM Y",
  "error": "Bad Request"
}
```

**UoM in Use**
```json
{
  "statusCode": 409,
  "message": "Cannot delete UoM: it is referenced by vendor product prices",
  "error": "Conflict"
}
```
