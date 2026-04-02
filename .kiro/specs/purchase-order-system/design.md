# Purchase Order System - Design Document

## Overview

The Purchase Order System is a comprehensive inventory procurement management solution that handles the complete lifecycle of purchasing goods from vendors. The system enables procurement managers to create purchase orders with detailed line items, track requested versus received quantities with automatic unit conversions, and generate warehouse-specific inventory batches upon receiving goods.

The system integrates with existing vendor, product, warehouse, and fiscal configuration modules, using the "inv_s_" prefix for inventory-specific tables to maintain clear separation from other system components. Key capabilities include vendor product pricing retrieval, flexible unit of measure handling, batch number generation with warehouse prefixes, and comprehensive audit trails.

## Architecture

### System Components

The Purchase Order System follows a layered architecture pattern consistent with the existing NestJS application:

```
┌─────────────────────────────────────────────────────────┐
│                    REST API Layer                        │
│  (PurchaseOrderController, VendorProductsController)    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│  (PurchaseOrderService, BatchNumberGenerator,           │
│   UnitConversionService)                                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  (TypeORM Repositories & Entities)                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│  (MySQL - inv_s_* tables)                               │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

- **Vendor Module**: Retrieves vendor information and validates vendor existence
- **Product Module**: Accesses product details, UOM configurations, and vendor costs
- **Warehouse Module**: Retrieves warehouse information and prefix for batch generation
- **Fiscal Configuration Module**: Links purchase orders to billing configurations
- **Authentication Module**: Provides tenant context and user identification for audit trails

### Technology Stack

- **Framework**: NestJS (Node.js)
- **ORM**: TypeORM
- **Database**: MySQL
- **Language**: TypeScript
- **Validation**: class-validator
- **Authentication**: JWT-based with tenant isolation

## Components and Interfaces

### 1. PurchaseOrderController

REST API controller exposing purchase order endpoints.

**Endpoints**:
- `POST /purchase-orders` - Create new purchase order with line items
- `GET /purchase-orders` - List purchase orders with filtering
- `GET /purchase-orders/:id` - Get purchase order details
- `POST /purchase-orders/:id/receive` - Receive purchase order and create batches
- `PATCH /purchase-orders/:id/cancel` - Cancel purchase order
- `PATCH /purchase-orders/:id/line-items/:lineItemId` - Update line item pricing

**Dependencies**: PurchaseOrderService, JWT Guard

### 2. VendorProductsController

REST API controller for vendor product queries.

**Endpoints**:
- `GET /vendors/:id/products` - Get products with UOMs and costs for a vendor

**Dependencies**: VendorProductsService

### 3. PurchaseOrderService

Core business logic for purchase order management.

**Methods**:
- `create(dto, tenantId, userId)` - Create purchase order with line items
- `findAll(tenantId, filters)` - List purchase orders with pagination
- `findOne(id, tenantId)` - Get purchase order with details
- `receive(id, receivedData, tenantId, userId)` - Process received goods
- `cancel(id, tenantId, userId)` - Cancel purchase order
- `updateLineItem(orderId, lineItemId, dto, tenantId, userId)` - Update line item

**Dependencies**: TypeORM repositories, BatchNumberGenerator, UnitConversionService

### 4. VendorProductsService

Service for retrieving vendor product information.

**Methods**:
- `getVendorProducts(vendorId, tenantId)` - Get products with UOMs and costs

**Dependencies**: TypeORM repositories for products, product_uoms, product_vendor_costs

### 5. BatchNumberGenerator

Utility service for generating warehouse-specific batch numbers.

**Methods**:
- `generateBatchNumber(warehouseId, tenantId)` - Generate unique batch number

**Algorithm**:
1. Retrieve warehouse prefix (default "WH" if null)
2. Get next sequence number for tenant (auto-increment)
3. Format as `{prefix}-LOTE-{number}` with 6-digit zero-padding

**Dependencies**: TypeORM repositories for warehouses and sequence tracking

### 6. UnitConversionService

Service for converting quantities between units of measure.

**Methods**:
- `convertToBaseUnit(quantity, productUomId)` - Convert to base unit
- `getConversionFactor(productUomId)` - Get conversion factor
- `getBaseUom(productId)` - Get base UOM for product

**Dependencies**: TypeORM repository for product_uoms

## Data Models

### Database Schema

#### inv_s_purchase_order_batch (Purchase Order Header)

```sql
CREATE TABLE inv_s_purchase_order_batch (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  fiscal_configuration_id VARCHAR(36) NOT NULL,
  warehouse_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  expected_delivery_date DATE NOT NULL,
  payment_status ENUM('Pendiente', 'Pagado') NOT NULL DEFAULT 'Pendiente',
  general_status ENUM('Creada', 'Recibida', 'Cancelada') NOT NULL DEFAULT 'Creada',
  notes TEXT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by VARCHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT fk_po_batch_tenant 
    FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_po_batch_fiscal_config 
    FOREIGN KEY (fiscal_configuration_id) REFERENCES fiscal_configurations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_batch_warehouse 
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_batch_vendor 
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
  
  INDEX idx_tenant (tenant_id),
  INDEX idx_general_status (general_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_vendor (vendor_id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_expected_delivery (expected_delivery_date)
);
```

#### inv_s_purchase_order_batch_detail (Line Items)

```sql
CREATE TABLE inv_s_purchase_order_batch_detail (
  id VARCHAR(36) PRIMARY KEY,
  purchase_order_batch_id VARCHAR(36) NOT NULL,
  
  -- Requested (original order)
  product_id VARCHAR(36) NOT NULL,
  uom_id VARCHAR(36) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_total DECIMAL(12,2) NOT NULL,
  iva_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  iva_unit DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ieps_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
  ieps_unit DECIMAL(12,2) DEFAULT 0 NOT NULL,
  
  -- Received (what actually arrived) - original units
  received_original_product_id VARCHAR(36) NULL,
  received_original_uom_id VARCHAR(36) NULL,
  received_original_quantity DECIMAL(12,3) NULL,
  received_original_unit_total DECIMAL(12,2) NULL,
  received_original_iva_percentage DECIMAL(5,2) NULL,
  received_original_iva_unit DECIMAL(12,2) NULL,
  received_original_ieps_percentage DECIMAL(5,2) NULL,
  received_original_ieps_unit DECIMAL(12,2) NULL,
  
  -- Received (converted to base units for inventory)
  received_converted_uom_id VARCHAR(36) NULL,
  received_converted_quantity DECIMAL(12,3) NULL,
  
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by VARCHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT fk_po_detail_batch 
    FOREIGN KEY (purchase_order_batch_id) REFERENCES inv_s_purchase_order_batch(id) ON DELETE CASCADE,
  CONSTRAINT fk_po_detail_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_detail_uom 
    FOREIGN KEY (uom_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_detail_received_product 
    FOREIGN KEY (received_original_product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_detail_received_uom 
    FOREIGN KEY (received_original_uom_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT,
  CONSTRAINT fk_po_detail_converted_uom 
    FOREIGN KEY (received_converted_uom_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT,
  
  INDEX idx_purchase_order (purchase_order_batch_id),
  INDEX idx_product (product_id),
  INDEX idx_received_product (received_original_product_id)
);
```

#### inv_s_batches (Inventory Batches)

```sql
CREATE TABLE inv_s_batches (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  batch_number VARCHAR(50) NOT NULL,
  warehouse_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  uom_id VARCHAR(36) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  purchase_order_batch_id VARCHAR(36) NULL,
  purchase_order_detail_id VARCHAR(36) NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT fk_batch_tenant 
    FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_batch_warehouse 
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_batch_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_batch_uom 
    FOREIGN KEY (uom_id) REFERENCES uom_catalog(id) ON DELETE RESTRICT,
  CONSTRAINT fk_batch_po 
    FOREIGN KEY (purchase_order_batch_id) REFERENCES inv_s_purchase_order_batch(id) ON DELETE SET NULL,
  CONSTRAINT fk_batch_po_detail 
    FOREIGN KEY (purchase_order_detail_id) REFERENCES inv_s_purchase_order_batch_detail(id) ON DELETE SET NULL,
  
  CONSTRAINT uq_batch_number UNIQUE (tenant_id, batch_number),
  
  INDEX idx_tenant (tenant_id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_product (product_id),
  INDEX idx_batch_number (batch_number),
  INDEX idx_purchase_order (purchase_order_batch_id)
);
```

#### warehouses (Modified - Add Prefix Column)

```sql
ALTER TABLE warehouses 
ADD COLUMN prefix VARCHAR(10) NULL AFTER code;

CREATE INDEX idx_prefix ON warehouses(prefix);
```

### TypeORM Entities

#### PurchaseOrderBatch Entity

```typescript
@Entity('inv_s_purchase_order_batch')
export class PurchaseOrderBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  fiscal_configuration_id: string;

  @Column()
  warehouse_id: string;

  @Column()
  vendor_id: string;

  @Column({ type: 'date' })
  expected_delivery_date: Date;

  @Column({ type: 'enum', enum: ['Pendiente', 'Pagado'], default: 'Pendiente' })
  payment_status: string;

  @Column({ type: 'enum', enum: ['Creada', 'Recibida', 'Cancelada'], default: 'Creada' })
  general_status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @ManyToOne(() => FiscalConfiguration)
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @OneToMany(() => PurchaseOrderBatchDetail, detail => detail.purchase_order_batch)
  line_items: PurchaseOrderBatchDetail[];
}
```

#### PurchaseOrderBatchDetail Entity

```typescript
@Entity('inv_s_purchase_order_batch_detail')
export class PurchaseOrderBatchDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  purchase_order_batch_id: string;

  // Requested
  @Column()
  product_id: string;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ieps_unit: number;

  // Received Original
  @Column({ nullable: true })
  received_original_product_id: string;

  @Column({ nullable: true })
  received_original_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  received_original_quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_original_unit_total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  received_original_iva_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_original_iva_unit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  received_original_ieps_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_original_ieps_unit: number;

  // Received Converted
  @Column({ nullable: true })
  received_converted_uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  received_converted_quantity: number;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => PurchaseOrderBatch, batch => batch.line_items)
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order_batch: PurchaseOrderBatch;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => UoMCatalog)
  @JoinColumn({ name: 'uom_id' })
  uom: UoMCatalog;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'received_original_product_id' })
  received_product: Product;

  @ManyToOne(() => UoMCatalog)
  @JoinColumn({ name: 'received_original_uom_id' })
  received_uom: UoMCatalog;

  @ManyToOne(() => UoMCatalog)
  @JoinColumn({ name: 'received_converted_uom_id' })
  converted_uom: UoMCatalog;
}
```

#### InventoryBatch Entity

```typescript
@Entity('inv_s_batches')
export class InventoryBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ length: 50 })
  batch_number: string;

  @Column()
  warehouse_id: string;

  @Column()
  product_id: string;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ nullable: true })
  purchase_order_batch_id: string;

  @Column({ nullable: true })
  purchase_order_detail_id: string;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => UoMCatalog)
  @JoinColumn({ name: 'uom_id' })
  uom: UoMCatalog;

  @ManyToOne(() => PurchaseOrderBatch)
  @JoinColumn({ name: 'purchase_order_batch_id' })
  purchase_order: PurchaseOrderBatch;

  @ManyToOne(() => PurchaseOrderBatchDetail)
  @JoinColumn({ name: 'purchase_order_detail_id' })
  purchase_order_detail: PurchaseOrderBatchDetail;
}
```

### DTOs (Data Transfer Objects)

#### CreatePurchaseOrderDto

```typescript
export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  fiscal_configuration_id: string;

  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  @IsDateString()
  @IsNotEmpty()
  expected_delivery_date: string;

  @IsEnum(['Pendiente', 'Pagado'])
  @IsOptional()
  payment_status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  line_items: CreateLineItemDto[];
}
```

#### CreateLineItemDto

```typescript
export class CreateLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  uom_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_total: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_unit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ieps_unit?: number;
}
```

#### ReceivePurchaseOrderDto

```typescript
export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedLineItemDto)
  received_items: ReceivedLineItemDto[];
}
```

#### ReceivedLineItemDto

```typescript
export class ReceivedLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  line_item_id: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  uom_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_total: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  iva_percentage: number;

  @IsNumber()
  @Min(0)
  iva_unit: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ieps_percentage: number;

  @IsNumber()
  @Min(0)
  ieps_unit: number;
}
```

#### UpdateLineItemDto

```typescript
export class UpdateLineItemDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_total?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_unit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ieps_unit?: number;
}
```

#### QueryPurchaseOrderDto

```typescript
export class QueryPurchaseOrderDto {
  @IsOptional()
  @IsEnum(['Creada', 'Recibida', 'Cancelada'])
  general_status?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
```

### API Response Formats

#### VendorProductResponse

```typescript
interface VendorProductResponse {
  product_id: string;
  product_name: string;
  product_sku: string;
  uoms: {
    product_uom_id: string;
    uom_id: string;
    uom_name: string;
    factor: number;
    is_base: boolean;
    cost: number;
    iva_percentage: number;
    ieps_percentage: number;
    iva_unit_total: number;
    ieps_unit_total: number;
    subtotal: number;
  }[];
}
```

