# Product UoM Catalog - UI Implementation Guide

## Overview

This guide explains how to implement the Product UoM Catalog system in your UI. The system allows products to use units of measure from a global catalog and define conversion relationships between them.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UoM Catalog (Global)                     │
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
│  ┌──────────────────────────────────────────────┐           │
│  │  Caja → Display (factor: 5)                  │           │
│  │  Display → Pieza (factor: 10)                │           │
│  │  Result: Caja → Pieza (factor: 50)           │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create Product

Create a new product with basic information.

**UI Components:**
- Text input: SKU
- Text input: Name
- Text area: Description
- Dropdown: Category (optional)
- Dropdown: Subcategory (optional)
- Button: Create Product

**API Call:**
```typescript
POST /api/tenant/products
{
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop",
  "category_id": null,
  "subcategory_id": null
}
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
  "uoms": [],
  "uom_relationships": [],
  "vendor_prices": [],
  "photos": [],
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

### Step 2: Load Available UoMs from Catalog

Display all available units of measure that can be assigned to the product.

**UI Components:**
- List/Table showing all catalog UoMs
- Columns: Name, Description
- Button: "Assign to Product" for each UoM

**API Call:**
```typescript
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

### Step 3: Assign UoMs to Product

Allow users to select and assign UoMs from the catalog to the product.

**UI Components:**
- Multi-select dropdown or checkbox list
- Show selected UoMs
- Button: "Assign Selected UoMs"
- Show assigned UoMs with "Remove" button

**API Call (for each selected UoM):**
```typescript
POST /api/tenant/products/{productId}/uoms
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

**Get Assigned UoMs:**
```typescript
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

### Step 4: Define UoM Relationships (Conversions)

Create conversion rules between assigned UoMs.

**UI Components:**
- Form with:
  - Dropdown: Source UoM (from assigned UoMs)
  - Dropdown: Target UoM (from assigned UoMs)
  - Number input: Conversion Factor
  - Button: "Create Relationship"
- Table showing existing relationships:
  - Columns: Source, Target, Factor, Actions
  - Button: "Delete" for each relationship

**Example Conversions:**
- 1 Caja = 5 Displays
- 1 Display = 10 Piezas
- Result: 1 Caja = 50 Piezas (automatic)

**API Call:**
```typescript
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "uom-uuid-3",
  "target_uom_id": "uom-uuid-2",
  "conversion_factor": 5
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

**Get Relationships:**
```typescript
GET /api/tenant/products/{productId}/uom-relationships
```

### Step 5: Test Conversions

Allow users to test quantity conversions between UoMs.

**UI Components:**
- Number input: Quantity
- Dropdown: From UoM
- Dropdown: To UoM
- Button: "Convert"
- Display result: "X units = Y units"

**API Call:**
```typescript
POST /api/tenant/products/{productId}/uom-convert
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

**Display:** "2 Cajas = 100 Piezas"

### Step 6: Set Vendor Prices

Assign prices per UoM for each vendor.

**UI Components:**
- Table with:
  - Columns: Vendor, UoM, Price, Actions
  - Button: "Add Price"
- Modal/Form:
  - Dropdown: Vendor
  - Dropdown: UoM
  - Number input: Price
  - Button: "Save"

**API Call:**
```typescript
POST /api/tenant/products/{productId}/vendor-prices
{
  "vendor_id": "vendor-uuid",
  "uom_id": "uom-uuid-1",
  "price": 999.99
}
```

## Complete Product View

After all steps, the product should display:

```
Product: Laptop Dell XPS 13
SKU: LAPTOP-001
Description: High-performance laptop

Units of Measure:
├── Pieza (Individual unit)
├── Display (Display package)
└── Caja (Complete box)

Conversions:
├── 1 Caja = 5 Displays
├── 1 Display = 10 Piezas
└── 1 Caja = 50 Piezas (calculated)

Vendor Prices:
├── Vendor A - Pieza: $999.99
├── Vendor A - Caja: $9,999.90
└── Vendor B - Display: $4,999.95
```

## Error Handling

### Duplicate UoM Assignment
```json
{
  "statusCode": 409,
  "message": "This UoM is already assigned to this product",
  "error": "Conflict"
}
```
**UI Action:** Show error message, prevent duplicate assignment

### Invalid Conversion Factor
```json
{
  "statusCode": 400,
  "message": "Conversion factor must be greater than zero",
  "error": "Bad Request"
}
```
**UI Action:** Validate input, show error message

### No Conversion Path
```json
{
  "statusCode": 400,
  "message": "No conversion path found between UoM X and UoM Y",
  "error": "Bad Request"
}
```
**UI Action:** Show error, suggest creating missing relationships

### UoM in Use
```json
{
  "statusCode": 409,
  "message": "Cannot delete UoM: it is referenced by vendor product prices",
  "error": "Conflict"
}
```
**UI Action:** Show error, prevent deletion, suggest removing references first

## TypeScript Types

```typescript
// UoM Catalog
interface UoMCatalog {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Product UoM
interface ProductUoM {
  id: string;
  product_id: string;
  uom_catalog_id: string;
  catalog: UoMCatalog;
  created_at: Date;
  updated_at: Date;
}

// UoM Relationship
interface UoMRelationship {
  id: string;
  product_id: string;
  source_uom_id: string;
  target_uom_id: string;
  conversion_factor: number;
  created_at: Date;
  updated_at: Date;
}

// Vendor Price
interface VendorPrice {
  id: string;
  vendor_id: string;
  product_id: string;
  uom_id: string;
  price: string;
  created_at: Date;
  updated_at: Date;
}

// Complete Product
interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  subcategory_id?: string;
  uoms: ProductUoM[];
  uom_relationships: UoMRelationship[];
  vendor_prices: VendorPrice[];
  photos: ProductPhoto[];
  created_at: Date;
  updated_at: Date;
}
```

## Implementation Checklist

- [ ] Create product form
- [ ] Load and display catalog UoMs
- [ ] Implement UoM assignment UI
- [ ] Show assigned UoMs with remove option
- [ ] Create relationship form with validation
- [ ] Display relationship graph/tree
- [ ] Implement quantity converter
- [ ] Add vendor price management
- [ ] Handle all error cases
- [ ] Add loading states
- [ ] Add success notifications
- [ ] Test multi-step conversions
- [ ] Test edge cases (circular conversions, etc.)

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/uom-catalog` | List all catalog UoMs |
| GET | `/api/uom-catalog/:id` | Get specific catalog UoM |
| POST | `/api/tenant/products/:productId/uoms` | Assign UoM to product |
| GET | `/api/tenant/products/:productId/uoms` | Get product UoMs |
| GET | `/api/tenant/products/:productId/uoms/:uomId` | Get specific product UoM |
| DELETE | `/api/tenant/products/:productId/uoms/:uomId` | Remove UoM from product |
| POST | `/api/tenant/products/:productId/uom-relationships` | Create conversion |
| GET | `/api/tenant/products/:productId/uom-relationships` | Get conversions |
| DELETE | `/api/tenant/products/:productId/uom-relationships/:relationshipId` | Delete conversion |
| POST | `/api/tenant/products/:productId/uom-convert` | Test conversion |
| POST | `/api/tenant/products/:productId/vendor-prices` | Set vendor price |
| GET | `/api/tenant/products/:productId/vendor-prices` | Get vendor prices |
| DELETE | `/api/tenant/products/:productId/vendor-prices/:priceId` | Delete vendor price |
