# Implementation Plan: Warehouse Management System

## Overview

This implementation plan breaks down the Warehouse Management System into discrete, incremental coding tasks. Each task builds on previous steps, with property-based tests integrated throughout to catch errors early. The system follows the MODULE_STANDARD.md patterns for NestJS, TypeORM, and RBAC integration.

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure: `src/api/warehouse/`, `src/entities/warehouse/`, `src/database/migrations/`
  - Define core TypeScript interfaces and types for Warehouse entity
  - Set up testing framework configuration
  - _Requirements: 1.1, 1.2, 6.1_

- [ ] 2. Create Warehouse entity and database migration
  - [ ] 2.1 Implement Warehouse entity with all fields
    - Include UUID primary key, tenant_id foreign key, timestamps, and indexes
    - Add enum columns for persona_type and status
    - Include all address, contact, and Mexican billing fields
    - _Requirements: 1.1, 1.2, 4.1, 6.1_
  
  - [ ]* 2.2 Write property test for Warehouse entity creation
    - **Property 1: Warehouse Creation Stores All Fields**
    - **Validates: Requirements 1.1, 1.4, 4.1, 4.5, 5.1, 5.4**
  
  - [ ] 2.3 Create database migration for warehouses table
    - Define all columns with proper types and constraints
    - Create indexes on tenant_id, status, and code
    - Add foreign key constraint to rbac_tenants
    - _Requirements: 1.1, 1.2_

- [ ] 3. Create DTOs for Warehouse operations
  - [ ] 3.1 Implement CreateWarehouseDto with validation
    - Add validators for RFC format and email
    - Include all required fields
    - _Requirements: 1.1, 4.1, 4.4, 5.4_
  
  - [ ] 3.2 Implement UpdateWarehouseDto with validation
    - Make all fields optional
    - Include same validators as CreateWarehouseDto
    - _Requirements: 1.3, 2.2_
  
  - [ ] 3.3 Implement QueryWarehouseDto for search and pagination
    - Add page, limit, search, status, state, country, code filters
    - Include pagination validation (min/max limits)
    - _Requirements: 1.5, 2.4, 8.4_

- [ ] 4. Create WarehouseService with core business logic
  - [ ] 4.1 Implement create() method
    - Validate RFC format
    - Set default status to 'active'
    - Store tenant_id from context
    - _Requirements: 1.1, 3.1, 6.1_
  
  - [ ]* 4.2 Write property test for RFC validation
    - **Property 4: RFC Format Validation**
    - **Validates: Requirements 4.4**
  
  - [ ] 4.3 Implement findAll() method with pagination and filtering
    - Support search by name and code
    - Support status filtering
    - Implement pagination with page/limit validation
    - Filter by tenant_id
    - _Requirements: 1.5, 2.4, 8.4_
  
  - [ ]* 4.4 Write property test for search and pagination
    - **Property 12: Search and Pagination**
    - **Validates: Requirements 1.5, 2.4, 8.4**
  
  - [ ] 4.5 Implement findOne() method
    - Verify warehouse belongs to tenant
    - Return 404 if not found
    - _Requirements: 1.4, 6.2_
  
  - [ ] 4.6 Implement update() method
    - Verify warehouse belongs to tenant
    - Preserve created_at timestamp
    - Update updated_at timestamp
    - Validate RFC format
    - _Requirements: 1.3, 2.2, 4.4_
  
  - [ ]* 4.7 Write property test for timestamp preservation
    - **Property 3: Timestamp Preservation on Update**
    - **Validates: Requirements 1.3, 3.3**
  
  - [ ] 4.8 Implement remove() method
    - Verify warehouse belongs to tenant
    - Delete warehouse record
    - _Requirements: 6.3_

- [ ] 5. Create WarehouseController with API endpoints
  - [ ] 5.1 Implement POST /tenant/warehouses endpoint
    - Use @RequirePermissions decorator for 'warehouses:Create'
    - Call WarehouseService.create()
    - Return 201 Created with warehouse data
    - Document with Swagger decorators
    - _Requirements: 1.1, 7.1_
  
  - [ ] 5.2 Implement GET /tenant/warehouses endpoint
    - Use @RequirePermissions decorator for 'warehouses:Read'
    - Call WarehouseService.findAll() with query parameters
    - Return paginated results
    - Document with Swagger decorators
    - _Requirements: 1.5, 7.2_
  
  - [ ] 5.3 Implement GET /tenant/warehouses/:id endpoint
    - Use @RequirePermissions decorator for 'warehouses:Read'
    - Call WarehouseService.findOne()
    - Return warehouse data or 404
    - Document with Swagger decorators
    - _Requirements: 1.4, 7.2_
  
  - [ ] 5.4 Implement PUT /tenant/warehouses/:id endpoint
    - Use @RequirePermissions decorator for 'warehouses:Update'
    - Call WarehouseService.update()
    - Return updated warehouse data
    - Document with Swagger decorators
    - _Requirements: 1.3, 7.3_
  
  - [ ] 5.5 Implement DELETE /tenant/warehouses/:id endpoint
    - Use @RequirePermissions decorator for 'warehouses:Delete'
    - Call WarehouseService.remove()
    - Return 200 OK
    - Document with Swagger decorators
    - _Requirements: 7.4_

