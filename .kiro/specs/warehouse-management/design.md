# Warehouse Management System - Design Document

## Overview

The Warehouse Management System is a NestJS-based module that provides simple, well-structured warehouse/distribution center lifecycle management for the Sinergy ERP platform. The system supports tenant-based multi-organization deployments with full RBAC integration and Mexican billing information.

### Key Design Goals

- **Simplicity**: Minimal, focused entity structure with essential fields only
- **Tenant Isolation**: Complete data isolation between organizations
- **Tax Compliance**: Support for Mexican billing requirements (RFC, Razón Social)
- **Scalability**: Efficient pagination and filtering for large warehouse datasets
- **Data Integrity**: Proper validation and referential integrity

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)                   │
│                    WarehouseController                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Service Layer                              │
│                    WarehouseService                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Data Access Layer (TypeORM)                 │
│                      Warehouse Entity                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│                      warehouses table                        │
└─────────────────────────────────────────────────────────────┘
```

### Module Dependencies

- **TypeORM**: ORM for database operations
- **NestJS**: Framework for API and service layer
- **class-validator**: DTO validation
- **class-transformer**: DTO transformation
- **Swagger**: API documentation
- **RBAC Module**: Permission checking and tenant context

## Components and Interfaces

### 1. Warehouse Entity

The core entity representing a warehouse/distribution center in the system.

```typescript
@Entity('warehouses')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('code_index', ['code'])
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Basic Information
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  // Address Information
  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zip_code: string;

  @Column()
  country: string;

  // Mexican Billing Information
  @Column()
  razon_social: string;

  @Column()
  rfc: string;

  @Column({
    type: 'enum',
    enum: ['Persona Física', 'Persona Moral'],
  })
  persona_type: string;

  // Contact Information
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  contact_person: string;

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  // Metadata
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 2. DTOs

#### CreateWarehouseDto

```typescript
export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip_code: string;

  @IsString()
  country: string;

  @IsString()
  razon_social: string;

  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)
  rfc: string;

  @IsEnum(['Persona Física', 'Persona Moral'])
  persona_type: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

#### UpdateWarehouseDto

```typescript
export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)
  rfc?: string;

  @IsOptional()
  @IsEnum(['Persona Física', 'Persona Moral'])
  persona_type?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
