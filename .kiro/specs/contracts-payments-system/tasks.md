# Implementation Plan: Payment Plans System Enhancement

## Overview

This implementation plan breaks down the Payment Plans System enhancement into discrete NestJS development tasks. The system adds a new PaymentPlan entity and service to the existing Sinergy ERP contracts and payments modules, enabling flexible payment scheduling with multiple frequency options. Implementation proceeds from database setup through service layer development, followed by API endpoints, and comprehensive testing. All tasks follow the established Sinergy ERP module patterns and conventions.

## Prerequisites

- Existing Sinergy ERP project with NestJS, TypeORM, and RBAC infrastructure
- Existing Contract and Payment entities and services
- Understanding of Sinergy ERP module standard (see MODULE_STANDARD.md)

## Tasks

- [ ] 1. Set up Payment Plan entity and database migration
  - Create `src/entities/contracts/payment-plan.entity.ts` following Sinergy ERP entity pattern
  - Define PaymentPlan entity with UUID primary key, tenant_id, contract_id, frequency, amount_per_period, currency, start_date, end_date, next_payment_date, status, metadata, created_at, updated_at
  - Add database constraints: amount_per_period > 0, start_date <= end_date, frequency enum validation
  - Create database migration file for payment_plans table with proper indexes and foreign keys
  - Add cascade delete from contracts to payment_plans
  - _Requirements: 2.1, 2.5, 8.4-8.5_

- [ ] 2. Create Payment Plan DTOs
  - [ ] 2.1 Create `src/api/contracts/dto/create-payment-plan.dto.ts`
    - Define fields: contract_id, frequency, amount_per_period, currency, start_date, end_date (optional), metadata (optional)
    - Add validation decorators: IsUUID, IsEnum, IsNumber, IsDate, Min, etc.
    - _Requirements: 2.1_
  
  - [ ] 2.2 Create `src/api/contracts/dto/update-payment-plan.dto.ts`
    - Define optional fields for updates
    - Prevent updates to contract_id (immutable)
    - _Requirements: 2.9-2.10_
  
  - [ ] 2.3 Create `src/api/contracts/dto/query-payment-plan.dto.ts`
    - Define pagination fields: page, limit
    - Define filter fields: status, frequency, contract_id
    - _Requirements: 2.11_

- [ ] 3. Implement Payment Plan Service
  - [ ] 3.1 Create `src/api/contracts/payment-plan.service.ts` following Sinergy ERP service pattern
    - Implement createPaymentPlan with validation and referential integrity checks
    - Implement findAll with pagination, filtering, and tenant isolation
    - Implement findOne with tenant filtering
    - Implement updatePaymentPlan with recalculation logic
    - Implement removePaymentPlan with cascade to payments
    - _Requirements: 2.1-2.4, 2.9-2.11, 5.5-5.8, 7.4-7.6, 8.4-8.5_
  
  - [ ] 3.2 Implement date calculation logic
    - Create calculateNextPaymentDate method
    - Implement monthly frequency: add 1 month to start_date
    - Implement quarterly frequency: add 3 months to start_date
    - Implement annual frequency: add 1 year to start_date
    - Implement one_time frequency: end_date = start_date
    - _Requirements: 2.4-2.8_
  
  - [ ] 3.3 Implement Payment Plan status management
    - Implement status validation (prevent payments for inactive plans)
    - Implement status transitions
    - Implement cascade status change from contracts
    - _Requirements: 2.12, 1.9_
  
  - [ ]* 3.4 Write property test for Payment Plan date calculations
    - **Property 6: Payment Plan Frequency Calculation (monthly)**
    - **Property 7: Payment Plan Quarterly Calculation**
    - **Property 8: Payment Plan Annual Calculation**
    - **Property 9: Payment Plan One-Time Calculation**
    - **Property 10: Payment Plan Recalculation on Update**
    - **Validates: Requirements 2.4-2.10**

- [ ] 4. Create Payment Plan Controller
  - [ ] 4.1 Create `src/api/contracts/payment-plan.controller.ts` following Sinergy ERP controller pattern
    - Implement POST /tenant/payment-plans with @RequirePermissions('payment_plans', 'Create')
    - Implement GET /tenant/payment-plans with @RequirePermissions('payment_plans', 'Read')
    - Implement GET /tenant/payment-plans/:id with @RequirePermissions('payment_plans', 'Read')
    - Implement PUT /tenant/payment-plans/:id with @RequirePermissions('payment_plans', 'Update')
    - Implement DELETE /tenant/payment-plans/:id with @RequirePermissions('payment_plans', 'Delete')
    - Add Swagger documentation for all endpoints
    - _Requirements: 9.6-9.10, 5.5-5.8_
  
  - [ ]* 4.2 Write property test for API endpoint availability
    - **Property 30: API Endpoint Availability**
    - **Validates: Requirements 9.6-9.10**

