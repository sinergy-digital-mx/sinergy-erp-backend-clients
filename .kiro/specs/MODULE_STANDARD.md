# Sinergy ERP Module Standard

## Overview

This document defines the standard structure and patterns for creating new modules in Sinergy ERP. All modules must follow this standard to ensure consistency, maintainability, and scalability across the application.

## Directory Structure

```
src/
├── api/
│   └── {module-name}/
│       ├── dto/
│       │   ├── create-{entity}.dto.ts
│       │   ├── update-{entity}.dto.ts
│       │   ├── query-{entity}.dto.ts (optional)
│       │   └── {other}.dto.ts
│       ├── {entity}.controller.ts
│       ├── {entity}.service.ts
│       ├── {entity}-{feature}.controller.ts (optional, for sub-resources)
│       ├── {entity}-{feature}.service.ts (optional, for sub-resources)
│       └── {module-name}.module.ts
├── entities/
│   └── {module-name}/
│       ├── {entity}.entity.ts
│       ├── {entity}-{sub-entity}.entity.ts (optional)
│       └── {entity}-status.entity.ts (optional, for enums/statuses)
└── database/
    └── migrations/
        └── {timestamp}-create-{entity}-table.ts
```

## Entity Pattern

### Base Entity Structure

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

@Entity('{table-name}')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status']) // if applicable
export class {EntityName} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Entity-specific columns
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['status1', 'status2'],
    default: 'status1',
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

### Key Principles

- **UUID Primary Keys**: Use `@PrimaryGeneratedColumn('uuid')` for all entities
- **Tenant Isolation**: Every entity must have `tenant_id` column and foreign key
- **Timestamps**: Always include `created_at` and `updated_at` with decorators
- **Indexes**: Create indexes on `tenant_id` and frequently queried columns
- **Relationships**: Use `ManyToOne`, `OneToMany` with proper `JoinColumn` decorators
- **Enums**: Use TypeORM enum columns for status and type fields
- **Metadata**: Include optional `metadata` JSON column for extensibility

## DTO Pattern

### Create DTO