```

#### QueryWarehouseDto

```typescript
export class QueryWarehouseDto {
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

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
```

## Data Models

### Warehouse Data Model

The Warehouse entity represents the core warehouse information with the following structure:

```
Warehouse
├── Identity
│   ├── id (UUID)
│   ├── tenant_id (UUID, FK)
│   └── created_at, updated_at (Timestamps)
├── Basic Information
│   ├── name (String, required)
│   ├── code (String, required, unique per tenant)
│   ├── description (String, optional)
│   └── status (Enum: active, inactive)
├── Address
│   ├── street (String, required)
│   ├── city (String, required)
│   ├── state (String, required)
│   ├── zip_code (String, required)
│   └── country (String, required)
├── Mexican Billing
│   ├── razon_social (String, required)
│   ├── rfc (String, required, validated)
│   └── persona_type (Enum: Persona Física, Persona Moral)
├── Contact
│   ├── phone (String, optional)
│   ├── email (String, optional, validated)
│   └── contact_person (String, optional)
└── Extensibility
    └── metadata (JSON, optional)
```

### Relationships

```
Warehouse (N) ──── (1) RBACTenant
```

### Validation Rules

1. **RFC Format**: 13 characters (3-4 letters + 6 digits + 3 alphanumeric)
2. **Code Uniqueness**: Unique per tenant
3. **Status Values**: 'active' or 'inactive'
4. **Persona Type**: 'Persona Física' or 'Persona Moral'
5. **Email Format**: Valid email if provided

## Correctness Properties

### Property 1: Warehouse Creation Stores All Fields
*For any* valid warehouse data, creating a warehouse SHALL store all provided fields (name, code, address, Mexican billing information, contact information) and they SHALL be retrievable unchanged.
**Validates: Requirements 1.1, 1.4, 4.1, 4.5, 5.1, 5.4**

### Property 2: UUID and Timestamp Generation
*For any* warehouse creation, the system SHALL assign a unique UUID identifier and record creation/update timestamps. Each warehouse SHALL have a distinct UUID, and created_at SHALL equal updated_at at creation time.
**Validates: Requirements 1.2**

### Property 3: Timestamp Preservation on Update
*For any* warehouse, when updated, the created_at timestamp SHALL remain unchanged while updated_at SHALL be newer than the original updated_at value.
**Validates: Requirements 1.3, 3.3**

### Property 4: RFC Format Validation
*For any* RFC string, if it does not match the required format (13 characters), the warehouse creation or update SHALL be rejected with a validation error.
**Validates: Requirements 4.4**

### Property 5: Code Uniqueness per Tenant
*For any* warehouse code within a tenant, the code SHALL be unique. When attempting to create a warehouse with a duplicate code, the operation SHALL be rejected.
**Validates: Requirements 8.1, 8.2**

### Property 6: Tenant Isolation in Creation
*For any* warehouse created by a user, the warehouse's tenant_id SHALL match the requesting user's tenant_id, and the warehouse SHALL only be accessible to users of that tenant.
**Validates: Requirements 6.1, 6.2**

### Property 7: Tenant Isolation in Mutations
*For any* warehouse from tenant A, when a user from tenant B attempts to update or delete it, the operation SHALL be rejected with a 403 Forbidden response.
**Validates: Requirements 6.3, 6.4**

### Property 8: Cascade Delete on Tenant Deletion
*For any* tenant, when the tenant is deleted, all warehouses associated with that tenant_id SHALL be automatically deleted.
**Validates: Requirements 6.5**

### Property 9: Default Status is Active
*For any* warehouse created without an explicit status, the status field SHALL default to 'active'.
**Validates: Requirements 3.1**

### Property 10: Status Transitions
*For any* warehouse, the status field SHALL support transitions between 'active' and 'inactive' states. Any status value outside these two options SHALL be rejected.
**Validates: Requirements 3.2**

### Property 11: Status Filtering
*For any* query with a status filter, the returned warehouses SHALL only include warehouses with the specified status. Warehouses with other statuses SHALL not be included.
**Validates: Requirements 3.4**

### Property 12: Search and Pagination
*For any* search query with filters (name, code, state, country) and pagination parameters (page, limit), the returned warehouses SHALL match the filter criteria and respect pagination boundaries. The response SHALL include total count and pagination metadata.
**Validates: Requirements 1.5, 2.4, 8.4**

### Property 13: Email Validation
*For any* email provided, if it is not in valid email format, the warehouse creation or update SHALL be rejected with a validation error.
**Validates: Requirements 5.4**

### Property 14: Warehouse Serialization Round Trip
*For any* warehouse, when serialized to JSON and then deserialized, the resulting warehouse object SHALL be equivalent to the original, preserving all fields including RFC and Razón Social.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

## Error Handling

### Validation Errors (400 Bad Request)

- Invalid RFC format
- Invalid email format
- Invalid status value
- Missing required fields
- Duplicate code within tenant
- Invalid enum values

### Authentication Errors (401 Unauthorized)

- Missing or invalid JWT token
- Expired token

### Authorization Errors (403 Forbidden)

- User lacks required permission (warehouses:Create, warehouses:Read, warehouses:Update, warehouses:Delete)
- User attempting to access warehouse from different tenant

### Not Found Errors (404 Not Found)

- Warehouse ID does not exist

## Testing Strategy

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions:

1. **Warehouse Creation Tests**
   - Create warehouse with all fields
   - Create warehouse with invalid RFC format
   - Create warehouse with missing required fields
   - Create warehouse with duplicate code

2. **Warehouse Update Tests**
   - Update warehouse basic information
   - Update warehouse status
   - Update warehouse with invalid data
   - Verify created_at is unchanged
   - Verify updated_at is newer

3. **Tenant Isolation Tests**
   - Verify warehouse belongs to correct tenant
   - Verify cross-tenant access is denied
   - Verify cascade delete on tenant deletion

4. **Status Management Tests**
   - Create warehouse with default status
   - Update warehouse status
   - Filter warehouses by status

5. **Search and Pagination Tests**
   - Search warehouses by name
   - Search warehouses by code
   - Filter by state and country
   - Verify pagination works correctly

### Property-Based Testing

Property-based tests validate universal properties across all inputs using randomization:

1. **Property 1: Warehouse Creation Stores All Fields**
   - Generate random warehouse data
   - Create warehouse
   - Retrieve warehouse
   - Verify all fields match

2. **Property 5: Code Uniqueness per Tenant**
   - Create multiple warehouses with different codes
   - Attempt to create warehouse with duplicate code
   - Verify rejection

3. **Property 6: Tenant Isolation in Creation**
   - Create warehouses for different tenants
   - Verify each tenant only sees their warehouses

4. **Property 9: Default Status is Active**
   - Create warehouses without explicit status
   - Verify all default to 'active'

5. **Property 12: Search and Pagination**
   - Create warehouses with various attributes
   - Query with filters and pagination
   - Verify results match criteria and pagination

6. **Property 14: Warehouse Serialization Round Trip**
   - Create warehouse with all fields
   - Serialize to JSON
   - Deserialize from JSON
   - Verify equivalent to original

### Test Configuration

- Minimum 100 iterations per property-based test
- Each property test tagged with: **Feature: warehouse-management, Property {number}: {property_text}**
- Unit tests focus on edge cases and error conditions
- Property tests focus on universal correctness across all inputs
