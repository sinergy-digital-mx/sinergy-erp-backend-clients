# Purchase Orders System - Design Document

## Overview

The Purchase Orders System is a comprehensive NestJS-based module that provides complete purchase order lifecycle management for the Sinergy ERP platform. The system supports tenant-based multi-organization deployments with full RBAC integration, AWS S3 document management, and Mexican tax calculations (IVA and IEPS).

### Key Design Goals

- **Comprehensive Order Management**: Support complete PO lifecycle from creation to receipt/cancellation
- **Accurate Tax Calculations**: Implement Mexican tax calculations (IVA, IEPS) with proper rounding
- **Document Management**: Integrate with AWS S3 for secure document storage and retrieval
- **Tenant Isolation**: Complete data isolation between organizations
- **Data Integrity**: Proper validation of referential integrity with related entities
- **Scalability**: Efficient pagination and filtering for large PO datasets
- **Immutability**: Prevent modifications to cancelled purchase orders

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)                   │
│         PurchaseOrderController, LineItemController          │
│         PaymentController, DocumentController                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Service Layer                              │
│    PurchaseOrderService, LineItemService, PaymentService    │
│    DocumentService, TaxCalculationService                   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Data Access Layer (TypeORM)                 │
│    PurchaseOrder, LineItem, Payment, Document Entities      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│    purchase_orders, line_items, payments, documents tables   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    AWS S3 Storage                            │
│              Document file storage and retrieval             │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

- **TypeORM**: ORM for database operations
- **NestJS**: Framework for API and service layer
- **class-validator**: DTO validation
- **class-transformer**: DTO transformation
- **Swagger**: API documentation
- **AWS SDK**: S3 integration for document storage
- **RBAC Module**: Permission checking and tenant context
- **Vendor Module**: Vendor validation and information
- **Warehouse Module**: Warehouse validation and information

## Components and Interfaces

### 1. Purchase Order Entity

The core entity representing a purchase order.

```typescript
@Entity('purchase_orders')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('vendor_index', ['vendor_id'])
@Index('warehouse_index', ['warehouse_id'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Header Information
  @Column()
  vendor_id: string;

  @Column()
  creator_id: string;

  @Column()
  purpose: string;

  @Column()
  warehouse_id: string;

  @Column({ type: 'date' })
  tentative_receipt_date: Date;

  // Status
  @Column({
    type: 'enum',
    enum: ['En Proceso', 'Recibida', 'Cancelada'],
    default: 'En Proceso',
  })
  status: string;

  // Cancellation Information
  @Column({ nullable: true, type: 'date' })
  cancellation_date: Date;

  @Column({ nullable: true })
  cancellation_reason: string;

  // Payment Information
  @Column({
    type: 'enum',
    enum: ['Pagada', 'Parcial', 'No pagado'],
    default: 'No pagado',
  })
  payment_status: string;

  @Column({ nullable: true, type: 'date' })
  payment_date: Date;

  @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
  payment_amount: number;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  remaining_amount: number;

  // Totals (calculated from line items)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_iva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_ieps: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grand_total: number;

  // Relationships
  @OneToMany(() => LineItem, (lineItem) => lineItem.purchase_order, {
    cascade: true,
    eager: true,
  })
  line_items: LineItem[];

  @OneToMany(() => Payment, (payment) => payment.purchase_order, {
    cascade: true,
    eager: true,
  })
  payments: Payment[];

  @OneToMany(() => Document, (document) => document.purchase_order, {
    cascade: true,
  })
  documents: Document[];

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 2. Line Item Entity

Represents a product line in a purchase order.

```typescript
@Entity('line_items')
@Index('purchase_order_index', ['purchase_order_id'])
export class LineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.line_items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column()
  purchase_order_id: string;

  @Column()
  product_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 3. Payment Entity

Tracks payment information for purchase orders.

