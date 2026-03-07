# Design Document: Product System

## Overview

A minimal, clean product management system with three core entities: Product, Unit of Measure (UoM), and Vendor Product Price. The system supports hierarchical UoM relationships that enable cascading conversions between units, and vendor-specific pricing tied to those units. The design prioritizes data integrity through referential constraints and cascade deletion.

## Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         API/Application Layer           │
├─────────────────────────────────────────┤
│         Service Layer                   │
│  - ProductService                       │
│  - UoMService                           │
│  - VendorProductPriceService            │
├─────────────────────────────────────────┤
│         Repository Layer                │
│  - ProductRepository                    │
│  - UoMRepository                        │
│  - UoMRelationshipRepository            │
│  - VendorProductPriceRepository         │
├─────────────────────────────────────────┤
│         Data Layer (Database)           │
│  - Products table                       │
│  - UoMs table                           │
│  - UoM_Relationships table              │
│  - Vendor_Product_Prices table          │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### Product Entity

```
Product {
  id: UUID (primary key)
  sku: string (unique, not null)
  name: string (not null)
  description: string (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

**Responsibilities:**
- Represent a catalog item with unique SKU
- Maintain association with UoMs
- Maintain association with UoM relationships
- Maintain association with vendor prices

### Unit of Measure (UoM) Entity

```
UoM {
  id: UUID (primary key)
  product_id: UUID (foreign key to Product, not null)
  code: string (not null)
  name: string (not null)
  created_at: timestamp
  updated_at: timestamp
  
  Constraint: UNIQUE(product_id, code)
}
```

**Responsibilities:**
- Define a unit in which a product can be measured
- Belong to exactly one product
- Participate in UoM relationships

### UoM Relationship Entity

```
UoM_Relationship {
  id: UUID (primary key)
  product_id: UUID (foreign key to Product, not null)
  source_uom_id: UUID (foreign key to UoM, not null)
  target_uom_id: UUID (foreign key to UoM, not null)
  conversion_factor: decimal (not null, > 0)
  created_at: timestamp
  updated_at: timestamp
  
  Constraints:
  - UNIQUE(product_id, source_uom_id, target_uom_id)
  - source_uom_id != target_uom_id
  - Both UoMs must belong to the same product
}
```

**Responsibilities:**
- Define hierarchical relationships between UoMs
- Enable conversion calculations
- Maintain cascade deletion constraints

### Vendor Product Price Entity

```
Vendor_Product_Price {
  id: UUID (primary key)
  vendor_id: UUID (foreign key to Vendor, not null)
  product_id: UUID (foreign key to Product, not null)
  uom_id: UUID (foreign key to UoM, not null)
  price: decimal (not null, >= 0)
  created_at: timestamp
  updated_at: timestamp
  
  Constraints:
  - UNIQUE(vendor_id, product_id, uom_id)
  - UoM must belong to the Product
}
```

**Responsibilities:**
- Store vendor-specific pricing for products in specific UoMs
- Reference valid UoMs from the product
- Enable pricing lookups for requisitions

### Service Interfaces

#### ProductService

```
interface ProductService {
  createProduct(sku: string, name: string, description?: string): Product
  getProduct(id: UUID): Product
  getProductBySku(sku: string): Product
  updateProduct(id: UUID, updates: Partial<Product>): Product
  deleteProduct(id: UUID): void
  listProducts(filters?: ProductFilters): Product[]
}
```

#### UoMService

```
interface UoMService {
  createUoM(productId: UUID, code: string, name: string): UoM
  getUoM(id: UUID): UoM
  getUoMsByProduct(productId: UUID): UoM[]
  updateUoM(id: UUID, updates: Partial<UoM>): UoM
  deleteUoM(id: UUID): void
  
  createRelationship(
    productId: UUID,
    sourceUoMId: UUID,
    targetUoMId: UUID,
    conversionFactor: decimal
  ): UoM_Relationship
  
  getRelationships(productId: UUID): UoM_Relationship[]
  deleteRelationship(id: UUID): void
  
