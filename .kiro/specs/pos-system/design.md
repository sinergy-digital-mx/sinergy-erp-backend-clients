# POS System - Technical Design Document

## Overview

El módulo de POS (Point of Sale) es un sistema optimizado para ventas directas en tiempo real, diseñado para restaurantes, retail y comercios que requieren operaciones rápidas de venta, cobro y control de caja.

### Purpose

Este módulo proporciona:
- Creación rápida de órdenes de venta
- Gestión de mesas y zonas (restaurantes)
- Procesamiento de pagos múltiples
- Control de turnos de caja
- Integración automática con inventario
- Reportes de ventas en tiempo real
- Display de cocina para restaurantes

### Key Features

- **Fast Order Creation**: Interfaz optimizada para alta velocidad
- **Multi-Payment Support**: Efectivo, tarjeta, transferencia, mixto
- **Cash Shift Management**: Control de apertura/cierre de caja
- **Table Management**: Gestión de mesas para restaurantes
- **Kitchen Display**: Integración con pantallas de cocina
- **Real-Time Inventory**: Actualización automática de stock
- **Daily Reports**: Reportes de ventas, cajeros, productos
- **Split Payments**: Pagos divididos en múltiples métodos
- **Tips & Discounts**: Propinas y descuentos flexibles

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (HTTP)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         POSController                                   │ │
│  │  - JWT Authentication Guard                            │ │
│  │  - Permission Guard (RBAC)                             │ │
│  │  - Swagger Documentation                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         POSService                                      │ │
│  │  - Order Management                                    │ │
│  │  - Payment Processing                                  │ │
│  │  - Total Calculation                                   │ │
│  │  - Inventory Integration                               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         CashShiftService                               │ │
│  │  - Shift Management                                    │ │
│  │  - Cash Reconciliation                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         POSReportService                               │ │
│  │  - Daily Sales Reports                                 │ │
│  │  - Waiter Performance                                  │ │
│  │  - Product Analytics                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         TypeORM Repositories                           │ │
│  │  - POSOrder Repository                                 │ │
│  │  - POSOrderLine Repository                             │ │
│  │  - POSPayment Repository                               │ │
│  │  - CashShift Repository                                │ │
│  │  - POSTable Repository                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

```
POSModule
├── TypeOrmModule.forFeature([POSOrder, POSOrderLine, POSPayment, CashShift, POSTable])
├── RBACModule (authentication & authorization)
├── InventoryModule (stock updates)
├── ProductsModule (product catalog)
├── WarehouseModule (POS location)
└── Exports: POSService, CashShiftService, POSReportService
```

## Components and Interfaces

### Entity: POSOrder

**File**: `src/entities/pos/pos-order.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { User } from '../users/user.entity';
import { POSOrderLine } from './pos-order-line.entity';
import { POSPayment } from './pos-payment.entity';

@Entity('pos_orders')
@Index('pos_orders_tenant_idx', ['tenant_id'])
@Index('pos_orders_warehouse_idx', ['warehouse_id'])
@Index('pos_orders_order_number_idx', ['order_number'])
@Index('pos_orders_status_idx', ['status'])
@Index('pos_orders_waiter_idx', ['waiter_id'])
@Index('pos_orders_date_idx', ['created_at'])
export class POSOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column()
  order_number: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'waiter_id' })
  waiter: User;

  @Column()
  waiter_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({ nullable: true })
  cashier_id: string;

  @Column({ nullable: true })
  table_number: string;

  @Column({ nullable: true })
  zone: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'ready', 'paid', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tip: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @OneToMany(() => POSOrderLine, (line) => line.pos_order, {
    cascade: true,
    eager: false,
  })
  lines: POSOrderLine[];

  @OneToMany(() => POSPayment, (payment) => payment.pos_order, {
    cascade: true,
    eager: false,
  })
  payments: POSPayment[];

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### Entity: POSOrderLine

**File**: `src/entities/pos/pos-order-line.entity.ts`

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
import { POSOrder } from './pos-order.entity';
import { Product } from '../products/product.entity';
import { UoM } from '../products/uom.entity';

@Entity('pos_order_lines')
@Index('pos_order_lines_order_idx', ['pos_order_id'])
@Index('pos_order_lines_product_idx', ['product_id'])
@Index('pos_order_lines_status_idx', ['status'])
export class POSOrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => POSOrder, (order) => order.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pos_order_id' })
  pos_order: POSOrder;

  @Column()
  pos_order_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => UoM, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'uom_id' })
  uom: UoM;

  @Column()
  uom_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  line_total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### Entity: POSPayment

**File**: `src/entities/pos/pos-payment.entity.ts`

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
import { POSOrder } from './pos-order.entity';
import { User } from '../users/user.entity';
import { CashShift } from './cash-shift.entity';

@Entity('pos_payments')
@Index('pos_payments_order_idx', ['pos_order_id'])
@Index('pos_payments_cashier_idx', ['cashier_id'])
@Index('pos_payments_shift_idx', ['cash_shift_id'])
@Index('pos_payments_method_idx', ['payment_method'])
export class POSPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => POSOrder, (order) => order.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'pos_order_id' })
  pos_order: POSOrder;

  @Column()
  pos_order_id: string;

  @Column({
    type: 'enum',
    enum: ['cash', 'card', 'transfer', 'mixed'],
  })
  payment_method: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  received_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  change_amount: number;

  @Column({ nullable: true })
  reference: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column()
  cashier_id: string;

  @ManyToOne(() => CashShift, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cash_shift_id' })
  cash_shift: CashShift;

  @Column()
  cash_shift_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
```

