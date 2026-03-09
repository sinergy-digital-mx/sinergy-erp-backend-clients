# Inventory Management Module - Technical Design Document

## Overview

El módulo de Inventory Management es un componente crítico del sistema Sinergy ERP que permite rastrear cantidades de productos en tiempo real, gestionar movimientos de inventario, controlar stock por almacén, implementar métodos de valorización, y prevenir sobreventa mediante reservas.

### Purpose

Este módulo proporciona:
- Gestión de inventario por producto, almacén y ubicación
- Registro de movimientos de inventario (entradas, salidas, ajustes, transferencias)
- Reservas de stock para órdenes de venta
- Métodos de valorización (FIFO, LIFO, Promedio Ponderado)
- Alertas de bajo stock y puntos de reorden
- Trazabilidad con números de lote y serie
- Soporte multi-UoM con conversiones automáticas
- Reportes de valorización de inventario

### Key Features

- **Real-Time Stock Tracking**: Cantidades actualizadas en tiempo real con cada transacción
- **Multi-Warehouse Support**: Gestión de inventario en múltiples almacenes y ubicaciones
- **Stock Reservations**: Prevención de sobreventa mediante reservas automáticas
- **Valuation Methods**: FIFO, LIFO, y Promedio Ponderado para contabilidad
- **Movement History**: Auditoría completa de todos los cambios en inventario
- **Low Stock Alerts**: Notificaciones automáticas cuando stock está bajo
- **Lot & Serial Tracking**: Trazabilidad completa para recalls y garantías
- **Multi-UoM Support**: Gestión en diferentes unidades de medida con conversiones
- **Transfer Management**: Transferencias entre almacenes con trazabilidad
- **Inventory Adjustments**: Corrección de discrepancias con notas de auditoría

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (HTTP)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         InventoryController                            │ │
│  │  - JWT Authentication Guard                            │ │
│  │  - Permission Guard (RBAC)                             │ │
│  │  - Swagger Documentation                               │ │
│  │  - Request/Response Transformation                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         InventoryService                               │ │
│  │  - Stock Management                                    │ │
│  │  - Movement Processing                                 │ │
│  │  - Reservation Management                              │ │
│  │  - Valuation Calculation                               │ │
│  │  - Transfer Logic                                      │ │
│  │  - Low Stock Detection                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         ValuationService                               │ │
│  │  - FIFO Calculation                                    │ │
│  │  - LIFO Calculation                                    │ │
│  │  - Weighted Average Calculation                        │ │
│  │  - Cost Layer Management                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         TypeORM Repositories                           │ │
│  │  - InventoryItem Repository                            │ │
│  │  - InventoryMovement Repository                        │ │
│  │  - StockReservation Repository                         │ │
│  │  - CostLayer Repository                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

## Components and Interfaces

### Entity: InventoryItem

**File**: `src/entities/inventory/inventory-item.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Product } from '../products/product.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { UnitOfMeasure } from '../products/unit-of-measure.entity';

@Entity('inventory_items')
@Index('inventory_items_tenant_idx', ['tenant_id'])
@Index('inventory_items_product_idx', ['product_id'])
@Index('inventory_items_warehouse_idx', ['warehouse_id'])
@Index('inventory_items_unique_idx', ['tenant_id', 'product_id', 'warehouse_id', 'uom_id', 'location'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UnitOfMeasure;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_on_hand: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_reserved: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity_available: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  reorder_point: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  reorder_quantity: number;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
    default: 'Weighted_Average',
  })
  valuation_method: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  total_value: number;

  @Column({ type: 'json', nullable: true })
  cost_layers: Array<{ quantity: number; unit_cost: number; date: Date }>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### Entity: InventoryMovement

**File**: `src/entities/inventory/inventory-movement.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Product } from '../products/product.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { UnitOfMeasure } from '../products/unit-of-measure.entity';
import { RBACUser } from '../rbac/user.entity';