- [ ] 5. Update Contract Service to support Payment Plans
  - [ ] 5.1 Extend ContractService with Payment Plan cascade operations
    - Implement cascade status change to payment plans when contract status changes to "cancelado"
    - Implement cascade delete to payment plans when contract is deleted
    - Implement validation to prevent contract deletion if payment plans exist
    - _Requirements: 1.8, 1.9, 8.8_
  
  - [ ]* 5.2 Write property test for Contract cascade operations
    - **Property 3: Contract Status Cascade**
    - **Property 4: Contract Deletion Prevention**
    - **Validates: Requirements 1.8, 1.9**

- [ ] 6. Update Payment Service to support Payment Plans
  - [ ] 6.1 Extend PaymentService to work with Payment Plans
    - Update createPayment to validate payment_plan_id instead of contract_id
    - Implement payment plan status validation (prevent payments for inactive plans)
    - Implement next_payment_date update when payment is completed
    - Implement plan auto-completion when all payments are completed
    - _Requirements: 3.1-3.10, 2.12_
  
  - [ ] 6.2 Update Payment entity to reference payment_plan_id
    - Add payment_plan_id foreign key to Payment entity
    - Keep contract_id for backward compatibility (can be derived from payment_plan)
    - _Requirements: 3.1-3.2_
  
  - [ ]* 6.3 Write property test for Payment completion and plan updates
    - **Property 17: Payment Completion Updates Next Date**
    - **Property 18: Payment Plan Auto-Completion**
    - **Validates: Requirements 3.9, 3.10**

- [ ] 7. Implement RBAC permissions for Payment Plans
  - [ ] 7.1 Add Payment Plan permissions to RBAC system
    - Create permissions: payment_plans:Create, payment_plans:Read, payment_plans:Update, payment_plans:Delete
    - Assign permissions to appropriate roles (admin, finance, etc.)
    - _Requirements: 5.5-5.8_
  
  - [ ]* 7.2 Write property test for RBAC enforcement
    - **Property 21: RBAC Permission Enforcement**
    - **Validates: Requirements 5.5-5.8**

- [ ] 8. Implement Payment Plan statistics
  - [ ] 8.1 Extend StatisticsService with Payment Plan metrics
    - Implement getPaymentPlanStatistics method
    - Calculate total pending payments amount across active plans
    - Calculate payment plan counts grouped by frequency
    - Calculate payment plan counts grouped by status
    - _Requirements: 6.9-6.10_
  
  - [ ] 8.2 Create statistics endpoint
    - Implement GET /tenant/payment-plans/statistics
    - Add Swagger documentation
    - _Requirements: 9.16-9.18_
  
  - [ ]* 8.3 Write property test for statistics accuracy
    - **Property 24: Payment Plan Statistics Accuracy**
    - **Validates: Requirements 6.9-6.10**

- [ ] 9. Implement multi-tenant filtering for Payment Plans
  - [ ] 9.1 Ensure Payment Plan queries include tenant_id filtering
    - Verify all repository queries filter by tenant_id
    - Verify all service methods pass tenant_id to repository
    - Verify all controller methods extract tenant_id from request context
    - _Requirements: 4.1-4.8_
  
  - [ ]* 9.2 Write property test for multi-tenant isolation
    - **Property 11: Payment Plan Tenant Isolation**
    - **Property 12: Payment Plan Status Lock**
    - **Property 19: Multi-Tenant Access Control**
    - **Property 20: Mandatory Tenant ID**
    - **Validates: Requirements 4.1-4.8**

- [ ] 10. Implement validation and error handling
  - [ ] 10.1 Create validation pipes for Payment Plan DTOs
    - Validate frequency enum values (monthly, quarterly, annual, one_time)
    - Validate amount_per_period > 0
    - Validate start_date not in future
    - Validate end_date >= start_date (if provided)
    - Validate contract_id exists and belongs to same tenant
    - _Requirements: 7.4-7.6_
  
  - [ ] 10.2 Create exception filters for Payment Plan errors
    - Handle validation errors (400 Bad Request)
    - Handle referential integrity errors (422 Unprocessable Entity)
    - Handle business logic errors (409 Conflict)
    - Handle authorization errors (403 Forbidden)
    - Handle not found errors (404 Not Found)
    - _Requirements: Error Handling section_
  
  - [ ]* 10.3 Write property test for referential integrity
    - **Property 26: Payment Plan Referential Integrity**
    - **Validates: Requirements 8.4-8.5**

- [ ] 11. Implement cascade operations
  - [ ] 11.1 Implement Payment Plan cascade operations
    - When payment plan is deleted, cascade delete all payments
    - When contract is deleted, cascade delete all payment plans and payments
    - When contract status changes to "cancelado", cascade status to payment plans
    - _Requirements: 1.9, 8.8, 8.9_
  
  - [ ]* 11.2 Write property test for cascade operations
    - **Property 28: Cascade Delete Contracts**
    - **Property 29: Cascade Delete Payment Plans**
    - **Validates: Requirements 8.8, 8.9**

