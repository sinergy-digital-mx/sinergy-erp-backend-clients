# Technical Design: Purchase Order Receipt Process

## Overview

The Purchase Order Receipt (Recibo de Compra) feature enables warehouse operators to record the receipt of products from purchase orders. When products arrive from a vendor, users register received quantities (which may differ from requested amounts), and the system automatically:

1. Creates inventory batches with unique batch numbers
2. Converts quantities to product base units
3. Calculates received totals (subtotal, IVA, IEPS)
4. Updates purchase order status to "Recibida"
5. Preserves audit trail of received data

The process is transactional, ensuring data consistency and enabling rollback on errors.

## Architecture

### High-Level Flow

```
User Input (Receipt Modal)
    ↓
Validation Layer (Receipt_Validator)
    ↓
Transaction Start
    ├─ Update Line Items (Line_Item_Updater)
    ├─ Create Batches (Batch_Creator)
    ├─ Calculate Totals (Total_Calculator)
    └─ Update PO Status (PO_Status_Updater)
    ↓
Transaction Commit/Rollback
    ↓
Response with Updated PO
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Receipt Controller                        │
│              (HTTP Endpoint: POST /receipt/:id)              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Receipt Service                             │
│         (Orchestrates receipt processing)                    │
├─────────────────────────────────────────────────────────────┤
│ Dependencies:                                                │
│ • Receipt_Validator                                          │
│ • Line_Item_Updater                                          │
│ • Batch_Creator                                              │
│ • Total_Calculator                                           │
│ • PO_Status_Updater                                          │
│ • Tenant_Validator                                           │
│ • DataSource (Transaction Management)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Batch      │ │   Unit      │ │   Batch    │
│   Creator    │ │ Conversion  │ │   Number   │
│              │ │   Service   │ │ Generator  │
└──────────────┘ └─────────────┘ └────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ Inventory    │ │ Purchase    │ │ Warehouse  │
│ Batch        │ │ Order       │ │ Repository │
│ Repository   │ │ Repository  │ │            │
└──────────────┘ └─────────────┘ └────────────┘
```

## Components and Interfaces

### 1. Receipt Controller

**Endpoint:** `POST /purchase-orders/:id/receipt`

**Request Body:**
```typescript
interface ReceivePurchaseOrderDto {
  received_items: ReceivedItemDto[];
}

interface ReceivedItemDto {
  line_item_id: string;
  product_id: string;
  uom_id: string;
  quantity: number;
  unit_total: number;
  iva_percentage: number;
  iva_unit: number;
  ieps_percentage: number;
  ieps_unit: number;
  expiration_date?: Date;
}
```

**Response:**
```typescript
interface PurchaseOrderBatch {
  id: string;
  folio: string;
  general_status: 'Recibida';
  received_subtotal: number;
  received_iva_total: number;
  received_ieps_total: number;
  received_total: number;
  line_items: PurchaseOrderBatchDetail[];
  // ... other fields
}
```

### 2. Receipt Service (Main Orchestrator)

**Responsibilities:**
- Coordinate all receipt processing steps
- Manage database transaction
- Handle error scenarios
- Return updated purchase order

**Key Method:**
```typescript
async receive(
  id: string,
  dto: ReceivePurchaseOrderDto,
  tenantId: string,
  userId: string
): Promise<PurchaseOrderBatch>
```

### 3. Receipt Validator Service

**Responsibilities:**
- Validate at least one product has received quantity > 0
- Validate all quantities are non-negative
- Validate quantities don't exceed limits (999,999.999)
- Validate line items exist

**Validations:**
```typescript
interface ValidationRules {
  minReceivedItems: 1;
  maxQuantity: 999999.999;
  quantityMustBeNonNegative: true;
  lineItemsMustExist: true;
}
```

### 4. Line Item Updater Service

**Responsibilities:**
- Store received original data (product, UOM, quantity, totals, taxes)
- Store converted data (quantity in base unit, base UOM ID)
- Update audit fields (updated_by, updated_at)