### Entity: CashShift

**File**: `src/entities/pos/cash-shift.entity.ts`

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
import { Warehouse } from '../warehouse/warehouse.entity';
import { User } from '../users/user.entity';

@Entity('cash_shifts')
@Index('cash_shifts_tenant_idx', ['tenant_id'])
@Index('cash_shifts_warehouse_idx', ['warehouse_id'])
@Index('cash_shifts_cashier_idx', ['cashier_id'])
@Index('cash_shifts_status_idx', ['status'])
export class CashShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column()
  cashier_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initial_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  final_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expected_cash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number;

  @Column({
    type: 'enum',
    enum: ['open', 'closed'],
    default: 'open',
  })
  status: string;

  @Column({ type: 'timestamp' })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
```

### Entity: POSTable

**File**: `src/entities/pos/pos-table.entity.ts`

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
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('pos_tables')
@Index('pos_tables_tenant_idx', ['tenant_id'])
@Index('pos_tables_warehouse_idx', ['warehouse_id'])
@Index('pos_tables_status_idx', ['status'])
@Index('pos_tables_unique_idx', ['tenant_id', 'warehouse_id', 'table_number'], { unique: true })
export class POSTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @Column()
  table_number: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available',
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  current_order_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```


### DTOs (Data Transfer Objects)

#### CreatePOSOrderDto

**File**: `src/api/pos/dto/create-pos-order.dto.ts`

```typescript
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePOSOrderDto {
  @ApiProperty({ description: 'Warehouse ID (POS location)', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiPropertyOptional({ description: 'Table number', example: '5' })
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional({ description: 'Zone', example: 'Terraza' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Cliente VIP' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

#### AddLineItemDto

**File**: `src/api/pos/dto/add-line-item.dto.ts`

```typescript
import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddLineItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsUUID()
  uom_id: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Special instructions', example: 'Sin cebolla' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

#### ProcessPaymentDto

**File**: `src/api/pos/dto/process-payment.dto.ts`

```typescript
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Payment method',
    enum: ['cash', 'card', 'transfer', 'mixed'],
    example: 'cash',
  })
  @IsEnum(['cash', 'card', 'transfer', 'mixed'])
  payment_method: string;

  @ApiProperty({ description: 'Payment amount', example: 500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Received amount (for cash)', example: 600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  received_amount?: number;

  @ApiPropertyOptional({ description: 'Card authorization reference', example: 'AUTH123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Tip amount', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;
}
```

#### OpenCashShiftDto

**File**: `src/api/pos/dto/open-cash-shift.dto.ts`

