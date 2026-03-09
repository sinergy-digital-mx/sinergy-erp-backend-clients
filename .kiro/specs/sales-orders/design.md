# Sales Orders Module - Technical Design Document

## Overview

El módulo de Sales Orders (Órdenes de Venta) es un componente fundamental del sistema Sinergy ERP que permite a los usuarios crear, gestionar y consultar órdenes de venta con aislamiento multi-tenant completo y control de permisos basado en roles (RBAC).

### Purpose

Este módulo proporciona funcionalidad CRUD completa para órdenes de venta, incluyendo:
- Creación de nuevas órdenes de venta con validación de datos
- Actualización de órdenes existentes con verificación de pertenencia al tenant
- Eliminación de órdenes con control de permisos
- Consulta de órdenes individuales por ID
- Listado paginado de órdenes con búsqueda y filtrado
- Aislamiento completo de datos entre tenants
- Integración con el sistema RBAC para control de acceso

### Key Features

- **Multi-tenant Architecture**: Aislamiento completo de datos por tenant con verificación en todas las operaciones
- **RBAC Integration**: Control de acceso basado en permisos (Create, Read, Update, Delete)
- **Pagination**: Sistema de paginación eficiente con límites configurables (1-100 items por página)
- **Search & Filtering**: Búsqueda por nombre y filtrado por estado
- **API Documentation**: Documentación Swagger completa para todos los endpoints
- **Data Validation**: Validación robusta de entrada usando class-validator
- **Error Handling**: Manejo consistente de errores con códigos HTTP apropiados
- **Extensibility**: Campo metadata JSON para datos adicionales sin cambios de esquema

## Architecture

### High-Level Architecture

El módulo sigue la arquitectura estándar de NestJS con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (HTTP)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         SalesOrderController                           │ │
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
│  │         SalesOrderService                              │ │
│  │  - CRUD Operations                                     │ │
│  │  - Tenant Isolation Logic                              │ │
│  │  - Pagination Logic                                    │ │
│  │  - Search & Filter Logic                               │ │
│  │  - Business Rules Validation                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         TypeORM Repository                             │ │
│  │  - Database Queries                                    │ │
│  │  - Query Builder                                       │ │
│  │  - Transaction Management                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         PostgreSQL Database                            │ │
│  │  - sales_orders table                                  │ │
│  │  - Indexes (tenant_id, status)                         │ │
│  │  - Foreign Keys (tenant_id → rbac_tenants)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

```
SalesOrdersModule
├── TypeOrmModule.forFeature([SalesOrder])
├── RBACModule (for authentication & authorization)
└── Exports: SalesOrderService (for use by other modules)
```

### Request Flow

1. **HTTP Request** → Controller receives request
2. **Authentication** → JwtAuthGuard validates JWT token
3. **Authorization** → PermissionGuard checks user permissions
4. **Validation** → class-validator validates DTO
5. **Business Logic** → Service processes request with tenant isolation
6. **Data Access** → Repository executes database query
7. **Response** → Controller returns formatted response

## Components and Interfaces

### Entity: SalesOrder

**File**: `src/entities/sales-orders/sales-order.entity.ts`

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