**Fields Updated:**
```
received_original_product_id
received_original_uom_id
received_original_quantity
received_original_unit_total
received_original_iva_percentage
received_original_iva_unit
received_original_ieps_percentage
received_original_ieps_unit
received_converted_quantity
received_converted_uom_id
updated_by
updated_at
```

### 5. Batch Creator Service

**Responsibilities:**
- Create inventory batch for each received item
- Generate unique batch number
- Set all batch fields (warehouse, product, quantity, references)
- Ensure tenant isolation

**Batch Creation Logic:**
```typescript
interface InventoryBatch {
  id: string;
  tenant_id: string;
  batch_number: string;  // Generated
  warehouse_id: string;  // From PO
  product_id: string;    // From received item
  uom_id: string;        // Base unit (converted)
  quantity: number;      // Converted to base unit
  purchase_order_batch_id: string;
  purchase_order_detail_id: string;
  created_by: string;
  created_at: Date;
}
```

### 6. Batch Number Generator Service

**Responsibilities:**
- Retrieve warehouse prefix
- Generate sequential number per warehouse
- Format as {prefix}-LOTE-{sequential_6_digits}
- Ensure uniqueness within tenant

**Algorithm:**
```
1. Get warehouse prefix from warehouse record
2. Query max sequential number for warehouse + tenant
3. Increment by 1
4. Pad to 6 digits with leading zeros
5. Format: {prefix}-LOTE-{padded_number}
6. Verify uniqueness in inv_s_batches table
```

**Example:**
- Warehouse: "MH" (Matriz)
- Last batch: MH-LOTE-000042
- Next batch: MH-LOTE-000043

### 7. Total Calculator Service

**Responsibilities:**
- Calculate received subtotal: Σ(quantity × unit_price)
- Calculate received IVA: Σ(iva_unit × quantity)
- Calculate received IEPS: Σ(ieps_unit × quantity)
- Calculate received total: subtotal + iva + ieps

**Calculation:**
```typescript
received_subtotal = Σ(received_quantity × unit_total)
received_iva_total = Σ(received_iva_unit × received_quantity)
received_ieps_total = Σ(received_ieps_unit × received_quantity)
received_total = received_subtotal + received_iva_total + received_ieps_total
```

### 8. Unit Conversion Service

**Responsibilities:**
- Retrieve product base unit
- Convert received quantity to base unit
- Handle unsupported conversions with error

**Conversion Logic:**
```typescript
async convertToBaseUnit(
  quantity: number,
  fromUomId: string,
  productId: string
): Promise<number>

async getBaseUom(productId: string): Promise<string>
```

### 9. PO Status Updater Service

**Responsibilities:**
- Update general_status to "Recibida"
- Set updated_by to current user
- Set updated_at to current timestamp

### 10. Tenant Validator Service

**Responsibilities:**
- Verify PO belongs to specified tenant
- Verify batch number uniqueness within tenant
- Set tenant_id on all created records

## Data Models

### Purchase Order Batch (inv_s_purchase_order_batch)

```sql
Fields Updated:
- general_status: 'Creada' → 'Recibida'
- received_subtotal: 0.00 → calculated
- received_iva_total: 0.00 → calculated
- received_ieps_total: 0.00 → calculated
- received_total: 0.00 → calculated
- updated_by: null → userId
- updated_at: current → current
```

### Purchase Order Detail (inv_s_purchase_order_batch_detail)

```sql
Fields Updated:
- received_original_product_id: null → product_id
- received_original_uom_id: null → uom_id
- received_original_quantity: null → quantity
- received_original_unit_total: null → unit_total
- received_original_iva_percentage: null → iva_percentage
- received_original_iva_unit: null → iva_unit
- received_original_ieps_percentage: null → ieps_percentage
- received_original_ieps_unit: null → ieps_unit
- received_converted_quantity: null → converted_quantity
- received_converted_uom_id: null → base_uom_id
- updated_by: null → userId
- updated_at: current → current
```

