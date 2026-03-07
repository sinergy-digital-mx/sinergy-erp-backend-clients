# Implementation Plan: Vendor Management System

## Overview

This implementation plan breaks down the Vendor Management System into discrete, incremental coding tasks. Each task builds on previous steps, with property-based tests integrated throughout to catch errors early. The system follows the MODULE_STANDARD.md patterns for NestJS, TypeORM, and RBAC integration.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure: `src/api/vendor/`, `src/entities/vendor/`, `src/database/migrations/`
  - Define core TypeScript interfaces and types for Vendor entity
  - Set up testing framework configuration
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 2. Create Vendor entity and database migration
  - [x] 2.1 Implement Vendor entity with all fields
    - Include UUID primary key, tenant_id foreign key, timestamps, and indexes
    - Add enum columns for persona_type and status
    - Include all address and Mexican billing fields
    - _Requirements: 1.1, 1.2, 2.1, 4.1_
  
  - [x]* 2.2 Write property test for Vendor entity creation
    - **Property 1: Vendor Creation Stores All Fields**
    - **Validates: Requirements 1.1, 1.4, 4.1, 4.5**
  
  - [x] 2.3 Create database migration for vendors table
    - Define all columns with proper types and constraints
    - Create indexes on tenant_id, status, and rfc
    - Add foreign key constraint to rbac_tenants
    - _Requirements: 1.1, 1.2_

- [x] 3. Create DTOs for Vendor operations
  - [x] 3.1 Implement CreateVendorDto with validation
    - Add validators for RFC format
    - Include all required fields
    - _Requirements: 1.1, 4.1, 4.4_
  
  - [x] 3.2 Implement UpdateVendorDto with validation
    - Make all fields optional
    - Include same validators as CreateVendorDto
    - _Requirements: 1.3, 2.2_
  
  - [x] 3.3 Implement QueryVendorDto for search and pagination
    - Add page, limit, search, status, state, country filters
    - Include pagination validation (min/max limits)
    - _Requirements: 1.5, 2.4_

- [x] 4. Create VendorService with core business logic
  - [x] 4.1 Implement create() method
    - Validate RFC format
    - Set default status to 'active'
    - Store tenant_id from context
    - _Requirements: 1.1, 3.1, 4.1_
  
  - [x]* 4.2 Write property test for RFC validation
    - **Property 4: RFC Format Validation**
    - **Validates: Requirements 4.4**
  
  - [x] 4.3 Implement findAll() method with pagination and filtering
    - Support search by name, state, country
    - Support status filtering
    - Implement pagination with page/limit validation
    - Filter by tenant_id
    - _Requirements: 1.5, 2.4, 5.2_
  
  - [x]* 4.4 Write property test for search and pagination
    - **Property 11: Search and Pagination**
    - **Validates: Requirements 1.5, 2.4**
  
  - [x] 4.5 Implement findOne() method
    - Verify vendor belongs to tenant
    - Return 404 if not found
    - _Requirements: 1.4, 5.2_
  
  - [x] 4.6 Implement update() method
    - Verify vendor belongs to tenant
    - Preserve created_at timestamp
    - Update updated_at timestamp
    - Validate RFC format
    - _Requirements: 1.3, 2.2, 5.3_
  
  - [x]* 4.7 Write property test for timestamp preservation
    - **Property 3: Timestamp Preservation on Update**
    - **Validates: Requirements 1.3, 3.3**
  
  - [x] 4.8 Implement remove() method
    - Verify vendor belongs to tenant
    - Delete vendor record
    - _Requirements: 5.3_

- [x] 5. Create VendorController with API endpoints
  - [x] 5.1 Implement POST /tenant/vendors endpoint
    - Use @RequirePermissions decorator for 'vendors:Create'
    - Call VendorService.create()
    - Return 201 Created with vendor data
    - Document with Swagger decorators
    - _Requirements: 1.1, 6.1_
  
  - [x] 5.2 Implement GET /tenant/vendors endpoint
    - Use @RequirePermissions decorator for 'vendors:Read'
    - Call VendorService.findAll() with query parameters
    - Return paginated results
    - Document with Swagger decorators
    - _Requirements: 1.5, 6.2_
  
  - [x] 5.3 Implement GET /tenant/vendors/:id endpoint
    - Use @RequirePermissions decorator for 'vendors:Read'
    - Call VendorService.findOne()
    - Return vendor data or 404
    - Document with Swagger decorators
    - _Requirements: 1.4, 6.2_
  
  - [x] 5.4 Implement PUT /tenant/vendors/:id endpoint
    - Use @RequirePermissions decorator for 'vendors:Update'
    - Call VendorService.update()
    - Return updated vendor data
    - Document with Swagger decorators
    - _Requirements: 1.3, 6.3_
  
  - [x] 5.5 Implement DELETE /tenant/vendors/:id endpoint
    - Use @RequirePermissions decorator for 'vendors:Delete'
    - Call VendorService.remove()
    - Return 200 OK
    - Document with Swagger decorators
    - _Requirements: 6.4_