- [ ] 12. Checkpoint - Ensure all core functionality tests pass
  - Run all unit tests for Payment Plan entity, service, and controller
  - Verify all CRUD operations work correctly
  - Verify all validations are enforced
  - Verify all cascade operations work
  - Verify RBAC permissions are enforced
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Write comprehensive property-based tests
  - [ ] 13.1 Create property test suite for payment plans
    - Test all 7 payment plan-related properties
    - Configure minimum 100 iterations per test
    - Tag each test with property number
    - Use fast-check for TypeScript/JavaScript
    - _Requirements: Properties 6-12_
  
  - [ ] 13.2 Create property test suite for multi-tenant and RBAC
    - Test all 7 multi-tenant and RBAC properties
    - Configure minimum 100 iterations per test
    - Tag each test with property number
    - _Requirements: Properties 19-21_
  
  - [ ] 13.3 Create property test suite for statistics
    - Test payment plan statistics properties
    - Configure minimum 100 iterations per test
    - Tag each test with property number
    - _Requirements: Property 24_
  
  - [ ] 13.4 Create property test suite for referential integrity and cascades
    - Test all referential integrity and cascade properties
    - Configure minimum 100 iterations per test
    - Tag each test with property number
    - _Requirements: Properties 26, 28, 29_

- [ ] 14. Write unit tests for edge cases and error conditions
  - [ ] 14.1 Write unit tests for Payment Plan edge cases
    - Test payment plan creation with each frequency type
    - Test payment plan date calculations for edge dates (month boundaries, leap years)
    - Test payment plan status transitions
    - Test payment plan updates with recalculation
    - _Requirements: 2.5-2.8, 2.10_
  
  - [ ] 14.2 Write unit tests for Payment Plan error conditions
    - Test payment plan creation with invalid frequency
    - Test payment plan creation with amount <= 0
    - Test payment plan creation with start_date in future
    - Test payment plan creation with end_date < start_date
    - Test payment plan creation with non-existent contract_id
    - Test payment plan creation with contract from different tenant
    - _Requirements: 7.4-7.6, 8.4-8.5_
  
  - [ ] 14.3 Write unit tests for cascade operations
    - Test contract deletion with payment plans
    - Test contract status change cascade
    - Test payment plan deletion cascade to payments
    - _Requirements: 1.8, 1.9, 8.8, 8.9_

- [ ] 15. Integration testing
  - [ ] 15.1 Create integration tests for payment plan workflows
    - Test complete payment plan lifecycle (create → update → complete → delete)
    - Test payment plan with multiple payments workflow
    - Test cascade operations end-to-end
    - _Requirements: 2.1-2.12, 8.8, 8.9_
  
  - [ ] 15.2 Create integration tests for multi-tenant scenarios
    - Test data isolation between tenants
    - Test access control across tenants
    - Test statistics isolation
    - _Requirements: 4.1-4.8_
  
  - [ ] 15.3 Create integration tests for RBAC scenarios
    - Test permission enforcement for all operations
    - Test permission denial scenarios
    - _Requirements: 5.5-5.8_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests (minimum 100 iterations each)
  - Run all integration tests
  - Verify code coverage >= 80%
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Update module registration
  - [ ] 17.1 Update `src/api/contracts/contracts.module.ts`
    - Import PaymentPlan entity in TypeOrmModule.forFeature
    - Add PaymentPlanService to providers
    - Add PaymentPlanController to controllers
    - Export PaymentPlanService for other modules
    - _Requirements: Module structure_
  
  - [ ] 17.2 Update `src/app.module.ts` if needed
    - Verify ContractsModule is imported
    - Verify all entities are registered with TypeORM

- [ ] 18. Documentation and API specification
  - [ ] 18.1 Create API documentation for Payment Plans
    - Document all endpoints with request/response examples
    - Document all error responses
    - Document all query parameters and filters
    - Document frequency calculation logic
    - _Requirements: 9.6-9.10_
  
  - [ ] 18.2 Create developer guide
    - Document Payment Plan service architecture
    - Document RBAC permission requirements
    - Document multi-tenant filtering approach
    - Document cascade operation behavior
    - Document date calculation logic for each frequency

- [ ] 19. Database migration and deployment
  - [ ] 19.1 Run database migration
    - Execute migration to create payment_plans table
    - Verify table structure and indexes
    - Verify foreign key constraints
    - _Requirements: Database schema_
  
  - [ ] 19.2 Verify backward compatibility
    - Ensure existing contracts and payments still work
    - Ensure existing API endpoints still work
    - Ensure no breaking changes to existing code

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of functionality
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- All code must follow Sinergy ERP module standard patterns and conventions
- Multi-tenant filtering must be applied at repository layer
- RBAC enforcement must be applied at controller layer
- All timestamps (created_at, updated_at) are managed by TypeORM decorators
- Follow existing Sinergy ERP naming conventions (kebab-case for files, PascalCase for classes)
- Use existing RBAC infrastructure and permission system
- Integrate with existing Contract and Payment entities and services
- Maintain backward compatibility with existing contract and payment functionality

