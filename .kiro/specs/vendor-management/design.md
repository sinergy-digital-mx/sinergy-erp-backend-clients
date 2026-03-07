# Vendor Management System - Design Document

## Overview

The Vendor Management System is a NestJS-based module that provides simple, well-structured vendor lifecycle management for the Sinergy ERP platform. The system supports tenant-based multi-organization deployments with full RBAC integration and Mexican billing information.

### Key Design Goals

- **Simplicity**: Minimal, focused entity structure with essential fields only
- **Tenant Isolation**: Complete data isolation between organizations
- **Tax Compliance**: Support for Mexican billing requirements (RFC, Razón Social)
- **Scalability**: Efficient pagination and filtering for large vendor datasets
- **Data Integrity**: Proper validation and referential integrity

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)                   │
│                    VendorController                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Service Layer                              │
│                    VendorService                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Data Access Layer (TypeORM)                 │
│                      Vendor Entity                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│                      vendors table                           │
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

### 1. Vendor Entity

The core entity representing a supplier in the system.

```typescript
@Entity('vendors')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('rfc_index', ['rfc'])
export class Vendor {
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

  @Column()
  company_name: string;

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

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### 2. DTOs

#### CreateVendorDto

```typescript
export class CreateVendorDto {
  @IsString()
  name: string;

