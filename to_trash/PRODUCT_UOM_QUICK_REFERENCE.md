# Product UoM System - Quick Reference Card

## The Flow (Step by Step)

```
1. Create Product
   ↓
2. Load Catalog UoMs (GET /api/uom-catalog)
   ↓
3. Assign UoMs to Product (POST /api/tenant/products/{id}/uoms)
   ↓
4. Create Conversions (POST /api/tenant/products/{id}/uom-relationships)
   ↓
5. Test Conversions (POST /api/tenant/products/{id}/uom-convert)
   ↓
6. Set Vendor Prices (POST /api/tenant/products/{id}/vendor-prices)
```

## API Endpoints Cheat Sheet

### Get Catalog UoMs
```
GET /api/uom-catalog
Response: Array of { id, name, description }
```

### Assign UoM to Product
```
POST /api/tenant/products/{productId}/uoms
Body: { "uom_catalog_id": "uuid" }
Response: { id, product_id, uom_catalog_id, catalog: {...} }
```

### Get Product UoMs
```
GET /api/tenant/products/{productId}/uoms
Response: Array of assigned UoMs
```

### Create Conversion
```
POST /api/tenant/products/{productId}/uom-relationships
Body: {
  "source_uom_id": "uuid",
  "target_uom_id": "uuid",
  "conversion_factor": 5
}
Response: { id, product_id, source_uom_id, target_uom_id, conversion_factor }
```

### Get Conversions
```
GET /api/tenant/products/{productId}/uom-relationships
Response: Array of relationships
```

### Convert Quantity
```
POST /api/tenant/products/{productId}/uom-convert
Body: {
  "quantity": 2,
  "from_uom_id": "uuid",
  "to_uom_id": "uuid"
}
Response: { "converted_quantity": 100 }
```

### Set Vendor Price
```
POST /api/tenant/products/{productId}/vendor-prices
Body: {
  "vendor_id": "uuid",
  "uom_id": "uuid",
  "price": 999.99
}
Response: { id, vendor_id, product_id, uom_id, price }
```

## Example: Laptop Product

### 1. Create Product
```json
POST /api/tenant/products
{
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop"
}
→ Returns: { id: "prod-123", ... }
```

### 2. Get Catalog UoMs
```
GET /api/uom-catalog
→ Returns: [
  { id: "pieza-id", name: "Pieza", ... },
  { id: "display-id", name: "Display", ... },
  { id: "caja-id", name: "Caja", ... }
]
```

### 3. Assign UoMs
```
POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "pieza-id" }
→ Returns: { id: "uom-1", product_id: "prod-123", uom_catalog_id: "pieza-id" }

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "display-id" }
→ Returns: { id: "uom-2", product_id: "prod-123", uom_catalog_id: "display-id" }

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "caja-id" }
→ Returns: { id: "uom-3", product_id: "prod-123", uom_catalog_id: "caja-id" }
```

### 4. Create Conversions
```
POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-3",
  "target_uom_id": "uom-2",
  "conversion_factor": 5
}
→ 1 Caja = 5 Displays

POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-2",
  "target_uom_id": "uom-1",
  "conversion_factor": 10
}
→ 1 Display = 10 Piezas
```

### 5. Test Conversion
```
POST /api/tenant/products/prod-123/uom-convert
{
  "quantity": 2,
  "from_uom_id": "uom-3",
  "to_uom_id": "uom-1"
}
→ Returns: { "converted_quantity": 100 }
→ Meaning: 2 Cajas = 100 Piezas
```

### 6. Set Vendor Prices
```
POST /api/tenant/products/prod-123/vendor-prices
{
  "vendor_id": "vendor-456",
  "uom_id": "uom-1",
  "price": 999.99
}
→ Pieza costs $999.99

POST /api/tenant/products/prod-123/vendor-prices
{
  "vendor_id": "vendor-456",
  "uom_id": "uom-3",
  "price": 9999.90
}
→ Caja costs $9,999.90
```

## Catalog UoMs Available

| Name | Description |
|------|-------------|
| Pieza | Individual unit |
| Display | Display package |
| Caja | Complete box |
| Pallet | Complete pallet |
| Bulto | Product bundle |
| Docena | Twelve units |
| Metro | Linear meter |
| Kilogramo | Kilogram weight |

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "This UoM is already assigned" | Duplicate assignment | Don't assign same UoM twice |
| "Conversion factor must be > 0" | Invalid factor | Use positive number |
| "No conversion path found" | Missing relationship | Create intermediate conversions |
| "Cannot delete UoM: referenced by prices" | UoM in use | Delete prices first |
| "Cannot delete UoM: referenced by relationships" | UoM in use | Delete relationships first |

## UI Components Needed

- [ ] Product form (create)
- [ ] Catalog UoM list/table
- [ ] UoM assignment multi-select
- [ ] Assigned UoMs display with remove buttons
- [ ] Conversion form (source, target, factor)
- [ ] Conversions table with delete buttons
- [ ] Quantity converter (quantity, from, to, convert button)
- [ ] Vendor price table (vendor, UoM, price)
- [ ] Add/edit/delete vendor price modals

## Key Points

1. **Catalog is Global** - All tenants share the same UoMs
2. **Products Reference Catalog** - Don't create new UoMs, assign from catalog
3. **Conversions are Product-Specific** - Each product defines its own conversion rules
4. **Bidirectional** - Can convert in both directions (forward and reverse)
5. **Multi-Step** - System automatically finds paths through multiple conversions
6. **Unique Constraints** - One product can't use same catalog UoM twice

## Response Format

All successful responses follow this pattern:
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2026-03-07T00:00:00Z",
  "updated_at": "2026-03-07T00:00:00Z"
}
```

All errors follow this pattern:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Testing Checklist

- [ ] Create product
- [ ] Load catalog UoMs
- [ ] Assign single UoM
- [ ] Assign multiple UoMs
- [ ] Try duplicate assignment (should fail)
- [ ] Create conversion
- [ ] Create multi-step conversion
- [ ] Test quantity conversion
- [ ] Test reverse conversion
- [ ] Set vendor price
- [ ] Get complete product with all relations
- [ ] Delete UoM with vendor price (should fail)
- [ ] Delete UoM with relationship (should fail)
- [ ] Delete relationship, then delete UoM (should work)