- [ ] 6. Implement tenant isolation and security
  - [ ] 6.1 Verify tenant_id filtering in all queries
    - Ensure all service methods filter by tenant_id
    - Verify findOne() checks tenant ownership
    - Verify update() and remove() check tenant ownership
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 6.2 Write property test for tenant isolation in creation
    - **Property 6: Tenant Isolation in Creation**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ]* 6.3 Write property test for tenant isolation in mutations
    - **Property 7: Tenant Isolation in Mutations**
    - **Validates: Requirements 6.3, 6.4**
  
  - [ ] 6.4 Implement cascade delete on tenant deletion
    - Add TypeORM cascade delete configuration
    - Verify warehouses are deleted when tenant is deleted
    - _Requirements: 6.5_
  
  - [ ]* 6.5 Write property test for cascade delete
    - **Property 8: Cascade Delete on Tenant Deletion**
    - **Validates: Requirements 6.5**

- [ ] 7. Implement status management
  - [ ] 7.1 Verify default status is 'active' on creation
    - Ensure create() sets status to 'active' if not provided
    - _Requirements: 3.1_
  
  - [ ]* 7.2 Write property test for default status
    - **Property 9: Default Status is Active**
    - **Validates: Requirements 3.1**
  
  - [ ] 7.3 Implement status validation
    - Validate status is one of: 'active', 'inactive'
    - Reject invalid status values
    - _Requirements: 3.2_
  
  - [ ]* 7.4 Write property test for status transitions
    - **Property 10: Status Transitions**
    - **Validates: Requirements 3.2**
  
  - [ ] 7.5 Implement status filtering in findAll()
    - Support filtering warehouses by status
    - _Requirements: 3.4_
  
  - [ ]* 7.6 Write property test for status filtering
    - **Property 11: Status Filtering**
    - **Validates: Requirements 3.4**

- [ ] 8. Implement code uniqueness and contact information
  - [ ] 8.1 Implement code uniqueness validation
    - Validate code is unique per tenant
    - Reject duplicate codes with validation error
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 8.2 Write property test for code uniqueness
    - **Property 5: Code Uniqueness per Tenant**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ] 8.3 Implement contact information storage
    - Store phone, email, contact_person
    - Validate email format if provided
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 8.4 Write property test for email validation
    - **Property 13: Email Validation**
    - **Validates: Requirements 5.4**

- [ ] 9. Implement serialization and round-trip testing
  - [ ] 9.1 Implement warehouse serialization to JSON
    - Ensure all fields are included in JSON output
    - Maintain data type consistency
    - _Requirements: 9.1, 9.4_
  
  - [ ] 9.2 Implement warehouse deserialization from JSON
    - Reconstruct warehouse object from JSON
    - Validate all fields are correctly typed
    - _Requirements: 9.2_
  
  - [ ]* 9.3 Write property test for serialization round trip
    - **Property 14: Warehouse Serialization Round Trip**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 10. Create WarehouseModule and wire dependencies
  - [ ] 10.1 Create warehouse.module.ts
    - Import TypeOrmModule with Warehouse entity
    - Import RBACModule for permission checking
    - Register WarehouseService as provider
    - Register WarehouseController as controller
    - Export WarehouseService for use by other modules
    - _Requirements: 1.1, 6.1, 7.1_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Verify no compilation errors
  - Ask the user if questions arise

- [ ] 12. Create integration tests
  - [ ]* 12.1 Write integration test for complete warehouse lifecycle
    - Create warehouse with all fields
    - Update warehouse information
    - Query warehouses with filters
    - Delete warehouse
    - Verify all operations succeed
    - _Requirements: 1.1, 1.3, 1.5, 6.2_
  
  - [ ]* 12.2 Write integration test for tenant isolation
    - Create warehouses for different tenants
    - Verify cross-tenant access is denied
    - Verify each tenant only sees their warehouses
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 12.3 Write integration test for RBAC permissions
    - Test each permission (Create, Read, Update, Delete)
    - Verify operations are denied without permissions
    - Verify operations succeed with permissions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 12.4 Write integration test for Mexican billing validation
    - Test warehouse creation with valid RFC and Razón Social
    - Test validation failures with invalid data
    - _Requirements: 4.1, 4.4_
  
  - [ ]* 12.5 Write integration test for address and contact information
    - Create warehouse with complete address
    - Update address fields
    - Filter warehouses by state and country
    - Verify contact information is stored
    - _Requirements: 2.1, 2.2, 2.4, 5.1, 5.2, 5.3_

- [ ] 13. Final checkpoint - Ensure all tests pass
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