- [x] 6. Implement tenant isolation and security
  - [x] 6.1 Verify tenant_id filtering in all queries
    - Ensure all service methods filter by tenant_id
    - Verify findOne() checks tenant ownership
    - Verify update() and remove() check tenant ownership
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x]* 6.2 Write property test for tenant isolation in creation
    - **Property 5: Tenant Isolation in Creation**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x]* 6.3 Write property test for tenant isolation in mutations
    - **Property 6: Tenant Isolation in Mutations**
    - **Validates: Requirements 5.3, 5.4**
  
  - [x] 6.4 Implement cascade delete on tenant deletion
    - Add TypeORM cascade delete configuration
    - Verify vendors are deleted when tenant is deleted
    - _Requirements: 5.5_
  
  - [x]* 6.5 Write property test for cascade delete
    - **Property 7: Cascade Delete on Tenant Deletion**
    - **Validates: Requirements 5.5**

- [x] 7. Implement status management
  - [x] 7.1 Verify default status is 'active' on creation
    - Ensure create() sets status to 'active' if not provided
    - _Requirements: 3.1_
  
  - [x]* 7.2 Write property test for default status
    - **Property 8: Default Status is Active**
    - **Validates: Requirements 3.1**
  
  - [x] 7.3 Implement status validation
    - Validate status is one of: 'active', 'inactive'
    - Reject invalid status values
    - _Requirements: 3.2_
  
  - [x]* 7.4 Write property test for status transitions
    - **Property 9: Status Transitions**
    - **Validates: Requirements 3.2**
  
  - [x] 7.5 Implement status filtering in findAll()
    - Support filtering vendors by status
    - _Requirements: 3.4_
  
  - [x]* 7.6 Write property test for status filtering
    - **Property 10: Status Filtering**
    - **Validates: Requirements 3.4**

- [x] 8. Implement serialization and round-trip testing
  - [x] 8.1 Implement vendor serialization to JSON
    - Ensure all fields are included in JSON output
    - Maintain data type consistency
    - _Requirements: 7.1, 7.4_
  
  - [x] 8.2 Implement vendor deserialization from JSON
    - Reconstruct vendor object from JSON
    - Validate all fields are correctly typed
    - _Requirements: 7.2_
  
  - [x]* 8.3 Write property test for serialization round trip
    - **Property 12: Vendor Serialization Round Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 9. Create VendorModule and wire dependencies
  - [x] 9.1 Create vendor.module.ts
    - Import TypeOrmModule with Vendor entity
    - Import RBACModule for permission checking
    - Register VendorService as provider
    - Register VendorController as controller
    - Export VendorService for use by other modules
    - _Requirements: 1.1, 4.1, 6.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Verify no compilation errors
  - Ask the user if questions arise

- [x] 11. Create integration tests
  - [x]* 11.1 Write integration test for complete vendor lifecycle
    - Create vendor with all fields
    - Update vendor information
    - Query vendors with filters
    - Delete vendor
    - Verify all operations succeed
    - _Requirements: 1.1, 1.3, 1.5, 5.2_
  
  - [x]* 11.2 Write integration test for tenant isolation
    - Create vendors for different tenants
    - Verify cross-tenant access is denied
    - Verify each tenant only sees their vendors
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x]* 11.3 Write integration test for RBAC permissions
    - Test each permission (Create, Read, Update, Delete)
    - Verify operations are denied without permissions
    - Verify operations succeed with permissions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x]* 11.4 Write integration test for Mexican billing validation
    - Test vendor creation with valid RFC and Razón Social
    - Test validation failures with invalid data
    - _Requirements: 4.1, 4.4_
  
  - [x]* 11.5 Write integration test for address information
    - Create vendor with complete address
    - Update address fields
    - Filter vendors by state and country
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Verify API documentation is complete
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests are integrated throughout to catch errors early
- Checkpoints ensure incremental validation of functionality
- All code follows MODULE_STANDARD.md patterns for consistency
- RBAC integration uses @RequirePermissions decorator for all endpoints
- Tenant isolation is enforced at the service layer for all operations

