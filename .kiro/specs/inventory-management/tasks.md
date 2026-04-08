# Inventory Management Module - Implementation Tasks

## Overview
Create a complete inventory management module with batch tracking, RBAC permissions, and API endpoints.

---

## Tasks

### Phase 1: Module Setup & RBAC

- [x] 1. Create inventory module structure
  - Create `src/api/inventory/` directory
  - Create `inventory.module.ts`
  - Create `inventory.controller.ts`
  - Create `inventory.service.ts`

- [x] 2. Add RBAC permissions for inventory
  - Add `inventory:read` permission
  - Add `inventory:write` permission
  - Add `inventory:delete` permission
  - Register permissions in RBAC system

- [x] 3. Create inventory DTOs
  - `BatchResponseDto` - Batch data response
  - `BatchListResponseDto` - Paginated batch list
  - `BatchFilterDto` - Query filters (purchase_order_id, warehouse_id, product_id, etc.)

---

### Phase 2: Batch Management Endpoints

- [x] 4. Implement GET /tenant/inventory/batches
  - List all batches with pagination
  - Support filters: purchase_order_id, warehouse_id, product_id, batch_number
  - Load relations: product, warehouse, uom, purchase_order_batch
  - Apply tenant isolation
  - Require `inventory:read` permission

- [x] 5. Implement GET /tenant/inventory/batches/:id
  - Get single batch by ID
  - Load all relations
  - Apply tenant isolation
  - Require `inventory:read` permission

- [x] 6. Implement GET /tenant/inventory/batches/purchase-order/:poId
  - Get all batches for a specific purchase order
  - Support pagination
  - Load all relations
  - Apply tenant isolation
  - Require `inventory:read` permission

---

### Phase 3: Service Layer

- [x] 7. Implement BatchesService
  - `findAll(tenantId, filters, pagination)` - List batches with filters
  - `findById(id, tenantId)` - Get single batch
  - `findByPurchaseOrderId(poId, tenantId, pagination)` - Get batches by PO
  - `calculateTotalQuantity(batches)` - Sum quantities
  - Proper error handling and logging

---

### Phase 4: Integration & Testing

- [x] 8. Register inventory module in app.module.ts
  - Import InventoryModule
  - Ensure RBAC guards are applied

- [x] 9. Write integration tests
  - Test GET /tenant/inventory/batches
  - Test GET /tenant/inventory/batches/:id
  - Test GET /tenant/inventory/batches/purchase-order/:poId
  - Test pagination and filters
  - Test tenant isolation
  - Test permission checks

- [x] 10. Verify end-to-end flow
  - Create PO → Receive items → Verify batches appear in inventory endpoints
  - Test all filter combinations
  - Verify response structure matches DTOs

---

## Notes
- All endpoints require JWT authentication
- All endpoints require tenant isolation
- All endpoints require appropriate RBAC permissions
- Batches are created automatically during PO receipt process
- No manual batch creation needed (read-only endpoints)