```typescript
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export class Create{EntityName}Dto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['status1', 'status2'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Update DTO

```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class Update{EntityName}Dto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['status1', 'status2'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Query DTO

```typescript
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class Query{EntityName}Dto {
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
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```

## Service Pattern

### Base Service Structure

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { {EntityName} } from '../../entities/{module-name}/{entity}.entity';
import { Create{EntityName}Dto } from './dto/create-{entity}.dto';
import { Update{EntityName}Dto } from './dto/update-{entity}.dto';
import { Query{EntityName}Dto } from './dto/query-{entity}.dto';

interface Paginated{EntityName}Dto {
  data: {EntityName}[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class {EntityName}Service {
  constructor(
    @InjectRepository({EntityName})
    private repo: Repository<{EntityName}>,
  ) {}

  async create(dto: Create{EntityName}Dto, tenantId: string): Promise<{EntityName}> {
    const entity = this.repo.create({
      ...dto,
      tenant_id: tenantId,
    });
    return this.repo.save(entity);
  }

  async findAll(
    tenantId: string,
    query?: Query{EntityName}Dto,
  ): Promise<Paginated{EntityName}Dto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('entity')
      .where('entity.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(entity.name) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('entity.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('entity.created_at', 'DESC');

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

  async findOne(id: string, tenantId: string): Promise<{EntityName}> {
    return this.repo.findOneOrFail({
      where: { id, tenant_id: tenantId },
    });
  }

  async update(
    id: string,
    dto: Update{EntityName}Dto,
    tenantId: string,
  ): Promise<{EntityName}> {
    const entity = await this.findOne(id, tenantId);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const entity = await this.findOne(id, tenantId);
    await this.repo.remove(entity);
  }
}
```

### Key Principles

- **Tenant Filtering**: Always filter by `tenant_id` in all queries
- **Pagination**: Implement pagination with page/limit validation
- **Error Handling**: Use `findOneOrFail` to throw 404 automatically
- **Immutability**: Prevent updates to critical fields (customer_id, property_id, etc.)
- **Relationships**: Load related entities with `leftJoinAndSelect`
- **Validation**: Validate referential integrity before operations

## Controller Pattern

### Base Controller Structure

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
import { {EntityName}Service } from './{entity}.service';
import { Create{EntityName}Dto } from './dto/create-{entity}.dto';
import { Update{EntityName}Dto } from './dto/update-{entity}.dto';
import { Query{EntityName}Dto } from './dto/query-{entity}.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/{entities}')
@ApiTags('{Entities}')
@ApiBearerAuth()
export class {EntityName}Controller {
  constructor(private readonly service: {EntityName}Service) {}

  @Post()
  @RequirePermissions({ entityType: '{entities}', action: 'Create' })
  @ApiOperation({ summary: 'Create a new {entity}' })
  @ApiBody({ type: Create{EntityName}Dto })
  @ApiResponse({ status: 201, description: '{Entity} created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: Create{EntityName}Dto, @Req() req) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: '{entities}', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated {entities} with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of {entities} retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: Query{EntityName}Dto, @Req() req) {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: '{entities}', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific {entity} by ID' })
  @ApiParam({ name: 'id', type: 'string', description: '{Entity} ID' })
  @ApiResponse({ status: 200, description: '{Entity} retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: '{entities}', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing {entity}' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: Update{EntityName}Dto })
  @ApiResponse({ status: 200, description: '{Entity} updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: Update{EntityName}Dto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: '{entities}', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a {entity} by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: '{Entity} deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
```

### Key Principles

- **Route Prefix**: Use `tenant/{entities}` for all routes
- **Guards**: Always use `@UseGuards(JwtAuthGuard, PermissionGuard)`
- **Permissions**: Use `@RequirePermissions` decorator with entityType and action
- **Tenant Context**: Extract `tenantId` from `req.user.tenantId`
- **Swagger Documentation**: Document all endpoints with ApiOperation, ApiResponse
- **Error Responses**: Document all possible error responses (400, 401, 403, 404)

## Module Pattern

### Base Module Structure

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {EntityName}Controller } from './{entity}.controller';
import { {EntityName}Service } from './{entity}.service';
import { {EntityName} } from '../../entities/{module-name}/{entity}.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([{EntityName}]),
    RBACModule,
  ],
  providers: [{EntityName}Service],
  controllers: [{EntityName}Controller],
  exports: [{EntityName}Service],
})
export class {ModuleName}Module {}
```

### Key Principles

- **Imports**: Import TypeOrmModule with entities and RBACModule
- **Exports**: Export services that other modules might need
- **Providers**: Include all services
- **Controllers**: Include all controllers

## RBAC Integration

### Permission Naming Convention

```
{entityType}:{action}
```

Examples:
- `contracts:Create`
- `contracts:Read`
- `contracts:Update`
- `contracts:Delete`
- `payment_plans:Create`
- `payments:Read`

### Permission Guard Usage

```typescript
@RequirePermissions({ entityType: 'contracts', action: 'Create' })
```

## Testing Pattern

### Unit Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { {EntityName}Service } from './{entity}.service';
import { {EntityName} } from '../../entities/{module-name}/{entity}.entity';

describe('{EntityName}Service', () => {
  let service: {EntityName}Service;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {EntityName}Service,
        {
          provide: getRepositoryToken({EntityName}),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<{EntityName}Service>({EntityName}Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an entity', async () => {
      const dto = { name: 'Test' };
      const tenantId = 'tenant-123';
      const expected = { id: '1', ...dto, tenant_id: tenantId };

      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto, tenantId);

      expect(result).toEqual(expected);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        tenant_id: tenantId,
      });
    });
  });
});
```

## Naming Conventions

- **Files**: Use kebab-case (e.g., `create-contract.dto.ts`)
- **Classes**: Use PascalCase (e.g., `CreateContractDto`)
- **Methods**: Use camelCase (e.g., `findByTenant`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`)
- **Database Tables**: Use snake_case (e.g., `payment_plans`)
- **Database Columns**: Use snake_case (e.g., `tenant_id`)

## Best Practices

1. **Always filter by tenant_id** in all queries
2. **Use pagination** for list endpoints (default 20, max 100)
3. **Validate relationships** before creating/updating entities
4. **Use transactions** for multi-entity operations
5. **Implement soft deletes** if needed (add `deleted_at` column)
6. **Document all endpoints** with Swagger decorators
7. **Use DTOs** for all request/response bodies
8. **Implement proper error handling** with meaningful messages
9. **Use indexes** on frequently queried columns
10. **Keep services focused** on business logic, not HTTP concerns

## Migration Pattern

### Create Migration

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class Create{EntityName}Table1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '{table_name}',
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
            name: 'status',
            type: 'enum',
            enum: ['status1', 'status2'],
            default: "'status1'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'rbac_tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      '{table_name}',
      new TableIndex({
        name: 'tenant_index',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('{table_name}');
  }
}
```

## Conclusion

Following this standard ensures that all modules in Sinergy ERP are consistent, maintainable, and scalable. When creating new modules, use this document as a reference and adapt the patterns to your specific needs while maintaining the core principles.