@Entity('sales_orders')
@Index('sales_orders_tenant_idx', ['tenant_id'])
@Index('sales_orders_status_idx', ['status'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

**Key Design Decisions**:
- UUID primary key for distributed system compatibility
- Cascade delete on tenant relationship ensures data cleanup
- Status enum provides type safety and database constraints
- Metadata JSON column allows extensibility without schema changes
- Indexes on tenant_id and status optimize query performance
- Automatic timestamp management via decorators

### DTOs (Data Transfer Objects)

#### CreateSalesOrderDto

**File**: `src/api/sales-orders/dto/create-sales-order.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesOrderDto {
  @ApiProperty({
    description: 'Name of the sales order',
    example: 'Order #12345',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the sales order',
    example: 'Monthly subscription renewal',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the sales order',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'processing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { customer_notes: 'Urgent delivery', priority: 'high' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

#### UpdateSalesOrderDto

**File**: `src/api/sales-orders/dto/update-sales-order.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalesOrderDto {
  @ApiPropertyOptional({
    description: 'Name of the sales order',
    example: 'Order #12345 - Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the sales order',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the sales order',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'processing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { updated_by: 'admin', reason: 'customer request' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

#### QuerySalesOrderDto

**File**: `src/api/sales-orders/dto/query-sales-order.dto.ts`

```typescript
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySalesOrderDto {
  @ApiPropertyOptional({
    description: 'Page number (minimum: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (minimum: 1, maximum: 100)',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for filtering by name (case-insensitive)',
    example: 'Order',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    example: 'confirmed',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
```

#### PaginatedSalesOrderDto

**File**: `src/api/sales-orders/dto/paginated-sales-order.dto.ts`

```typescript
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';

export interface PaginatedSalesOrderDto {
  data: SalesOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Service: SalesOrderService

**File**: `src/api/sales-orders/sales-order.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { PaginatedSalesOrderDto } from './dto/paginated-sales-order.dto';

@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
  ) {}

  /**
   * Create a new sales order
   * @param dto - Sales order creation data
   * @param tenantId - Tenant ID from authenticated user
   * @returns Created sales order
   */
  async create(
    dto: CreateSalesOrderDto,
    tenantId: string,
  ): Promise<SalesOrder> {
    const salesOrder = this.salesOrderRepository.create({
      ...dto,
      tenant_id: tenantId,
    });
    return this.salesOrderRepository.save(salesOrder);
  }

  /**
   * Find all sales orders for a tenant with pagination and filters
   * @param tenantId - Tenant ID from authenticated user
   * @param query - Query parameters (page, limit, search, status)
   * @returns Paginated sales orders
   */
  async findAll(
    tenantId: string,
    query?: QuerySalesOrderDto,
  ): Promise<PaginatedSalesOrderDto> {
    // Normalize and validate pagination parameters
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Build query with tenant isolation
    const queryBuilder = this.salesOrderRepository
      .createQueryBuilder('sales_order')
      .where('sales_order.tenant_id = :tenantId', { tenantId });

    // Apply search filter (case-insensitive partial match on name)
    if (query?.search) {
      queryBuilder.andWhere(
        'LOWER(sales_order.name) LIKE LOWER(:search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply status filter (exact match)
    if (query?.status) {
      queryBuilder.andWhere('sales_order.status = :status', {
        status: query.status,
      });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('sales_order.created_at', 'DESC');

    // Execute count and data queries
    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Find a single sales order by ID
   * @param id - Sales order ID
   * @param tenantId - Tenant ID from authenticated user
   * @returns Sales order
   * @throws NotFoundException if not found
   */
  async findOne(id: string, tenantId: string): Promise<SalesOrder> {
    return this.salesOrderRepository.findOneOrFail({
      where: { id, tenant_id: tenantId },
    });
  }

  /**
   * Update a sales order
   * @param id - Sales order ID
   * @param dto - Update data
   * @param tenantId - Tenant ID from authenticated user
   * @returns Updated sales order
   * @throws NotFoundException if not found
   */
  async update(
    id: string,
    dto: UpdateSalesOrderDto,
    tenantId: string,
  ): Promise<SalesOrder> {
    const salesOrder = await this.findOne(id, tenantId);
    Object.assign(salesOrder, dto);
    return this.salesOrderRepository.save(salesOrder);
  }

  /**
   * Remove a sales order (hard delete)
   * @param id - Sales order ID
   * @param tenantId - Tenant ID from authenticated user
   * @throws NotFoundException if not found
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const salesOrder = await this.findOne(id, tenantId);
    await this.salesOrderRepository.remove(salesOrder);
  }
}
```

**Key Design Decisions**:
- All methods enforce tenant isolation by filtering on tenant_id
- Pagination parameters are normalized and validated at runtime
- Search uses case-insensitive LIKE for better UX
- Query builder provides flexibility for complex filters
- findOneOrFail automatically throws 404 for missing records
- Hard delete is used (soft delete can be added if needed)

### Controller: SalesOrderController

**File**: `src/api/sales-orders/sales-order.controller.ts`

```typescript
import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/sales-orders')
@ApiTags('Sales Orders')
@ApiBearerAuth()
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Post()
  @RequirePermissions({ entityType: 'sales_orders', action: 'Create' })
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiBody({ type: CreateSalesOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Sales order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  create(@Body() dto: CreateSalesOrderDto, @Req() req) {
    return this.salesOrderService.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
  @ApiOperation({
    summary: 'Get paginated sales orders with search and filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for filtering by name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sales orders retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  findAll(@Query() query: QuerySalesOrderDto, @Req() req) {
    return this.salesOrderService.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific sales order by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Sales order UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales order retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Sales order does not exist',
  })
  findOne(@Param('id') id: string, @Req() req) {
    return this.salesOrderService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'sales_orders', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing sales order' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Sales order UUID',
  })
  @ApiBody({ type: UpdateSalesOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Sales order updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Sales order does not exist',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderDto,
    @Req() req,
  ) {
    return this.salesOrderService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'sales_orders', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a sales order by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Sales order UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales order deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Sales order does not exist',
  })
  remove(@Param('id') id: string, @Req() req) {
    return this.salesOrderService.remove(id, req.user.tenantId);
  }
}
```

**Key Design Decisions**:
- All endpoints protected by JwtAuthGuard and PermissionGuard
- Permission names follow convention: `sales_orders:{Action}`
- Comprehensive Swagger documentation for API consumers
- Tenant ID extracted from authenticated user context
- RESTful route structure: `/tenant/sales-orders`

### Module: SalesOrdersModule

**File**: `src/api/sales-orders/sales-orders.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder]),
    RBACModule,
  ],
  providers: [SalesOrderService],
  controllers: [SalesOrderController],
  exports: [SalesOrderService],
})
export class SalesOrdersModule {}
```

**Key Design Decisions**:
- TypeOrmModule.forFeature registers SalesOrder entity
- RBACModule imported for authentication and authorization
- Service exported for potential use by other modules
- Clean separation of concerns

## Data Models

### Database Schema

**Table**: `sales_orders`

| Column       | Type      | Constraints                          | Description                          |
|-------------|-----------|--------------------------------------|--------------------------------------|
| id          | UUID      | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier                    |
| tenant_id   | UUID      | NOT NULL, FK → rbac_tenants(id) CASCADE | Tenant isolation                     |
| name        | VARCHAR   | NOT NULL                             | Sales order name                     |
| description | VARCHAR   | NULL                                 | Optional description                 |
| status      | ENUM      | NOT NULL, DEFAULT 'draft'            | Order status                         |
| metadata    | JSON      | NULL                                 | Extensible metadata                  |
| created_at  | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP  | Creation timestamp                   |
| updated_at  | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP  | Last update timestamp                |

**Indexes**:
- `sales_orders_pkey`: PRIMARY KEY on `id`
- `sales_orders_tenant_idx`: INDEX on `tenant_id` (for tenant filtering)
- `sales_orders_status_idx`: INDEX on `status` (for status filtering)

**Foreign Keys**:
- `fk_sales_orders_tenant`: `tenant_id` → `rbac_tenants(id)` ON DELETE CASCADE

**Enum Types**:
- `sales_order_status`: ['draft', 'confirmed', 'processing', 'completed', 'cancelled']

### Entity Relationships

```
┌─────────────────┐
│  rbac_tenants   │
│  ─────────────  │
│  id (PK)        │
│  name           │
│  ...            │
└────────┬────────┘
         │ 1
         │
         │ CASCADE DELETE
         │
         │ N
┌────────▼────────┐
│  sales_orders   │
│  ─────────────  │
│  id (PK)        │
│  tenant_id (FK) │
│  name           │
│  description    │
│  status         │
│  metadata       │
│  created_at     │
│  updated_at     │
└─────────────────┘
```

### Migration

**File**: `src/database/migrations/{timestamp}-create-sales-orders-table.ts`

```typescript
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateSalesOrdersTable1234567890123
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for status
    await queryRunner.query(`
      CREATE TYPE sales_order_status AS ENUM (
        'draft',
        'confirmed',
        'processing',
        'completed',
        'cancelled'
      );
    `);

    // Create sales_orders table
    await queryRunner.createTable(
      new Table({
        name: 'sales_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'sales_order_status',
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on tenant_id
    await queryRunner.createIndex(
      'sales_orders',
      new TableIndex({
        name: 'sales_orders_tenant_idx',
        columnNames: ['tenant_id'],
      }),
    );

    // Create index on status
    await queryRunner.createIndex(
      'sales_orders',
      new TableIndex({
        name: 'sales_orders_status_idx',
        columnNames: ['status'],
      }),
    );

    // Create foreign key to rbac_tenants
    await queryRunner.createForeignKey(
      'sales_orders',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_sales_orders_tenant',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'sales_orders',
      'fk_sales_orders_tenant',
    );

    // Drop indexes
    await queryRunner.dropIndex('sales_orders', 'sales_orders_status_idx');
    await queryRunner.dropIndex('sales_orders', 'sales_orders_tenant_idx');

    // Drop table
    await queryRunner.dropTable('sales_orders');

    // Drop enum type
    await queryRunner.query('DROP TYPE sales_order_status;');
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 3.4, 4.3, 5.3, and 13.1 all test the same behavior: throwing 404 for non-existent records → Combined into Property 4
- Properties 3.2, 4.2, 5.2, 12.2, 12.4, and 12.5 all test tenant isolation → Combined into Property 3
- Properties 2.2, 8.5, and 12.3 all test automatic tenant_id assignment → Combined into Property 2
- Properties 2.4, 3.5, 4.4, 5.4, 6.8, 8.4, and 13.4 all test permission denial → Combined into example test
- Properties 2.5 and 13.2 both test validation error responses → Combined into Property 6
- Properties 6.1, 7.4, and 12.1 all test tenant filtering in queries → Combined into Property 3
- Properties 10.2 and 2.3 both test DTO validation → Combined into Property 6
- Properties 10.4 and 3.3 both test update DTO validation → Combined into Property 6

### Property 1: Automatic Timestamp Creation

*For any* sales order created through the service, the `created_at` and `updated_at` fields should be automatically set to a timestamp close to the current time (within a reasonable delta).

**Validates: Requirements 1.3, 1.4, 2.6**

### Property 2: Automatic Tenant Assignment

*For any* sales order creation request with valid data and a tenant ID, the created sales order should have its `tenant_id` field set to match the provided tenant ID from the authenticated user context.

**Validates: Requirements 2.2, 8.5, 12.3**

### Property 3: Tenant Isolation

*For any* operation (create, read, update, delete, list) performed by a user, the system should only access or return sales orders that belong to that user's tenant, and should reject operations on sales orders from other tenants.

**Validates: Requirements 3.2, 4.2, 5.2, 6.1, 7.4, 12.1, 12.2, 12.4, 12.5**

### Property 4: Not Found Error for Invalid IDs

*For any* operation (findOne, update, delete) with a non-existent sales order ID or an ID belonging to a different tenant, the service should throw a 404 Not Found error.

**Validates: Requirements 3.4, 4.3, 5.3, 13.1**

### Property 5: Successful CRUD Operations

*For any* valid CreateSalesOrderDto, the service should successfully create a sales order; *for any* existing sales order and valid UpdateSalesOrderDto, the service should successfully update it; *for any* existing sales order ID, the service should successfully retrieve it; *for any* existing sales order ID, the service should successfully delete it.

**Validates: Requirements 2.1, 3.1, 4.1, 5.1**

### Property 6: Input Validation

*For any* invalid input data (missing required fields, invalid types, invalid enum values), the validation should fail and return a 400 Bad Request response with detailed validation errors.

**Validates: Requirements 2.3, 2.5, 3.3, 10.2, 10.4, 13.2**

### Property 7: Updated Timestamp Modification

*For any* sales order update operation, the `updated_at` timestamp should be automatically changed to a value greater than the previous `updated_at` value.

**Validates: Requirements 1.4, 3.6**

### Property 8: Hard Delete Behavior

*For any* sales order that is deleted, subsequent queries for that sales order ID should fail with a 404 Not Found error, confirming the record has been removed from the database.

**Validates: Requirements 4.5**

### Property 9: Complete Field Retrieval

*For any* sales order retrieved by ID, the response should include all entity fields (id, tenant_id, name, description, status, metadata, created_at, updated_at).

**Validates: Requirements 5.5**

### Property 10: Pagination Defaults

*For any* list request without pagination parameters, the response should default to page 1 with a limit of 20 items.

**Validates: Requirements 6.2**

### Property 11: Pagination Bounds Enforcement

*For any* page value less than 1, it should be normalized to 1; *for any* limit value less than 1, it should be normalized to 1; *for any* limit value greater than 100, it should be capped at 100.

**Validates: Requirements 6.3, 6.4, 6.5, 10.7, 10.8**

### Property 12: Pagination Metadata Completeness

*For any* paginated response, the result should include all required metadata fields: `data`, `total`, `page`, `limit`, `totalPages`, `hasNext`, and `hasPrev`, with correct calculations.

**Validates: Requirements 6.6**

### Property 13: Result Ordering

*For any* list of sales orders returned by the service, the results should be ordered by `created_at` in descending order (newest first).

**Validates: Requirements 6.7**

### Property 14: Search Filter Behavior

*For any* search term provided, all returned sales orders should have names that contain the search term using case-insensitive partial matching.

**Validates: Requirements 7.1**

### Property 15: Status Filter Behavior

*For any* status filter provided, all returned sales orders should have a status that exactly matches the provided status value.

**Validates: Requirements 7.2**

### Property 16: Combined Filter Logic

*For any* request with both search and status filters, all returned sales orders should satisfy both conditions (AND logic) and belong to the user's tenant.

**Validates: Requirements 7.3, 7.4**

## Error Handling

### Error Response Strategy

The module implements a comprehensive error handling strategy with appropriate HTTP status codes and meaningful error messages:

#### 400 Bad Request
- **Trigger**: Invalid input data, validation failures
- **Response**: Detailed validation errors with field-level messages
- **Example**:
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "status must be one of: draft, confirmed, processing, completed, cancelled"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized
- **Trigger**: Missing or invalid JWT token
- **Response**: Authentication error message
- **Example**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
- **Trigger**: User lacks required permissions
- **Response**: Permission denial message
- **Example**:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found
- **Trigger**: Sales order not found or belongs to different tenant
- **Response**: Entity not found message
- **Example**:
```json
{
  "statusCode": 404,
  "message": "Entity not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
- **Trigger**: Unexpected database or system errors
- **Response**: Generic error message (details logged server-side)
- **Example**:
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### Error Handling Implementation

```typescript
// Service layer - automatic 404 via findOneOrFail
async findOne(id: string, tenantId: string): Promise<SalesOrder> {
  return this.salesOrderRepository.findOneOrFail({
    where: { id, tenant_id: tenantId },
  });
  // Throws EntityNotFoundError if not found
}

// Controller layer - validation pipe handles 400 errors
@Post()
create(@Body() dto: CreateSalesOrderDto, @Req() req) {
  // ValidationPipe automatically returns 400 for invalid DTOs
  return this.salesOrderService.create(dto, req.user.tenantId);
}

// Guards handle 401 and 403 errors
@UseGuards(JwtAuthGuard, PermissionGuard) // 401 and 403
```

### Error Propagation

- **Validation Errors**: Caught by NestJS ValidationPipe, transformed to 400 responses
- **Authentication Errors**: Caught by JwtAuthGuard, transformed to 401 responses
- **Authorization Errors**: Caught by PermissionGuard, transformed to 403 responses
- **Not Found Errors**: TypeORM EntityNotFoundError caught by exception filter, transformed to 404 responses
- **Database Errors**: Caught by global exception filter, logged, and transformed to 500 responses

## Testing Strategy

### Dual Testing Approach

The module will be tested using both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing

Unit tests will focus on:
- **Specific Examples**: Concrete scenarios that demonstrate correct behavior
- **Integration Points**: Interactions between service and repository
- **Edge Cases**: Empty results, boundary conditions, special characters
- **Error Conditions**: 404 errors, validation failures, permission denials

**Example Unit Tests**:
```typescript
describe('SalesOrderService', () => {
  describe('create', () => {
    it('should create a sales order with valid data', async () => {
      const dto = { name: 'Order #123', status: 'draft' };
      const tenantId = 'tenant-uuid';
      const result = await service.create(dto, tenantId);
      
      expect(result.name).toBe('Order #123');
      expect(result.tenant_id).toBe(tenantId);
      expect(result.status).toBe('draft');
    });

    it('should reject creation with empty name', async () => {
      const dto = { name: '', status: 'draft' };
      const tenantId = 'tenant-uuid';
      
      await expect(service.create(dto, tenantId)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should throw 404 for non-existent ID', async () => {
      const id = 'non-existent-uuid';
      const tenantId = 'tenant-uuid';
      
      await expect(service.findOne(id, tenantId)).rejects.toThrow();
    });

    it('should throw 404 for ID from different tenant', async () => {
      const id = 'order-uuid';
      const wrongTenantId = 'wrong-tenant-uuid';
      
      await expect(service.findOne(id, wrongTenantId)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no orders exist', async () => {
      const tenantId = 'tenant-uuid';
      const result = await service.findAll(tenantId);
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply default pagination', async () => {
      const tenantId = 'tenant-uuid';
      const result = await service.findAll(tenantId);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
```

### Property-Based Testing

Property-based tests will verify universal properties using a PBT library. For TypeScript/NestJS, we will use **fast-check** as the property-based testing library.

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: sales-orders, Property {number}: {property_text}`

**Example Property Tests**:

```typescript
import * as fc from 'fast-check';

describe('SalesOrderService - Property Tests', () => {
  // Feature: sales-orders, Property 1: Automatic Timestamp Creation
  it('should automatically set timestamps on creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          status: fc.constantFrom('draft', 'confirmed', 'processing', 'completed', 'cancelled'),
        }),
        fc.uuid(),
        async (dto, tenantId) => {
          const before = new Date();
          const result = await service.create(dto, tenantId);
          const after = new Date();
          
          expect(result.created_at).toBeDefined();
          expect(result.updated_at).toBeDefined();
          expect(result.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
          expect(result.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 2: Automatic Tenant Assignment
  it('should assign tenant_id from authenticated user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          status: fc.constantFrom('draft', 'confirmed', 'processing', 'completed', 'cancelled'),
        }),
        fc.uuid(),
        async (dto, tenantId) => {
          const result = await service.create(dto, tenantId);
          expect(result.tenant_id).toBe(tenantId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 3: Tenant Isolation
  it('should only return sales orders from user tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.record({
          name: fc.string({ minLength: 1 }),
          status: fc.constantFrom('draft', 'confirmed', 'processing', 'completed', 'cancelled'),
        })),
        async (tenantId, orders) => {
          // Create orders for this tenant
          for (const order of orders) {
            await service.create(order, tenantId);
          }
          
          // Query should only return this tenant's orders
          const result = await service.findAll(tenantId);
          
          expect(result.data.every(o => o.tenant_id === tenantId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 11: Pagination Bounds Enforcement
  it('should enforce pagination bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: -100, max: 200 }),
        fc.integer({ min: -100, max: 200 }),
        async (tenantId, page, limit) => {
          const result = await service.findAll(tenantId, { page, limit });
          
          expect(result.page).toBeGreaterThanOrEqual(1);
          expect(result.limit).toBeGreaterThanOrEqual(1);
          expect(result.limit).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 13: Result Ordering
  it('should order results by created_at descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.record({
          name: fc.string({ minLength: 1 }),
          status: fc.constantFrom('draft', 'confirmed', 'processing', 'completed', 'cancelled'),
        }), { minLength: 2 }),
        async (tenantId, orders) => {
          // Create orders with delays to ensure different timestamps
          for (const order of orders) {
            await service.create(order, tenantId);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          const result = await service.findAll(tenantId);
          
          // Verify descending order
          for (let i = 0; i < result.data.length - 1; i++) {
            expect(result.data[i].created_at.getTime())
              .toBeGreaterThanOrEqual(result.data[i + 1].created_at.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 14: Search Filter Behavior
  it('should filter by search term case-insensitively', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1 }),
        async (tenantId, searchTerm) => {
          // Create order with search term in name
          await service.create({ name: `Order ${searchTerm} Test` }, tenantId);
          
          // Search with different case
          const result = await service.findAll(tenantId, { 
            search: searchTerm.toUpperCase() 
          });
          
          // All results should contain search term (case-insensitive)
          expect(result.data.every(o => 
            o.name.toLowerCase().includes(searchTerm.toLowerCase())
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: sales-orders, Property 15: Status Filter Behavior
  it('should filter by exact status match', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom('draft', 'confirmed', 'processing', 'completed', 'cancelled'),
        async (tenantId, status) => {
          // Create order with specific status
          await service.create({ name: 'Test Order', status }, tenantId);
          
          // Filter by status
          const result = await service.findAll(tenantId, { status });
          
          // All results should have exact status
          expect(result.data.every(o => o.status === status)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 16 correctness properties implemented
- **Integration Test Coverage**: End-to-end API tests for all endpoints
- **Edge Case Coverage**: Empty results, boundary values, special characters
- **Error Case Coverage**: All error conditions (400, 401, 403, 404, 500)

### Testing Tools

- **Unit Testing**: Jest (NestJS default)
- **Property-Based Testing**: fast-check
- **E2E Testing**: Supertest with Jest
- **Test Database**: PostgreSQL test instance or in-memory database
- **Mocking**: Jest mocks for repository and external dependencies

## API Specifications

### Base URL

```
/tenant/sales-orders
```

### Authentication

All endpoints require:
- **JWT Bearer Token**: Passed in `Authorization` header
- **Format**: `Authorization: Bearer <token>`

### Endpoints

#### 1. Create Sales Order

**POST** `/tenant/sales-orders`

**Permission Required**: `sales_orders:Create`

**Request Body**:
```json
{
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "status": "draft",
  "metadata": {
    "customer_notes": "Urgent delivery",
    "priority": "high"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "status": "draft",
  "metadata": {
    "customer_notes": "Urgent delivery",
    "priority": "high"
  },
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- 400: Invalid input data
- 401: Unauthorized
- 403: Insufficient permissions

---

#### 2. List Sales Orders (Paginated)

**GET** `/tenant/sales-orders?page=1&limit=20&search=Order&status=draft`

**Permission Required**: `sales_orders:Read`

**Query Parameters**:
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- `search` (optional): Search term for name filtering
- `status` (optional): Filter by status

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Order #12345",
      "description": "Monthly subscription renewal",
      "status": "draft",
      "metadata": {},
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Insufficient permissions

---

#### 3. Get Sales Order by ID

**GET** `/tenant/sales-orders/:id`

**Permission Required**: `sales_orders:Read`

**Path Parameters**:
- `id`: Sales order UUID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "status": "draft",
  "metadata": {},
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Sales order not found

---

#### 4. Update Sales Order

**PUT** `/tenant/sales-orders/:id`

**Permission Required**: `sales_orders:Update`

**Path Parameters**:
- `id`: Sales order UUID

**Request Body** (all fields optional):
```json
{
  "name": "Order #12345 - Updated",
  "description": "Updated description",
  "status": "confirmed",
  "metadata": {
    "updated_by": "admin",
    "reason": "customer request"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Order #12345 - Updated",
  "description": "Updated description",
  "status": "confirmed",
  "metadata": {
    "updated_by": "admin",
    "reason": "customer request"
  },
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z"
}
```

**Error Responses**:
- 400: Invalid input data
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Sales order not found

---

#### 5. Delete Sales Order

**DELETE** `/tenant/sales-orders/:id`

**Permission Required**: `sales_orders:Delete`

**Path Parameters**:
- `id`: Sales order UUID

**Response** (200 OK):
```json
{
  "message": "Sales order deleted successfully"
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Sales order not found

---

### Status Enum Values

- `draft`: Initial state for new orders
- `confirmed`: Order has been confirmed
- `processing`: Order is being processed
- `completed`: Order has been completed
- `cancelled`: Order has been cancelled

### Pagination Behavior

- Default page: 1
- Default limit: 20
- Minimum page: 1 (values < 1 normalized to 1)
- Minimum limit: 1 (values < 1 normalized to 1)
- Maximum limit: 100 (values > 100 capped at 100)
- Results ordered by `created_at` DESC (newest first)

### Search Behavior

- Case-insensitive partial matching on `name` field
- Uses SQL `LIKE` with wildcards: `%search%`
- Combines with other filters using AND logic

### Filter Behavior

- Status filter: Exact match on `status` field
- All filters scoped to user's tenant
- Multiple filters combined with AND logic

## Conclusion

Este diseño técnico proporciona una base sólida para implementar el módulo de Sales Orders siguiendo los estándares establecidos en Sinergy ERP. El módulo garantiza:

- **Aislamiento multi-tenant completo** en todas las operaciones
- **Control de acceso robusto** mediante RBAC
- **Validación exhaustiva** de datos de entrada
- **Paginación eficiente** para grandes volúmenes de datos
- **Búsqueda y filtrado flexible** para encontrar órdenes rápidamente
- **Documentación API completa** para facilitar la integración
- **Testing comprehensivo** con unit tests y property-based tests
- **Manejo de errores consistente** con códigos HTTP apropiados

El módulo está listo para ser implementado siguiendo las especificaciones de este documento de diseño.