### Inventory Batch (inv_s_batches)

```sql
New Record Created:
- id: UUID
- tenant_id: from PO
- batch_number: generated
- warehouse_id: from PO
- product_id: from received item
- uom_id: base unit
- quantity: converted quantity
- purchase_order_batch_id: PO id
- purchase_order_detail_id: line item id
- created_by: userId
- created_at: current timestamp
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: At Least One Item Must Be Received

*For any* receipt request, if all received quantities are zero or missing, the system SHALL reject the request with a validation error.

**Validates: Requirements 2.1, 2.2**

### Property 2: Quantities Must Be Non-Negative

*For any* received item, if the quantity is negative, the system SHALL reject the request with a validation error indicating the specific line item.

**Validates: Requirements 2.3, 2.4**

### Property 3: Quantities Must Not Exceed Limits

*For any* received item, if the quantity exceeds 999,999.999, the system SHALL reject the request with a validation error.

**Validates: Requirements 2.5**

### Property 4: Batch Created for Each Received Item

*For any* receipt with N items having quantity > 0, the system SHALL create exactly N inventory batches.

**Validates: Requirements 3.1**

### Property 5: Batch Number Format Compliance

*For any* generated batch number, it SHALL match the pattern `{warehouse_prefix}-LOTE-{6_digit_sequential}` where the sequential number is zero-padded.

**Validates: Requirements 3.2, 12.2, 12.3**

### Property 6: Batch Number Uniqueness Within Tenant

*For any* tenant, no two batches SHALL have the same batch number.

**Validates: Requirements 3.5, 11.4, 12.5**

### Property 7: Batch References Correct Warehouse

*For any* created batch, the warehouse_id SHALL match the warehouse_id from the purchase order.

**Validates: Requirements 3.6**

### Property 8: Batch References Correct Product

*For any* created batch, the product_id SHALL match the product_id from the received item.

**Validates: Requirements 3.7**

### Property 9: Quantity Conversion to Base Unit

*For any* received item with quantity Q in UOM U, the batch SHALL store the quantity converted to the product's base unit, and the uom_id SHALL reference the base unit.

**Validates: Requirements 3.8, 3.9, 6.1, 6.2, 6.3, 6.4**

### Property 10: Batch References Correct PO and Line Item

*For any* created batch, the purchase_order_batch_id SHALL reference the PO, and the purchase_order_detail_id SHALL reference the specific line item.

**Validates: Requirements 3.10, 3.11**

### Property 11: Batch Audit Fields Set Correctly

*For any* created batch, the created_by SHALL be the current user ID, and the created_at SHALL be a recent timestamp.

**Validates: Requirements 3.12, 3.13**

### Property 12: PO Status Updated to Recibida

*For any* successful receipt, the purchase order's general_status SHALL be updated to "Recibida".

**Validates: Requirements 4.1**

### Property 13: PO Audit Fields Updated

*For any* successful receipt, the purchase order's updated_by SHALL be the current user ID, and updated_at SHALL be a recent timestamp.

**Validates: Requirements 4.2, 4.3**

### Property 14: Received Subtotal Calculation

*For any* receipt with items, the received_subtotal SHALL equal the sum of (received_quantity × unit_total) for all received items.

**Validates: Requirements 5.1**

### Property 15: Received IVA Calculation

*For any* receipt with items, the received_iva_total SHALL equal the sum of (iva_unit × received_quantity) for all received items.

**Validates: Requirements 5.2**

### Property 16: Received IEPS Calculation

*For any* receipt with items, the received_ieps_total SHALL equal the sum of (ieps_unit × received_quantity) for all received items.

**Validates: Requirements 5.3**

### Property 17: Received Total Calculation

*For any* receipt, the received_total SHALL equal (received_subtotal + received_iva_total + received_ieps_total).

**Validates: Requirements 5.4**

### Property 18: Line Item Original Data Preserved

*For any* received item, all original data (product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit) SHALL be stored in the received_original_* fields.

**Validates: Requirements 7.1 through 7.8**

### Property 19: Line Item Converted Data Stored

*For any* received item, the converted quantity (in base unit) and base uom_id SHALL be stored in received_converted_quantity and received_converted_uom_id.

**Validates: Requirements 7.9, 7.10**

### Property 20: Line Item Audit Fields Updated

*For any* updated line item, the updated_by SHALL be the current user ID, and updated_at SHALL be a recent timestamp.

**Validates: Requirements 7.11, 7.12**

### Property 21: Transaction Atomicity

*For any* receipt request, either all operations (line item updates, batch creation, PO update) succeed together, or all fail together with a rollback.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 22: Response Contains Updated PO

*For any* successful receipt, the response SHALL include the updated purchase order with all received totals, status "Recibida", and all line items with received data.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 23: Tenant Isolation

*For any* receipt request, the system SHALL only access and modify data belonging to the specified tenant.

**Validates: Requirements 11.1, 11.3**

### Property 24: Batch Number Sequential Increment

*For any* warehouse, when creating multiple batches sequentially, each batch number SHALL have a sequential number one greater than the previous batch in that warehouse.

**Validates: Requirements 3.4, 12.4**

### Property 25: Unit Conversion Error Handling

*For any* received item with an unsupported unit conversion, the system SHALL return an error indicating the conversion is not supported.

**Validates: Requirements 6.5**

### Property 26: Line Item Not Found Error

*For any* receipt request with a non-existent line_item_id, the system SHALL return a NotFoundException with the specific line item ID.

**Validates: Requirements 10.1**

### Property 27: Cross-Tenant Access Prevention

*For any* receipt request with a PO from a different tenant, the system SHALL return a NotFoundException.

**Validates: Requirements 11.2**

### Property 28: Error Logging

*For any* error during receipt processing, the system SHALL log the error with sufficient context (user ID, PO ID, tenant ID, error details).

**Validates: Requirements 10.4**

## Error Handling

### Error Scenarios

| Scenario | Exception | HTTP Status | Message |
|----------|-----------|-------------|---------|
| No items received | BadRequestException | 400 | "At least one product must be received" |
| Negative quantity | BadRequestException | 400 | "Received quantity cannot be negative for line item {id}" |
| Quantity exceeds limit | BadRequestException | 400 | "Received quantity exceeds maximum limit (999,999.999)" |
| Line item not found | NotFoundException | 404 | "Line item not found: {id}" |
| PO not found | NotFoundException | 404 | "Purchase order not found: {id}" |
| Cross-tenant access | NotFoundException | 404 | "Purchase order not found: {id}" |
| Unit conversion error | BadRequestException | 400 | "Unit conversion not supported from {fromUom} to base unit" |
| Database error | InternalServerErrorException | 500 | "Error processing receipt. Transaction rolled back." |

### Transaction Rollback

On any error:
1. All database changes are rolled back
2. No batches are created
3. No line items are updated
4. PO status remains unchanged
5. Error is logged with full context
6. User receives clear error message

## Testing Strategy

### Unit Testing

**Test Categories:**

1. **Validation Tests**
   - Test zero quantities rejection
   - Test negative quantities rejection
   - Test quantity limit validation
   - Test line item existence validation

2. **Calculation Tests**
   - Test subtotal calculation with various quantities and prices
   - Test IVA calculation with different percentages
   - Test IEPS calculation with different percentages
   - Test total calculation (subtotal + IVA + IEPS)

3. **Batch Creation Tests**
   - Test batch creation for each received item
   - Test batch number format
   - Test batch number uniqueness
   - Test batch references (PO, line item, warehouse, product)

4. **Unit Conversion Tests**
   - Test conversion to base unit
   - Test base unit retrieval
   - Test unsupported conversion error

5. **Data Persistence Tests**
   - Test line item original data storage
   - Test line item converted data storage
   - Test PO status update
   - Test PO totals update

6. **Error Handling Tests**
   - Test NotFoundException for missing line items
   - Test NotFoundException for missing PO
   - Test NotFoundException for cross-tenant access
   - Test transaction rollback on error

7. **Tenant Isolation Tests**
   - Test tenant validation
   - Test batch number uniqueness per tenant
   - Test cross-tenant access prevention

### Property-Based Testing

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check or similar library for TypeScript
- Tag each test with: `Feature: purchase-order-receipt, Property {number}: {property_text}`

**Property Test Examples:**

```typescript
// Property 1: At Least One Item Must Be Received
test('Property 1: At least one item must be received', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        line_item_id: fc.uuid(),
        quantity: fc.integer({ min: 0, max: 0 })
      }), { minLength: 1 }),
      (items) => {
        // Should reject if all quantities are 0
        expect(() => validateReceipt(items)).toThrow('At least one product must be received');
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: Quantities Must Be Non-Negative
test('Property 2: Quantities must be non-negative', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        line_item_id: fc.uuid(),
        quantity: fc.integer({ min: -1000, max: -1 })
      }), { minLength: 1 }),
      (items) => {
        // Should reject if any quantity is negative
        expect(() => validateReceipt(items)).toThrow('cannot be negative');
      }
    ),
    { numRuns: 100 }
  );
});