```typescript
import { IsNumber, IsUUID, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashShiftDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({ description: 'Initial cash amount', example: 1000 })
  @IsNumber()
  @Min(0)
  initial_cash: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Turno matutino' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

#### CloseCashShiftDto

**File**: `src/api/pos/dto/close-cash-shift.dto.ts`

```typescript
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseCashShiftDto {
  @ApiProperty({ description: 'Final cash amount counted', example: 5000 })
  @IsNumber()
  @Min(0)
  final_cash: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Todo correcto' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### Service: POSService

**File**: `src/api/pos/pos.service.ts`

Key methods:

```typescript
@Injectable()
export class POSService {
  constructor(
    @InjectRepository(POSOrder)
    private posOrderRepo: Repository<POSOrder>,
    @InjectRepository(POSOrderLine)
    private posOrderLineRepo: Repository<POSOrderLine>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
    @InjectRepository(POSTable)
    private posTableRepo: Repository<POSTable>,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private cashShiftService: CashShiftService,
    private dataSource: DataSource,
  ) {}

  // Order Management
  async createOrder(dto: CreatePOSOrderDto, tenantId: string, waiterId: string): Promise<POSOrder>
  async findOrder(id: string, tenantId: string): Promise<POSOrder>
  async findOrders(tenantId: string, query: QueryPOSOrderDto): Promise<PaginatedResponse<POSOrder>>
  async cancelOrder(id: string, tenantId: string, reason: string): Promise<POSOrder>

  // Line Item Management
  async addLineItem(orderId: string, dto: AddLineItemDto, tenantId: string): Promise<POSOrderLine>
  async updateLineItem(lineId: string, dto: UpdateLineItemDto, tenantId: string): Promise<POSOrderLine>
  async removeLineItem(lineId: string, tenantId: string): Promise<void>

  // Payment Processing
  async processPayment(orderId: string, dto: ProcessPaymentDto, tenantId: string, cashierId: string): Promise<POSPayment>
  async processSplitPayment(orderId: string, payments: ProcessPaymentDto[], tenantId: string, cashierId: string): Promise<POSPayment[]>

  // Total Calculation
  private async calculateOrderTotals(order: POSOrder): Promise<void>
  private calculateLineTotal(line: POSOrderLine): number

  // Table Management
  async assignTable(orderId: string, tableNumber: string, tenantId: string): Promise<POSOrder>
  async releaseTable(tableNumber: string, warehouseId: string, tenantId: string): Promise<void>

  // Kitchen Integration
  async updateLineStatus(lineId: string, status: string, tenantId: string): Promise<POSOrderLine>
  async getKitchenOrders(warehouseId: string, tenantId: string): Promise<POSOrder[]>

  // Helper Methods
  private async generateOrderNumber(tenantId: string, warehouseId: string): Promise<string>
  private async validateOrderNotPaid(order: POSOrder): Promise<void>
  private async createInventoryMovements(order: POSOrder, tenantId: string, userId: string): Promise<void>
}
```

### Service: CashShiftService

**File**: `src/api/pos/cash-shift.service.ts`

Key methods:

```typescript
@Injectable()
export class CashShiftService {
  constructor(
    @InjectRepository(CashShift)
    private cashShiftRepo: Repository<CashShift>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
  ) {}

  async openShift(dto: OpenCashShiftDto, tenantId: string, cashierId: string): Promise<CashShift>
  async closeShift(shiftId: string, dto: CloseCashShiftDto, tenantId: string): Promise<CashShift>
  async getCurrentShift(cashierId: string, warehouseId: string, tenantId: string): Promise<CashShift>
  async getShiftReport(shiftId: string, tenantId: string): Promise<ShiftReport>
  
  private async validateNoOpenShift(cashierId: string, warehouseId: string, tenantId: string): Promise<void>
  private async calculateExpectedCash(shiftId: string): Promise<number>
}
```

### Service: POSReportService

**File**: `src/api/pos/pos-report.service.ts`

Key methods:

```typescript
@Injectable()
export class POSReportService {
  constructor(
    @InjectRepository(POSOrder)
    private posOrderRepo: Repository<POSOrder>,
    @InjectRepository(POSPayment)
    private posPaymentRepo: Repository<POSPayment>,
  ) {}

  async getDailySalesReport(warehouseId: string, date: Date, tenantId: string): Promise<DailySalesReport>
  async getWaiterPerformance(waiterId: string, dateFrom: Date, dateTo: Date, tenantId: string): Promise<WaiterReport>
  async getTopProducts(warehouseId: string, dateFrom: Date, dateTo: Date, tenantId: string): Promise<ProductReport[]>
  async getSalesByHour(warehouseId: string, date: Date, tenantId: string): Promise<HourlySalesReport>
  async getSalesByPaymentMethod(warehouseId: string, dateFrom: Date, dateTo: Date, tenantId: string): Promise<PaymentMethodReport>
}
```

### Controller: POSController

**File**: `src/api/pos/pos.controller.ts`

```typescript
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/pos')
@ApiTags('POS')
@ApiBearerAuth()
export class POSController {
  constructor(
    private readonly posService: POSService,
    private readonly cashShiftService: CashShiftService,
    private readonly posReportService: POSReportService,
  ) {}

  // Orders
  @Post('orders')
  @RequirePermissions({ entityType: 'pos', action: 'Create' })
  @ApiOperation({ summary: 'Create a new POS order' })
  createOrder(@Body() dto: CreatePOSOrderDto, @Req() req)

  @Get('orders')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get POS orders with filters' })
  findOrders(@Query() query: QueryPOSOrderDto, @Req() req)

  @Get('orders/:id')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific POS order' })
  findOrder(@Param('id') id: string, @Req() req)

  @Post('orders/:id/cancel')
  @RequirePermissions({ entityType: 'pos', action: 'Delete' })
  @ApiOperation({ summary: 'Cancel a POS order' })
  cancelOrder(@Param('id') id: string, @Body() dto: CancelOrderDto, @Req() req)

  // Line Items
  @Post('orders/:id/lines')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Add line item to order' })
  addLineItem(@Param('id') id: string, @Body() dto: AddLineItemDto, @Req() req)

  @Put('lines/:id')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Update line item' })
  updateLineItem(@Param('id') id: string, @Body() dto: UpdateLineItemDto, @Req() req)

  @Delete('lines/:id')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Remove line item' })
  removeLineItem(@Param('id') id: string, @Req() req)

  // Payments
  @Post('orders/:id/payment')
  @RequirePermissions({ entityType: 'pos', action: 'Payment' })
  @ApiOperation({ summary: 'Process payment for order' })
  processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto, @Req() req)

  @Post('orders/:id/split-payment')
  @RequirePermissions({ entityType: 'pos', action: 'Payment' })
  @ApiOperation({ summary: 'Process split payment for order' })
  processSplitPayment(@Param('id') id: string, @Body() dto: SplitPaymentDto, @Req() req)

  // Cash Shifts
  @Post('cash-shifts/open')
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Open cash shift' })
  openCashShift(@Body() dto: OpenCashShiftDto, @Req() req)

  @Post('cash-shifts/:id/close')
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Close cash shift' })
  closeCashShift(@Param('id') id: string, @Body() dto: CloseCashShiftDto, @Req() req)

  @Get('cash-shifts/current')
  @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
  @ApiOperation({ summary: 'Get current open shift' })
  getCurrentShift(@Query('warehouse_id') warehouseId: string, @Req() req)

  @Get('cash-shifts/:id/report')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get cash shift report' })
  getShiftReport(@Param('id') id: string, @Req() req)

  // Kitchen
  @Get('kitchen/orders')
  @RequirePermissions({ entityType: 'pos', action: 'Read' })
  @ApiOperation({ summary: 'Get orders for kitchen display' })
  getKitchenOrders(@Query('warehouse_id') warehouseId: string, @Req() req)

  @Put('kitchen/lines/:id/status')
  @RequirePermissions({ entityType: 'pos', action: 'Update' })
  @ApiOperation({ summary: 'Update line item status (kitchen)' })
  updateLineStatus(@Param('id') id: string, @Body() dto: UpdateLineStatusDto, @Req() req)

  // Reports
  @Get('reports/daily-sales')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get daily sales report' })
  getDailySalesReport(@Query() query: DailySalesQueryDto, @Req() req)

  @Get('reports/waiter-performance')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get waiter performance report' })
  getWaiterPerformance(@Query() query: WaiterPerformanceQueryDto, @Req() req)

  @Get('reports/top-products')
  @RequirePermissions({ entityType: 'pos', action: 'Reports' })
  @ApiOperation({ summary: 'Get top selling products' })
  getTopProducts(@Query() query: TopProductsQueryDto, @Req() req)
}
```

### Module: POSModule

**File**: `src/api/pos/pos.module.ts`

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSController } from './pos.controller';
import { POSService } from './pos.service';
import { CashShiftService } from './cash-shift.service';
import { POSReportService } from './pos-report.service';
import { POSOrder } from '../../entities/pos/pos-order.entity';
import { POSOrderLine } from '../../entities/pos/pos-order-line.entity';
import { POSPayment } from '../../entities/pos/pos-payment.entity';
import { CashShift } from '../../entities/pos/cash-shift.entity';
import { POSTable } from '../../entities/pos/pos-table.entity';
import { RBACModule } from '../rbac/rbac.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      POSOrder,
      POSOrderLine,
      POSPayment,
      CashShift,
      POSTable,
    ]),
    RBACModule,
    forwardRef(() => InventoryModule),
    ProductsModule,
    WarehouseModule,
  ],
  providers: [POSService, CashShiftService, POSReportService],
  controllers: [POSController],
  exports: [POSService, CashShiftService, POSReportService],
})
export class POSModule {}
```

## Data Flow Diagrams

### Create Order and Add Items Flow

```
User (Waiter) → Create Order
                    ↓
              Generate order_number
                    ↓
              Assign table (if restaurant)
                    ↓
              Create POSOrder (status: pending)
                    ↓
              Add Line Items
                    ↓
              Fetch product price
                    ↓
              Calculate line totals
                    ↓
              Recalculate order totals
                    ↓
              Return Order