  convertQuantity(
    productId: UUID,
    quantity: decimal,
    fromUoMId: UUID,
    toUoMId: UUID
  ): decimal
}
```

#### VendorProductPriceService

```
interface VendorProductPriceService {
  createPrice(
    vendorId: UUID,
    productId: UUID,
    uomId: UUID,
    price: decimal
  ): Vendor_Product_Price
  
  getPrice(id: UUID): Vendor_Product_Price
  getPricesByProduct(productId: UUID): Vendor_Product_Price[]
  getPricesByVendor(vendorId: UUID): Vendor_Product_Price[]
  getPriceByVendorProductUoM(
    vendorId: UUID,
    productId: UUID,
    uomId: UUID
  ): Vendor_Product_Price
  
  updatePrice(id: UUID, price: decimal): Vendor_Product_Price
  deletePrice(id: UUID): void
}
```

## Data Models

### Database Schema

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  sku VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE uoms (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, code)
);

CREATE TABLE uom_relationships (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE CASCADE,
  target_uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE CASCADE,
  conversion_factor DECIMAL(18, 6) NOT NULL CHECK (conversion_factor > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, source_uom_id, target_uom_id),
  CHECK (source_uom_id != target_uom_id)
);

CREATE TABLE vendor_product_prices (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE RESTRICT,
  price DECIMAL(18, 6) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, product_id, uom_id)
);

CREATE INDEX idx_uoms_product ON uoms(product_id);
CREATE INDEX idx_uom_relationships_product ON uom_relationships(product_id);
CREATE INDEX idx_vendor_prices_vendor ON vendor_product_prices(vendor_id);
CREATE INDEX idx_vendor_prices_product ON vendor_product_prices(product_id);
```

### Validation Rules

**Product Creation:**
- SKU must not be empty
- SKU must be unique across all products
- Name must not be empty

**UoM Creation:**
- Code must not be empty
- Code must be unique within the product
- Name must not be empty

**UoM Relationship Creation:**
- Conversion factor must be greater than zero
- Source and target UoMs must belong to the same product
- Source and target UoMs must be different

**Vendor Product Price Creation:**
- Price must be greater than or equal to zero
- UoM must belong to the referenced product
- Vendor, product, and UoM combination must be unique

**UoM Deletion:**
- Cannot delete if referenced by any vendor product price
- Cannot delete if referenced by any UoM relationship

**Product Deletion:**
- Cascade delete all associated UoMs
- Cascade delete all associated UoM relationships
- Cascade delete all associated vendor product prices

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Product SKU Uniqueness
*For any* two products, their SKUs must be different. Creating a product with a duplicate SKU must be rejected.
**Validates: Requirements 1.5**

### Property 2: Product Field Existence
*For any* product, it must have non-null id, sku, and name fields. The id must be unique across all products.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: UoM Code Uniqueness Within Product
*For any* product, no two UoMs can have the same code. Creating a UoM with a duplicate code within a product must be rejected.
**Validates: Requirements 2.4**

### Property 4: UoM Field Existence
*For any* UoM, it must have non-null id, code, and name fields. The id must be unique across all UoMs.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Product UoM Association
*For any* product, it must maintain a collection of UoMs. Adding a UoM to a product must increase the collection size by one. Removing a UoM must decrease it by one.
**Validates: Requirements 2.5**

### Property 6: UoM Relationship Validity
*For any* UoM relationship, the conversion factor must be greater than zero. Both source and target UoMs must belong to the same product and be different from each other.
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 7: UoM Conversion Round Trip
*For any* product with a defined UoM hierarchy, converting a quantity from UoM A to UoM B and back to UoM A must return the original quantity (within floating-point precision).
**Validates: Requirements 3.6**

### Property 8: Vendor Price UoM Validity
*For any* vendor product price, the referenced UoM must belong to the referenced product. Creating a vendor price with an invalid UoM must be rejected.
**Validates: Requirements 4.4, 4.6**

### Property 9: Vendor Price Non-Negative
*For any* vendor product price, the price must be greater than or equal to zero. Creating a vendor price with a negative price must be rejected.
**Validates: Requirements 4.7**