// Property 14: Received Subtotal Calculation
test('Property 14: Received subtotal calculation', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        quantity: fc.integer({ min: 1, max: 1000 }),
        unit_total: fc.float({ min: 0.01, max: 10000 })
      }), { minLength: 1 }),
      (items) => {
        const result = calculateReceivedSubtotal(items);
        const expected = items.reduce((sum, item) => sum + (item.quantity * item.unit_total), 0);
        expect(result).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 21: Transaction Atomicity
test('Property 21: Transaction atomicity', () => {
  fc.assert(
    fc.property(
      fc.record({
        poId: fc.uuid(),
        items: fc.array(fc.record({
          line_item_id: fc.uuid(),
          quantity: fc.integer({ min: 1, max: 1000 })
        }), { minLength: 1 }),
        shouldFail: fc.boolean()
      }),
      async (scenario) => {
        const initialState = await getPoState(scenario.poId);
        
        try {
          if (scenario.shouldFail) {
            // Inject error
            await receiveWithError(scenario.poId, scenario.items);
          } else {
            await receive(scenario.poId, scenario.items);
          }
        } catch (e) {
          // On error, state should be unchanged
          const finalState = await getPoState(scenario.poId);
          expect(finalState).toEqual(initialState);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

## Implementation Considerations

### Database Indexes

Ensure these indexes exist for performance:
```sql
CREATE INDEX idx_batch_number ON inv_s_batches(tenant_id, batch_number);
CREATE INDEX idx_po_warehouse ON inv_s_purchase_order_batch(warehouse_id, tenant_id);
CREATE INDEX idx_po_detail_po ON inv_s_purchase_order_batch_detail(purchase_order_batch_id);
```

### Transaction Isolation

Use database transaction isolation level: `READ_COMMITTED` or higher to prevent dirty reads.

### Concurrency Handling

- Use pessimistic locking on PO during receipt processing
- Batch number generation should use database sequence or atomic increment

### Performance Optimization

- Batch creation can be optimized with bulk insert if creating many batches
- Avoid N+1 queries by eager loading relationships
- Cache warehouse prefixes if frequently accessed

### Audit Trail

All operations are logged via:
- `created_by` / `updated_by` fields
- `created_at` / `updated_at` timestamps
- Database transaction logs

## Security Considerations

1. **Tenant Isolation**: All queries must filter by tenant_id
2. **Authorization**: Verify user has permission to receive POs
3. **Input Validation**: Validate all numeric inputs for range and precision
4. **SQL Injection**: Use parameterized queries (TypeORM handles this)
5. **Error Messages**: Don't expose internal database details in error messages