```

### Process Payment Flow

```
User (Cashier) → Process Payment
                    ↓
              Validate order not paid
                    ↓
              Validate open cash shift
                    ↓
              Calculate change (if cash)
                    ↓
              Create POSPayment
                    ↓
              Update order status = 'paid'
                    ↓
              Create inventory movements
                    ↓
              Release table (if applicable)
                    ↓
              Return Payment Receipt
```

### Cash Shift Flow

```
Open Shift → Validate no open shift
                ↓
          Create CashShift (status: open)
                ↓
          Record initial_cash
                ↓
          ... Process orders/payments ...
                ↓
Close Shift → Calculate expected_cash
                ↓
          Record final_cash
                ↓
          Calculate difference
                ↓
          Update status = 'closed'
                ↓
          Generate shift report
```

## Integration Points

### With Inventory Module

- When payment is processed → Create inventory movements (sales_shipment)
- Reference: `reference_type: 'pos_order'`, `reference_id: order.id`

### With Products Module

- Fetch product prices and details
- Validate UoM assignments
- Get product catalog for POS interface

### With Warehouse Module

- Identify POS location
- Validate warehouse exists

### With RBAC Module

- Authenticate users (waiters, cashiers)
- Authorize operations based on permissions
- Track user actions (waiter_id, cashier_id)

## Database Schema

### pos_orders Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| tenant_id | UUID | NOT NULL, FK → rbac_tenants |
| order_number | VARCHAR | NOT NULL |
| warehouse_id | UUID | NOT NULL, FK → warehouses |
| waiter_id | UUID | NOT NULL, FK → users |
| cashier_id | UUID | NULL, FK → users |
| table_number | VARCHAR | NULL |
| zone | VARCHAR | NULL |
| status | ENUM | NOT NULL, DEFAULT 'pending' |
| subtotal | DECIMAL(12,2) | DEFAULT 0 |
| tax | DECIMAL(12,2) | DEFAULT 0 |
| discount | DECIMAL(12,2) | DEFAULT 0 |
| tip | DECIMAL(12,2) | DEFAULT 0 |
| total | DECIMAL(12,2) | DEFAULT 0 |
| paid_at | TIMESTAMP | NULL |
| notes | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:**
- tenant_id, warehouse_id, order_number, status, waiter_id, created_at

## Performance Considerations

- Index on order_number for fast lookup
- Index on created_at for date range queries
- Index on status for filtering pending/paid orders
- Eager loading of lines and payments for order details
- Cache product prices for faster line item creation
- Batch inventory movements for better performance

## Security Considerations

- All operations require authentication (JWT)
- Permission-based access control (pos:Create, pos:Payment, etc.)
- Tenant isolation enforced at service layer
- Audit trail via waiter_id and cashier_id
- Cash shift validation prevents unauthorized payments
- Order validation prevents modifications after payment