```typescript
@Entity('payments')
@Index('purchase_order_index', ['purchase_order_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column()
  purchase_order_id: string;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  payment_amount: number;

  @Column()
  payment_method: string;

  @Column({ nullable: true })
  reference_number: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 4. Document Entity

Represents documents attached to purchase orders.

```typescript
@Entity('documents')
@Index('purchase_order_index', ['purchase_order_id'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.documents, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Column()
  purchase_order_id: string;

  @Column()
  filename: string;

  @Column()
  file_type: string;

  @Column()
  s3_key: string;

  @Column()
  s3_url: string;

  @Column()
  uploader_id: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @CreateDateColumn({ type: 'timestamp' })
  upload_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 5. DTOs

#### CreatePurchaseOrderDto

```typescript
export class CreatePurchaseOrderDto {
  @IsUUID()
  vendor_id: string;

  @IsString()
  purpose: string;

  @IsUUID()
  warehouse_id: string;

  @IsDateString()
  tentative_receipt_date: string;

  @IsOptional()
  @IsEnum(['En Proceso', 'Recibida', 'Cancelada'])
  status?: string;
}
```

#### CreateLineItemDto

```typescript
export class CreateLineItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  iva_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ieps_percentage?: number;
}
```

#### RecordPaymentDto

```typescript
export class RecordPaymentDto {
  @IsDateString()
  payment_date: string;

  @IsNumber()
  @Min(0.01)
  payment_amount: number;

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  reference_number?: string;
}
```

#### CancelPurchaseOrderDto

```typescript
export class CancelPurchaseOrderDto {
  @IsString()
  @MinLength(10)
  cancellation_reason: string;
}
```

#### QueryPurchaseOrderDto

```typescript
export class QueryPurchaseOrderDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsEnum(['En Proceso', 'Recibida', 'Cancelada'])
  status?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
```

## Data Models

### Purchase Order Data Model

```
PurchaseOrder
├── Identity
│   ├── id (UUID)
│   ├── tenant_id (UUID, FK)
│   └── created_at, updated_at (Timestamps)
├── Header Information
│   ├── vendor_id (UUID, FK)
│   ├── creator_id (UUID, FK)
│   ├── purpose (String)
│   ├── warehouse_id (UUID, FK)
│   └── tentative_receipt_date (Date)
├── Status
│   ├── status (Enum: En Proceso, Recibida, Cancelada)
│   ├── cancellation_date (Date, nullable)
│   └── cancellation_reason (String, nullable)
├── Payment Information
│   ├── payment_status (Enum: Pagada, Parcial, No pagado)
│   ├── payment_date (Date, nullable)
│   ├── payment_amount (Decimal, nullable)
│   ├── payment_method (String, nullable)
│   └── remaining_amount (Decimal)
├── Totals (calculated)
│   ├── total_subtotal (Decimal)
│   ├── total_iva (Decimal)
│   ├── total_ieps (Decimal)
│   └── grand_total (Decimal)
└── Relationships
    ├── line_items (OneToMany)
    ├── payments (OneToMany)
    └── documents (OneToMany)
```

### Relationships

```
PurchaseOrder (N) ──── (1) RBACTenant
PurchaseOrder (1) ──── (N) LineItem
PurchaseOrder (1) ──── (N) Payment
PurchaseOrder (1) ──── (N) Document
```

### Validation Rules

1. **Status Values**: 'En Proceso', 'Recibida', 'Cancelada'
2. **Payment Status Values**: 'Pagada', 'Parcial', 'No pagado'
3. **Tax Percentages**: 0-100
4. **Currency Fields**: Decimal with 2 decimal places
5. **Cancelled POs**: Immutable (no modifications allowed)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Purchase Order Header Storage
*For any* valid purchase order data, creating a purchase order SHALL store all provided header fields (vendor_id, creator_id, purpose, warehouse_id, tentative_receipt_date) and they SHALL be retrievable unchanged.
**Validates: Requirements 1.1, 1.4**

### Property 2: UUID and Timestamp Generation
*For any* purchase order creation, the system SHALL assign a unique UUID identifier and record creation/update timestamps. Each purchase order SHALL have a distinct UUID, and created_at SHALL equal updated_at at creation time.
**Validates: Requirements 1.2**

### Property 3: Timestamp Preservation on Update
*For any* purchase order, when updated, the created_at timestamp SHALL remain unchanged while updated_at SHALL be newer than the original updated_at value.
**Validates: Requirements 1.3**

### Property 4: Search and Pagination
*For any* search query with filters (vendor_id, status, date range) and pagination parameters (page, limit), the returned purchase orders SHALL match the filter criteria and respect pagination boundaries. The response SHALL include total count and pagination metadata.
**Validates: Requirements 1.5**

### Property 5: Line Item Subtotal Calculation
*For any* line item with quantity and unit_price, the subtotal SHALL equal quantity × unit_price with proper decimal precision.
**Validates: Requirements 2.1**

### Property 6: IVA and IEPS Calculation
*For any* line item with subtotal and tax percentages, the IVA amount SHALL equal subtotal × IVA_percentage and IEPS amount SHALL equal subtotal × IEPS_percentage, both with proper decimal precision.
**Validates: Requirements 2.2**

### Property 7: Line Item Total Calculation
*For any* line item, the line_total SHALL equal subtotal + IVA_amount + IEPS_amount with proper decimal precision.
**Validates: Requirements 2.3**

### Property 8: Order Totals Calculation
*For any* purchase order with multiple line items, the order totals (total_subtotal, total_iva, total_ieps, grand_total) SHALL equal the sum of corresponding line item values.
**Validates: Requirements 2.4**

### Property 9: Line Item Edit Recalculation
*For any* line item edit, all affected totals (line item total and order totals) SHALL be recalculated and updated correctly.
**Validates: Requirements 2.5**

### Property 10: Line Item Removal Recalculation
*For any* line item removal, all order totals SHALL be recalculated to exclude the removed line item's values.
**Validates: Requirements 2.6**

### Property 11: Default Status is En Proceso
*For any* purchase order created without an explicit status, the status field SHALL default to 'En Proceso'.
**Validates: Requirements 3.1**

### Property 12: Status Transitions
*For any* purchase order, the status field SHALL support transitions between 'En Proceso', 'Recibida', and 'Cancelada' states. Any status value outside these three options SHALL be rejected.
**Validates: Requirements 3.2**

### Property 13: Status Change Timestamp
*For any* purchase order status change, a status_change_timestamp SHALL be recorded indicating when the status was updated.
**Validates: Requirements 3.3**

### Property 14: Status Filtering
*For any* query with a status filter, the returned purchase orders SHALL only include purchase orders with the specified status. Purchase orders with other statuses SHALL not be included.
**Validates: Requirements 3.4**

### Property 15: Cancelled PO Immutability
*For any* purchase order with status 'Cancelada', attempts to modify line items or payment information SHALL be rejected with an error indicating the PO is cancelled.
**Validates: Requirements 3.5**

### Property 16: Default Payment Status
*For any* purchase order created, the payment_status field SHALL default to 'No pagado'.
**Validates: Requirements 4.1**

### Property 17: Payment Information Storage
*For any* payment recorded, the payment_date, payment_amount, and payment_method SHALL be stored and retrievable.
**Validates: Requirements 4.2**

### Property 18: Payment Status Calculation
*For any* payment recorded, if payment_amount equals order grand_total, payment_status SHALL be 'Pagada'. If payment_amount is less than grand_total, payment_status SHALL be 'Parcial'. If payment_amount is zero, payment_status SHALL be 'No pagado'.
**Validates: Requirements 4.3**

### Property 19: Remaining Amount Calculation
*For any* purchase order with payment_status 'Parcial', the remaining_amount SHALL equal grand_total - payment_amount.
**Validates: Requirements 4.4**

### Property 20: Payment Information Retrieval
*For any* purchase order query, the response SHALL include complete payment information (payment_status, payment_date, payment_amount, remaining_amount).
**Validates: Requirements 4.5**

### Property 21: Cancelled PO Payment Prevention
*For any* purchase order with status 'Cancelada', attempts to record payment information SHALL be rejected with an error indicating the PO is cancelled.
**Validates: Requirements 4.6**

### Property 22: Document Upload and Metadata Storage
*For any* document uploaded to a purchase order, the document metadata (filename, file_type, upload_date, uploader_id) SHALL be stored and retrievable.
**Validates: Requirements 5.1**

### Property 23: S3 URL Generation
*For any* document uploaded, a secure S3 URL SHALL be generated and stored, allowing retrieval of the document from AWS S3.
**Validates: Requirements 5.2**

### Property 24: Document Deletion
*For any* document deleted, the document record SHALL be removed from the database and the corresponding file SHALL be deleted from AWS S3.
**Validates: Requirements 5.3**

### Property 25: Document Retrieval with PO
*For any* purchase order query, all associated documents SHALL be returned with their metadata and S3 URLs.
**Validates: Requirements 5.4**

### Property 26: Cascade Delete Documents on PO Deletion
*For any* purchase order deleted, all associated documents SHALL be deleted from both the database and AWS S3.
**Validates: Requirements 5.5**

### Property 27: Cancellation Recording
*For any* purchase order cancelled, the status SHALL be set to 'Cancelada', and cancellation_date and cancellation_reason SHALL be recorded.
**Validates: Requirements 6.1**

### Property 28: Cancelled PO Immutability (Comprehensive)
*For any* purchase order with status 'Cancelada', attempts to modify line items, payment information, or status SHALL be rejected.
**Validates: Requirements 6.2**

### Property 29: Historical Data Preservation
*For any* purchase order cancelled, all historical data (line items, payments, documents) SHALL be preserved and remain queryable for audit purposes.
**Validates: Requirements 6.3**

### Property 30: Cancellation Filtering
*For any* query with cancellation filter, the returned purchase orders SHALL only include cancelled purchase orders (status = 'Cancelada').
**Validates: Requirements 6.4**

### Property 31: Tenant Isolation in Creation
*For any* purchase order created by a user, the purchase order's tenant_id SHALL match the requesting user's tenant_id, and the purchase order SHALL only be accessible to users of that tenant.
**Validates: Requirements 7.1, 7.2**

### Property 32: Tenant Isolation in Mutations
*For any* purchase order from tenant A, when a user from tenant B attempts to update or delete it, the operation SHALL be rejected with a 403 Forbidden response.
**Validates: Requirements 7.3, 7.4**

### Property 33: Cascade Delete on Tenant Deletion
*For any* tenant, when the tenant is deleted, all purchase orders associated with that tenant_id and their documents SHALL be automatically deleted.
**Validates: Requirements 7.5**

### Property 34: Purchase Order Serialization Round Trip
*For any* purchase order with line items, payments, and documents, when serialized to JSON and then deserialized, the resulting purchase order object SHALL be equivalent to the original, preserving all fields, calculations, and relationships.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Validation Errors (400 Bad Request)

- Invalid vendor_id or warehouse_id (referential integrity)
- Invalid product_id in line items
- Invalid tax percentages (not 0-100)
- Invalid payment amount (negative or exceeding order total)
- Attempting to modify cancelled purchase order
- Invalid status transitions
- Missing required fields

### Authentication Errors (401 Unauthorized)

- Missing or invalid JWT token
- Expired token

### Authorization Errors (403 Forbidden)

- User lacks required permission (purchase_orders:Create, purchase_orders:Read, purchase_orders:Update, purchase_orders:Delete)
- User attempting to access purchase order from different tenant

### Not Found Errors (404 Not Found)

- Purchase order ID does not exist
- Line item ID does not exist
- Document ID does not exist

### Conflict Errors (409 Conflict)

- Attempting to modify cancelled purchase order
- Attempting to record payment on cancelled purchase order

## Testing Strategy

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions:

1. **Purchase Order Creation Tests**
   - Create PO with all header fields
   - Create PO with invalid vendor_id
   - Create PO with invalid warehouse_id
   - Verify default status is 'En Proceso'
   - Verify default payment_status is 'No pagado'

2. **Line Item Tests**
   - Add line item with valid data
   - Verify subtotal calculation
   - Verify IVA and IEPS calculations
   - Verify line total calculation
   - Edit line item and verify recalculation
   - Remove line item and verify order total recalculation

3. **Payment Tests**
   - Record full payment and verify status is 'Pagada'
   - Record partial payment and verify status is 'Parcial'
   - Verify remaining_amount calculation
   - Attempt payment on cancelled PO (should fail)

4. **Status Management Tests**
   - Transition status between valid states
   - Attempt invalid status transitions (should fail)
   - Verify cancelled PO prevents modifications

5. **Document Management Tests**
   - Upload document and verify metadata storage
   - Verify S3 URL generation
   - Delete document and verify removal from S3
   - Cascade delete documents on PO deletion

6. **Tenant Isolation Tests**
   - Verify PO belongs to correct tenant
   - Verify cross-tenant access is denied
   - Verify cascade delete on tenant deletion

### Property-Based Testing

Property-based tests validate universal properties across all inputs using randomization:

1. **Property 1: Purchase Order Header Storage**
   - Generate random PO data
   - Create PO
   - Retrieve PO
   - Verify all header fields match

2. **Property 5: Line Item Subtotal Calculation**
   - Generate random quantities and prices
   - Create line items
   - Verify subtotal = quantity × unit_price

3. **Property 6: IVA and IEPS Calculation**
   - Generate random subtotals and tax percentages
   - Verify IVA = subtotal × IVA_percentage
   - Verify IEPS = subtotal × IEPS_percentage

4. **Property 8: Order Totals Calculation**
   - Create PO with multiple line items
   - Verify order totals = sum of line item values

5. **Property 11: Default Status is En Proceso**
   - Create POs without explicit status
   - Verify all default to 'En Proceso'

6. **Property 14: Status Filtering**
   - Create POs with different statuses
   - Query with status filter
   - Verify only matching POs returned

7. **Property 18: Payment Status Calculation**
   - Record payments with various amounts
   - Verify payment_status is calculated correctly

8. **Property 31: Tenant Isolation in Creation**
   - Create POs for different tenants
   - Verify each tenant only sees their POs

9. **Property 34: Purchase Order Serialization Round Trip**
   - Create PO with line items, payments, documents
   - Serialize to JSON
   - Deserialize from JSON
   - Verify equivalent to original

### Test Configuration

- Minimum 100 iterations per property-based test
- Each property test tagged with: **Feature: purchase-orders, Property {number}: {property_text}**
- Unit tests focus on edge cases and error conditions
- Property tests focus on universal correctness across all inputs