  @IsString()
  company_name: string;

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
  @IsEnum(['active', 'inactive'])
  status?: string;
}
```

#### UpdateVendorDto

```typescript
export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

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
  @IsEnum(['active', 'inactive'])
  status?: string;
}
```

#### QueryVendorDto

```typescript
export class QueryVendorDto {
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
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
```

## Data Models

### Vendor Data Model

The Vendor entity represents the core supplier information with the following structure:

```
Vendor
├── Identity
│   ├── id (UUID)
│   ├── tenant_id (UUID, FK)
│   └── created_at, updated_at (Timestamps)
├── Basic Information
│   ├── name (String, required)
│   ├── company_name (String, required)
│   └── status (Enum: active, inactive)
├── Address
│   ├── street (String, required)
│   ├── city (String, required)
│   ├── state (String, required)
│   ├── zip_code (String, required)
│   └── country (String, required)
└── Mexican Billing
    ├── razon_social (String, required)
    ├── rfc (String, required, validated)
    └── persona_type (Enum: Persona Física, Persona Moral)
```

### Relationships

```
Vendor (N) ──── (1) RBACTenant
```

### Validation Rules

1. **RFC Format**: 13 characters (3-4 letters + 6 digits + 3 alphanumeric)
2. **Status Values**: 'active' or 'inactive'
3. **Persona Type**: 'Persona Física' or 'Persona Moral'

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Vendor Creation Stores All Fields
*For any* valid vendor data, creating a vendor SHALL store all provided fields (name, company_name, address, Mexican billing information) and they SHALL be retrievable unchanged.
**Validates: Requirements 1.1, 1.4, 4.1, 4.5**

### Property 2: UUID and Timestamp Generation
*For any* vendor creation, the system SHALL assign a unique UUID identifier and record creation/update timestamps. Each vendor SHALL have a distinct UUID, and created_at SHALL equal updated_at at creation time.
**Validates: Requirements 1.2**

### Property 3: Timestamp Preservation on Update
*For any* vendor, when updated, the created_at timestamp SHALL remain unchanged while updated_at SHALL be newer than the original updated_at value.
**Validates: Requirements 1.3, 3.3**

### Property 4: RFC Format Validation
*For any* RFC string, if it does not match the required format (13 characters), the vendor creation or update SHALL be rejected with a validation error.
**Validates: Requirements 4.4**

### Property 5: Tenant Isolation in Creation
*For any* vendor created by a user, the vendor's tenant_id SHALL match the requesting user's tenant_id, and the vendor SHALL only be accessible to users of that tenant.
**Validates: Requirements 5.1, 5.2**

### Property 6: Tenant Isolation in Mutations
*For any* vendor from tenant A, when a user from tenant B attempts to update or delete it, the operation SHALL be rejected with a 403 Forbidden response.
**Validates: Requirements 5.3, 5.4**

### Property 7: Cascade Delete on Tenant Deletion
*For any* tenant, when the tenant is deleted, all vendors associated with that tenant_id SHALL be automatically deleted.
**Validates: Requirements 5.5**

### Property 8: Default Status is Active
*For any* vendor created without an explicit status, the status field SHALL default to 'active'.
**Validates: Requirements 3.1**

### Property 9: Status Transitions
*For any* vendor, the status field SHALL support transitions between 'active' and 'inactive' states. Any status value outside these two options SHALL be rejected.
**Validates: Requirements 3.2**

### Property 10: Status Filtering
*For any* query with a status filter, the returned vendors SHALL only include vendors with the specified status. Vendors with other statuses SHALL not be included.
**Validates: Requirements 3.4**

### Property 11: Search and Pagination
*For any* search query with filters (name, state, country) and pagination parameters (page, limit), the returned vendors SHALL match the filter criteria and respect pagination boundaries. The response SHALL include total count and pagination metadata.
**Validates: Requirements 1.5, 2.4**

### Property 12: Vendor Serialization Round Trip
*For any* vendor, when serialized to JSON and then deserialized, the resulting vendor object SHALL be equivalent to the original, preserving all fields including RFC and Razón Social.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Validation Errors (400 Bad Request)

- Invalid RFC format
- Invalid status value
- Missing required fields
- Invalid enum values

### Authentication Errors (401 Unauthorized)

- Missing or invalid JWT token
- Expired token

### Authorization Errors (403 Forbidden)

- User lacks required permission (vendors:Create, vendors:Read, vendors:Update, vendors:Delete)
- User attempting to access vendor from different tenant

### Not Found Errors (404 Not Found)

- Vendor ID does not exist

## Testing Strategy

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions:

1. **Vendor Creation Tests**
   - Create vendor with all fields
   - Create vendor with invalid RFC format
   - Create vendor with missing required fields

2. **Vendor Update Tests**
   - Update vendor basic information
   - Update vendor status
   - Update vendor with invalid data
   - Verify created_at is unchanged
   - Verify updated_at is newer

3. **Tenant Isolation Tests**
   - Verify vendor belongs to correct tenant
   - Verify cross-tenant access is denied
   - Verify cascade delete on tenant deletion

4. **Status Management Tests**
   - Create vendor with default status
   - Update vendor status
   - Filter vendors by status

5. **Search and Pagination Tests**
   - Search vendors by name
   - Filter by state and country
   - Verify pagination works correctly

### Property-Based Testing

Property-based tests validate universal properties across all inputs using randomization:

1. **Property 1: Vendor Creation Stores All Fields**
   - Generate random vendor data
   - Create vendor
   - Retrieve vendor
   - Verify all fields match

2. **Property 2: UUID and Timestamp Generation**
   - Create multiple vendors
   - Verify each has unique UUID
   - Verify timestamps are valid

3. **Property 3: Timestamp Preservation on Update**
   - Create vendor
   - Wait and update vendor
   - Verify created_at unchanged, updated_at newer

4. **Property 4: RFC Format Validation**
   - Generate valid and invalid RFCs
   - Verify valid RFCs are accepted
   - Verify invalid RFCs are rejected

5. **Property 5: Tenant Isolation in Creation**
   - Create vendors for different tenants
   - Verify each tenant only sees their vendors

6. **Property 6: Tenant Isolation in Mutations**
   - Create vendor for tenant A
   - Attempt update/delete from tenant B
   - Verify 403 Forbidden response

7. **Property 8: Default Status is Active**
   - Create vendors without explicit status
   - Verify all default to 'active'

8. **Property 10: Status Filtering**
   - Create vendors with different statuses
   - Query with status filter
   - Verify only matching vendors returned

9. **Property 11: Search and Pagination**
   - Create vendors with various attributes
   - Query with filters and pagination
   - Verify results match criteria and pagination

10. **Property 12: Vendor Serialization Round Trip**
    - Create vendor with all fields
    - Serialize to JSON
    - Deserialize from JSON
    - Verify equivalent to original

### Test Configuration

- Minimum 100 iterations per property-based test
- Each property test tagged with: **Feature: vendor-management, Property {number}: {property_text}**
- Unit tests focus on edge cases and error conditions
- Property tests focus on universal correctness across all inputs