@Entity('inventory_movements')
@Index('inventory_movements_tenant_idx', ['tenant_id'])
@Index('inventory_movements_product_idx', ['product_id'])
@Index('inventory_movements_warehouse_idx', ['warehouse_id'])
@Index('inventory_movements_date_idx', ['movement_date'])
@Index('inventory_movements_reference_idx', ['reference_type', 'reference_id'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UnitOfMeasure;

  @Column()
  uom_id: string;

  @Column({
    type: 'enum',
    enum: [
      'purchase_receipt',
      'sales_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'initial_balance',
      'return_to_vendor',
      'return_from_customer',
    ],
  })
  movement_type: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  total_cost: number;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  lot_number: string;

  @Column({ nullable: true })
  serial_number: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp' })
  movement_date: Date;

  @ManyToOne(() => RBACUser, { nullable: false })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user: RBACUser;

  @Column()
  created_by_user_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
```

### Entity: StockReservation

**File**: `src/entities/inventory/stock-reservation.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Product } from '../products/product.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { UnitOfMeasure } from '../products/unit-of-measure.entity';

@Entity('stock_reservations')
@Index('stock_reservations_tenant_idx', ['tenant_id'])
@Index('stock_reservations_product_idx', ['product_id'])
@Index('stock_reservations_warehouse_idx', ['warehouse_id'])
@Index('stock_reservations_reference_idx', ['reference_type', 'reference_id'])
@Index('stock_reservations_status_idx', ['status'])
export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UnitOfMeasure;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity_reserved: number;

  @Column()
  reference_type: string;

  @Column({ type: 'uuid' })
  reference_id: string;

  @Column({
    type: 'enum',
    enum: ['active', 'fulfilled', 'cancelled', 'expired'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'timestamp' })
  reserved_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  fulfilled_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```


### DTOs (Data Transfer Objects)

#### CreateInventoryItemDto

**File**: `src/api/inventory/dto/create-inventory-item.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiPropertyOptional({ description: 'Initial quantity on hand', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity_on_hand?: number;

  @ApiPropertyOptional({ description: 'Reorder point', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_point?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Valuation method',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
    default: 'Weighted_Average',
  })
  @IsOptional()
  @IsEnum(['FIFO', 'LIFO', 'Weighted_Average'])
  valuation_method?: string;

  @ApiPropertyOptional({ description: 'Initial unit cost', example: 10.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_cost?: number;
}
```

#### UpdateInventoryItemDto

**File**: `src/api/inventory/dto/update-inventory-item.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Reorder point', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_point?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Valuation method',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
  })
  @IsOptional()
  @IsEnum(['FIFO', 'LIFO', 'Weighted_Average'])
  valuation_method?: string;
}
```

#### CreateInventoryMovementDto

**File**: `src/api/inventory/dto/create-inventory-movement.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({
    description: 'Movement type',
    enum: [
      'purchase_receipt',
      'sales_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'initial_balance',
      'return_to_vendor',
      'return_from_customer',
    ],
  })
  @IsEnum([
    'purchase_receipt',
    'sales_shipment',
    'adjustment',
    'transfer_in',
    'transfer_out',
    'initial_balance',
    'return_to_vendor',
    'return_from_customer',
  ])
  movement_type: string;

  @ApiProperty({ description: 'Quantity (positive for increase, negative for decrease)', example: 50 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit cost at time of movement', example: 10.50 })
  @IsNumber()
  unit_cost: number;

  @ApiPropertyOptional({ description: 'Reference type', example: 'purchase_order' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Lot number', example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN-123456' })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Physical count adjustment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Movement date', example: '2024-03-08T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  movement_date?: string;
}
```

#### CreateStockReservationDto

**File**: `src/api/inventory/dto/create-stock-reservation.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockReservationDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({ description: 'Quantity to reserve', example: 10 })
  @IsNumber()
  @Min(0.0001)
  quantity_reserved: number;

  @ApiProperty({ description: 'Reference type', example: 'sales_order' })
  @IsString()
  reference_type: string;

  @ApiProperty({ description: 'Reference ID', example: 'uuid' })
  @IsString()
  reference_id: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-03-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
```

#### QueryInventoryItemDto

**File**: `src/api/inventory/dto/query-inventory-item.dto.ts`

```typescript
import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryItemDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Product ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({ description: 'Location filter', example: 'A-01' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Search by product name or SKU', example: 'Widget' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter low stock items', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  low_stock?: boolean;
}
```

#### QueryInventoryMovementDto

**File**: `src/api/inventory/dto/query-inventory-movement.dto.ts`

```typescript
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryMovementDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Product ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({
    description: 'Movement type filter',
    enum: [
      'purchase_receipt',
      'sales_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'initial_balance',
      'return_to_vendor',
      'return_from_customer',
    ],
  })
  @IsOptional()
  @IsEnum([
    'purchase_receipt',
    'sales_shipment',
    'adjustment',
    'transfer_in',
    'transfer_out',
    'initial_balance',
    'return_to_vendor',
    'return_from_customer',
  ])
  movement_type?: string;

  @ApiPropertyOptional({ description: 'Movement date from', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  movement_date_from?: string;

  @ApiPropertyOptional({ description: 'Movement date to', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  movement_date_to?: string;

  @ApiPropertyOptional({ description: 'Reference type filter', example: 'sales_order' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Lot number filter', example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Serial number filter', example: 'SN-123456' })
  @IsOptional()
  @IsString()
  serial_number?: string;
}
```

#### TransferInventoryDto

**File**: `src/api/inventory/dto/transfer-inventory.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferInventoryDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Source warehouse ID', example: 'uuid' })
  @IsString()
  source_warehouse_id: string;

  @ApiProperty({ description: 'Destination warehouse ID', example: 'uuid' })
  @IsString()
  destination_warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 50 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ description: 'Unit cost', example: 10.50 })
  @IsNumber()
  @Min(0)
  unit_cost: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Transfer for restock' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```


### Service: InventoryService

**File**: `src/api/inventory/inventory.service.ts`

Key methods:

```typescript
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryItemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepo: Repository<InventoryMovement>,
    @InjectRepository(StockReservation)
    private stockReservationRepo: Repository<StockReservation>,
    private valuationService: ValuationService,
  ) {}

  // Inventory Item Management
  async createInventoryItem(dto: CreateInventoryItemDto, tenantId: string): Promise<InventoryItem>
  async updateInventoryItem(id: string, dto: UpdateInventoryItemDto, tenantId: string): Promise<InventoryItem>
  async findInventoryItems(tenantId: string, query: QueryInventoryItemDto): Promise<PaginatedResponse<InventoryItem>>
  async findInventoryItemById(id: string, tenantId: string): Promise<InventoryItem>
  async deleteInventoryItem(id: string, tenantId: string): Promise<void>

  // Inventory Movement Management
  async createInventoryMovement(dto: CreateInventoryMovementDto, tenantId: string, userId: string): Promise<InventoryMovement>
  async findInventoryMovements(tenantId: string, query: QueryInventoryMovementDto): Promise<PaginatedResponse<InventoryMovement>>
  async findInventoryMovementById(id: string, tenantId: string): Promise<InventoryMovement>

  // Stock Reservation Management
  async createStockReservation(dto: CreateStockReservationDto, tenantId: string): Promise<StockReservation>
  async fulfillStockReservation(id: string, tenantId: string, userId: string): Promise<void>
  async cancelStockReservation(id: string, tenantId: string): Promise<void>
  async findStockReservations(tenantId: string, query: QueryStockReservationDto): Promise<PaginatedResponse<StockReservation>>

  // Transfer Management
  async transferInventory(dto: TransferInventoryDto, tenantId: string, userId: string): Promise<{ outMovement: InventoryMovement; inMovement: InventoryMovement }>

  // Adjustment Management
  async adjustInventory(dto: AdjustInventoryDto, tenantId: string, userId: string): Promise<InventoryMovement>

  // Reporting
  async getLowStockItems(tenantId: string): Promise<InventoryItem[]>
  async getInventoryValuationReport(tenantId: string, warehouseId?: string): Promise<ValuationReport>
  async getStockByProduct(productId: string, tenantId: string): Promise<InventoryItem[]>
  async getStockByWarehouse(warehouseId: string, tenantId: string): Promise<InventoryItem[]>

  // Internal Helper Methods
  private async updateInventoryQuantity(inventoryItem: InventoryItem, quantity: number, unitCost: number): Promise<void>
  private async calculateAvailableQuantity(inventoryItem: InventoryItem): Promise<number>
  private async validateSufficientStock(inventoryItem: InventoryItem, requiredQuantity: number): Promise<void>
  private async getOrCreateInventoryItem(productId: string, warehouseId: string, uomId: string, tenantId: string): Promise<InventoryItem>
}
```

### Service: ValuationService

**File**: `src/api/inventory/valuation.service.ts`

Key methods:

```typescript
@Injectable()
export class ValuationService {
  // FIFO Valuation
  async calculateFIFOCost(inventoryItem: InventoryItem, quantity: number): Promise<{ unitCost: number; costLayers: CostLayer[] }>
  async addFIFOLayer(inventoryItem: InventoryItem, quantity: number, unitCost: number): Promise<void>
  async consumeFIFOLayers(inventoryItem: InventoryItem, quantity: number): Promise<number>

  // LIFO Valuation
  async calculateLIFOCost(inventoryItem: InventoryItem, quantity: number): Promise<{ unitCost: number; costLayers: CostLayer[] }>
  async addLIFOLayer(inventoryItem: InventoryItem, quantity: number, unitCost: number): Promise<void>
  async consumeLIFOLayers(inventoryItem: InventoryItem, quantity: number): Promise<number>

  // Weighted Average Valuation
  async calculateWeightedAverageCost(inventoryItem: InventoryItem, newQuantity: number, newUnitCost: number): Promise<number>
  async updateWeightedAverage(inventoryItem: InventoryItem, quantity: number, unitCost: number): Promise<void>

  // General Valuation
  async updateInventoryValuation(inventoryItem: InventoryItem, quantity: number, unitCost: number): Promise<void>
  async recalculateTotalValue(inventoryItem: InventoryItem): Promise<void>
}
```

### Controller: InventoryController

**File**: `src/api/inventory/inventory.controller.ts`

```typescript
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/inventory')
@ApiTags('Inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Inventory Items
  @Post('items')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a new inventory item' })
  createInventoryItem(@Body() dto: CreateInventoryItemDto, @Req() req)

  @Get('items')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated inventory items with filters' })
  findInventoryItems(@Query() query: QueryInventoryItemDto, @Req() req)

  @Get('items/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific inventory item by ID' })
  findInventoryItemById(@Param('id') id: string, @Req() req)

  @Put('items/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Update an inventory item' })
  updateInventoryItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto, @Req() req)

  @Delete('items/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Delete' })
  @ApiOperation({ summary: 'Delete an inventory item' })
  deleteInventoryItem(@Param('id') id: string, @Req() req)

  // Inventory Movements
  @Post('movements')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a new inventory movement' })
  createInventoryMovement(@Body() dto: CreateInventoryMovementDto, @Req() req)

  @Get('movements')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated inventory movements with filters' })
  findInventoryMovements(@Query() query: QueryInventoryMovementDto, @Req() req)

  @Get('movements/:id')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific inventory movement by ID' })
  findInventoryMovementById(@Param('id') id: string, @Req() req)

  // Stock Reservations
  @Post('reservations')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Create a stock reservation' })
  createStockReservation(@Body() dto: CreateStockReservationDto, @Req() req)

  @Post('reservations/:id/fulfill')
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Fulfill a stock reservation' })
  fulfillStockReservation(@Param('id') id: string, @Req() req)

  @Post('reservations/:id/cancel')
  @RequirePermissions({ entityType: 'inventory', action: 'Update' })
  @ApiOperation({ summary: 'Cancel a stock reservation' })
  cancelStockReservation(@Param('id') id: string, @Req() req)

  @Get('reservations')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated stock reservations' })
  findStockReservations(@Query() query: QueryStockReservationDto, @Req() req)

  // Transfers
  @Post('transfers')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Transfer inventory between warehouses' })
  transferInventory(@Body() dto: TransferInventoryDto, @Req() req)

  // Adjustments
  @Post('adjustments')
  @RequirePermissions({ entityType: 'inventory', action: 'Create' })
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  adjustInventory(@Body() dto: AdjustInventoryDto, @Req() req)

  // Reports
  @Get('reports/low-stock')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStockItems(@Req() req)

  @Get('reports/valuation')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get inventory valuation report' })
  getInventoryValuationReport(@Query('warehouse_id') warehouseId: string, @Req() req)

  @Get('reports/by-product/:productId')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get stock by product across all warehouses' })
  getStockByProduct(@Param('productId') productId: string, @Req() req)

  @Get('reports/by-warehouse/:warehouseId')
  @RequirePermissions({ entityType: 'inventory', action: 'Read' })
  @ApiOperation({ summary: 'Get all stock in a warehouse' })
  getStockByWarehouse(@Param('warehouseId') warehouseId: string, @Req() req)
}
```

### Module: InventoryModule

**File**: `src/api/inventory/inventory.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ValuationService } from './valuation.service';
import { InventoryItem } from '../../entities/inventory/inventory-item.entity';
import { InventoryMovement } from '../../entities/inventory/inventory-movement.entity';
import { StockReservation } from '../../entities/inventory/stock-reservation.entity';
import { RBACModule } from '../rbac/rbac.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      InventoryMovement,
      StockReservation,
    ]),
    RBACModule,
    ProductsModule,
    WarehousesModule,
  ],
  providers: [InventoryService, ValuationService],
  controllers: [InventoryController],
  exports: [InventoryService, ValuationService],
})
export class InventoryModule {}
```

## Data Flow Diagrams

### Create Inventory Movement Flow

```
User Request → Controller → Service
                              ↓
                    Validate Product/Warehouse/UoM
                              ↓
                    Get or Create InventoryItem
                              ↓
                    Validate Stock (if negative movement)
                              ↓
                    Create InventoryMovement
                              ↓
                    Update InventoryItem.quantity_on_hand
                              ↓
                    Update Valuation (FIFO/LIFO/Weighted)
                              ↓
                    Recalculate quantity_available
                              ↓
                    Save Changes
                              ↓
                    Return Movement
```

### Stock Reservation Flow

```
Sales Order Confirmed → Create Reservation Request
                              ↓
                    Validate Product/Warehouse/UoM
                              ↓
                    Get InventoryItem
                              ↓
                    Check Available Stock
                              ↓
                    Create StockReservation (status: active)
                              ↓
                    Update InventoryItem.quantity_reserved
                              ↓
                    Recalculate quantity_available
                              ↓
                    Save Changes
                              ↓
                    Return Reservation
```

### Fulfill Reservation Flow

```
Sales Order Shipped → Fulfill Reservation Request
                              ↓
                    Get StockReservation
                              ↓
                    Validate Status (must be active)
                              ↓
                    Create InventoryMovement (type: sales_shipment)
                              ↓
                    Update InventoryItem.quantity_on_hand (decrease)
                              ↓
                    Update InventoryItem.quantity_reserved (decrease)
                              ↓
                    Update StockReservation.status = fulfilled
                              ↓
                    Set fulfilled_at timestamp
                              ↓
                    Save Changes
```

### Transfer Inventory Flow

```
Transfer Request → Validate Source/Destination Warehouses
                              ↓
                    Validate Sufficient Stock in Source
                              ↓
                    Create Transfer-Out Movement (source warehouse)
                              ↓
                    Update Source InventoryItem (decrease)
                              ↓
                    Create Transfer-In Movement (destination warehouse)
                              ↓
                    Update Destination InventoryItem (increase)
                              ↓
                    Link Movements with same reference_id
                              ↓
                    Save Changes
                              ↓
                    Return Both Movements
```

## Integration Points

### With Sales Orders Module

- When sales order is confirmed → Create stock reservations
- When sales order is shipped → Fulfill stock reservations (creates sales_shipment movement)
- When sales order is cancelled → Cancel stock reservations

### With Purchase Orders Module

- When purchase order is received → Create purchase_receipt movement
- When products are returned to vendor → Create return_to_vendor movement

### With Products Module

- Validate product_id exists and belongs to tenant
- Validate uom_id is assigned to product
- Use product UoM relationships for conversions

### With Warehouses Module

- Validate warehouse_id exists and belongs to tenant
- Support multi-warehouse inventory tracking

## Database Schema

### inventory_items Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| tenant_id | UUID | NOT NULL, FK → rbac_tenants |
| product_id | UUID | NOT NULL, FK → products |
| warehouse_id | UUID | NOT NULL, FK → warehouses |
| uom_id | UUID | NOT NULL, FK → units_of_measure |
| quantity_on_hand | DECIMAL(18,4) | DEFAULT 0 |
| quantity_reserved | DECIMAL(18,4) | DEFAULT 0 |
| quantity_available | DECIMAL(18,4) | DEFAULT 0 |
| reorder_point | DECIMAL(18,4) | NULL |
| reorder_quantity | DECIMAL(18,4) | NULL |
| location | VARCHAR | NULL |
| valuation_method | ENUM | DEFAULT 'Weighted_Average' |
| unit_cost | DECIMAL(18,4) | DEFAULT 0 |
| total_value | DECIMAL(18,4) | DEFAULT 0 |
| cost_layers | JSON | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:**
- tenant_id
- product_id
- warehouse_id
- UNIQUE (tenant_id, product_id, warehouse_id, uom_id, location)

### inventory_movements Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| tenant_id | UUID | NOT NULL, FK → rbac_tenants |
| product_id | UUID | NOT NULL, FK → products |
| warehouse_id | UUID | NOT NULL, FK → warehouses |
| uom_id | UUID | NOT NULL, FK → units_of_measure |
| movement_type | ENUM | NOT NULL |
| quantity | DECIMAL(18,4) | NOT NULL |
| unit_cost | DECIMAL(18,4) | NOT NULL |
| total_cost | DECIMAL(18,4) | NOT NULL |
| reference_type | VARCHAR | NULL |
| reference_id | UUID | NULL |
| location | VARCHAR | NULL |
| lot_number | VARCHAR | NULL |
| serial_number | VARCHAR | NULL |
| notes | TEXT | NULL |
| movement_date | TIMESTAMP | NOT NULL |
| created_by_user_id | UUID | NOT NULL, FK → rbac_users |
| created_at | TIMESTAMP | NOT NULL |

**Indexes:**
- tenant_id
- product_id
- warehouse_id
- movement_date
- (reference_type, reference_id)

### stock_reservations Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| tenant_id | UUID | NOT NULL, FK → rbac_tenants |
| product_id | UUID | NOT NULL, FK → products |
| warehouse_id | UUID | NOT NULL, FK → warehouses |
| uom_id | UUID | NOT NULL, FK → units_of_measure |
| quantity_reserved | DECIMAL(18,4) | NOT NULL |
| reference_type | VARCHAR | NOT NULL |
| reference_id | UUID | NOT NULL |
| status | ENUM | DEFAULT 'active' |
| reserved_at | TIMESTAMP | NOT NULL |
| expires_at | TIMESTAMP | NULL |
| fulfilled_at | TIMESTAMP | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:**
- tenant_id
- product_id
- warehouse_id
- (reference_type, reference_id)
- status

## Error Handling

- **Insufficient Stock**: When trying to create negative movement without enough stock
- **Invalid Product/Warehouse/UoM**: When referenced entities don't exist or don't belong to tenant
- **Duplicate Inventory Item**: When trying to create item with same product/warehouse/uom/location
- **Invalid Reservation Status**: When trying to fulfill/cancel already processed reservation
- **Negative Available Stock**: When reservation would make available stock negative
- **Invalid Transfer**: When source and destination warehouses are the same
- **Missing Notes**: When adjustment doesn't include required notes field

## Performance Considerations

- Index on tenant_id for all queries
- Index on product_id and warehouse_id for filtering
- Index on movement_date for date range queries
- Index on (reference_type, reference_id) for tracing related movements
- Use database transactions for multi-step operations (transfers, fulfillments)
- Consider partitioning inventory_movements table by date for large datasets
- Cache frequently accessed inventory items
- Use read replicas for reporting queries

## Security Considerations

- All operations require authentication (JWT)
- All operations require appropriate permissions (inventory:Create, inventory:Read, etc.)
- Tenant isolation enforced at service layer
- Audit trail via created_by_user_id in movements
- Prevent direct quantity updates (must go through movements)
- Validate all foreign key references belong to same tenant