### Property 10: Multiple Vendor Prices Per Product
*For any* product, multiple vendor prices can exist for the same vendor in different UoMs. The combination of vendor, product, and UoM must be unique.
**Validates: Requirements 4.8**

### Property 11: UoM Deletion Constraint - Vendor Prices
*For any* UoM that is referenced by a vendor product price, attempting to delete the UoM must fail. The UoM can only be deleted after all referencing vendor prices are removed.
**Validates: Requirements 5.1**

### Property 12: UoM Deletion Constraint - Relationships
*For any* UoM that is referenced by a UoM relationship, attempting to delete the UoM must fail. The UoM can only be deleted after all referencing relationships are removed.
**Validates: Requirements 5.2**

### Property 13: Product Cascade Deletion
*For any* product, deleting it must cascade delete all associated UoMs, UoM relationships, and vendor product prices. After deletion, no orphaned records should exist.
**Validates: Requirements 5.3**

### Property 14: Vendor Cascade Deletion
*For any* vendor, deleting it must cascade delete all associated vendor product prices. After deletion, no vendor product prices should reference the deleted vendor.
**Validates: Requirements 5.4**

## Error Handling

### Validation Errors

**Duplicate SKU:**
- Error Code: `PRODUCT_SKU_DUPLICATE`
- Message: "A product with this SKU already exists"
- HTTP Status: 409 Conflict

**Invalid UoM Code:**
- Error Code: `UOM_CODE_DUPLICATE`
- Message: "A UoM with this code already exists for this product"
- HTTP Status: 409 Conflict

**Invalid Conversion Factor:**
- Error Code: `INVALID_CONVERSION_FACTOR`
- Message: "Conversion factor must be greater than zero"
- HTTP Status: 400 Bad Request

**Invalid UoM Reference:**
- Error Code: `INVALID_UOM_REFERENCE`
- Message: "The specified UoM does not belong to this product"
- HTTP Status: 400 Bad Request

**Negative Price:**
- Error Code: `INVALID_PRICE`
- Message: "Price must be greater than or equal to zero"
- HTTP Status: 400 Bad Request

### Referential Integrity Errors

**UoM in Use by Vendor Price:**
- Error Code: `UOM_IN_USE_BY_PRICE`
- Message: "Cannot delete UoM: it is referenced by vendor product prices"
- HTTP Status: 409 Conflict

**UoM in Use by Relationship:**
- Error Code: `UOM_IN_USE_BY_RELATIONSHIP`
- Message: "Cannot delete UoM: it is referenced by UoM relationships"
- HTTP Status: 409 Conflict

**Not Found Errors:**
- Error Code: `PRODUCT_NOT_FOUND`
- Error Code: `UOM_NOT_FOUND`
- Error Code: `VENDOR_PRICE_NOT_FOUND`
- HTTP Status: 404 Not Found

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

- Product creation with valid/invalid SKUs
- UoM creation with duplicate codes
- UoM relationship creation with invalid conversion factors
- Vendor price creation with invalid UoMs or negative prices
- Deletion constraints and cascade behavior
- Boundary conditions (zero conversion factors, zero prices)

### Property-Based Testing

Property-based tests verify universal properties across all inputs:

- **Property 1**: SKU uniqueness across all product combinations
- **Property 2**: Product field existence and uniqueness
- **Property 3**: UoM code uniqueness within products
- **Property 4**: UoM field existence and uniqueness
- **Property 5**: Product-UoM association consistency
- **Property 6**: UoM relationship validity constraints
- **Property 7**: UoM conversion round-trip (round-trip property)
- **Property 8**: Vendor price UoM validity
- **Property 9**: Vendor price non-negativity
- **Property 10**: Multiple vendor prices uniqueness
- **Property 11**: UoM deletion constraints with vendor prices
- **Property 12**: UoM deletion constraints with relationships
- **Property 13**: Product cascade deletion completeness
- **Property 14**: Vendor cascade deletion completeness

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: product-system, Property {N}: {property_text}`
- Use property-based testing library appropriate for implementation language
- Generate random products, UoMs, relationships, and prices
- Verify properties hold across all generated combinations

