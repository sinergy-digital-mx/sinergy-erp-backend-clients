# Implementation Plan: Purchase Order Receipt Process

## Overview

This implementation plan breaks down the Purchase Order Receipt feature into discrete, sequential coding tasks. Each task builds on previous steps, starting with DTOs and data models, then implementing specialized services, the main orchestrator, the HTTP controller, comprehensive tests, and finally integration into the module.

The implementation follows a layered architecture:
1. **Data Transfer Objects (DTOs)** - Define input/output contracts
2. **Specialized Services** - Implement individual business logic components
3. **Main Orchestrator** - Coordinate all services within a transaction
4. **HTTP Controller** - Expose the receipt endpoint
5. **Tests** - Validate correctness with unit and property-based tests
6. **Integration** - Register services and verify end-to-end functionality

---

## Tasks

### Phase 1: Preparation and DTOs

- [x] 1. Create DTOs for receipt input and output
  - Create `ReceivePurchaseOrderDto` with array of `ReceivedItemDto`
  - Create `ReceivedItemDto` with fields: line_item_id, product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit, expiration_date (optional)
  - Create response DTOs that extend existing `PurchaseOrderBatch` entity
  - Add validation decorators (IsNotEmpty, IsNumber, Min, Max, etc.)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1_

- [x] 2. Create database migration for receipt-related fields
  - Add received_* fields to `inv_s_purchase_order_batch` table (received_subtotal, received_iva_total, received_ieps_total, received_total)
  - Add received_original_* and received_converted_* fields to `inv_s_purchase_order_batch_detail` table
  - Ensure all fields are nullable and have appropriate default values
  - _Requirements: 3.1, 5.1, 7.1, 7.9_

---

### Phase 2: Specialized Services

- [x] 3. Implement Receipt Validator Service
  - Create `ReceiptValidatorService` class
  - Implement validation: at least one item with quantity > 0
  - Implement validation: all quantities are non-negative
  - Implement validation: quantities do not exceed 999,999.999
  - Implement validation: all line items exist in the database
  - Return validation errors with specific line item references
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.1 Write property tests for Receipt Validator
    - **Property 1: At Least One Item Must Be Received**
    - **Property 2: Quantities Must Be Non-Negative**
    - **Property 3: Quantities Must Not Exceed Limits**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. Implement Unit Conversion Service
  - Create `UnitConversionService` class
  - Implement method to retrieve product base unit of measurement
  - Implement method to convert quantity from received UOM to base UOM
  - Handle unsupported conversions with descriptive error
  - Use existing unit conversion logic or create conversion factor lookup
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.1 Write property tests for Unit Conversion
    - **Property 9: Quantity Conversion to Base Unit**
    - **Property 25: Unit Conversion Error Handling**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 5. Implement Batch Number Generator Service
  - Create `BatchNumberGeneratorService` class
  - Implement method to retrieve warehouse prefix from warehouse record
  - Implement method to get next sequential number for warehouse + tenant
  - Implement batch number formatting: {prefix}-LOTE-{6_digit_sequential}
  - Verify uniqueness in `inv_s_batches` table before returning
  - Handle concurrent batch creation with database-level locking
  - _Requirements: 3.2, 3.4, 3.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 5.1 Write property tests for Batch Number Generator
    - **Property 5: Batch Number Format Compliance**
    - **Property 6: Batch Number Uniqueness Within Tenant**
    - **Property 24: Batch Number Sequential Increment**
    - **Validates: Requirements 3.2, 3.4, 3.5, 12.1, 12.2, 12.3, 12.4, 12.5**

- [x] 6. Implement Total Calculator Service
  - Create `TotalCalculatorService` class
  - Implement method to calculate received_subtotal: Σ(quantity × unit_total)
  - Implement method to calculate received_iva_total: Σ(iva_unit × quantity)
  - Implement method to calculate received_ieps_total: Σ(ieps_unit × quantity)
  - Implement method to calculate received_total: subtotal + iva + ieps
  - Handle decimal precision (2 decimal places for currency)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.1 Write property tests for Total Calculator
    - **Property 14: Received Subtotal Calculation**
    - **Property 15: Received IVA Calculation**
    - **Property 16: Received IEPS Calculation**
    - **Property 17: Received Total Calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 7. Implement Line Item Updater Service
  - Create `LineItemUpdaterService` class
  - Implement method to store received_original_* fields (product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit)
  - Implement method to store received_converted_* fields (quantity in base unit, base uom_id)
  - Implement method to update audit fields (updated_by, updated_at)
  - Persist changes to `inv_s_purchase_order_batch_detail` table
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_

  - [ ]* 7.1 Write property tests for Line Item Updater
    - **Property 18: Line Item Original Data Preserved**
    - **Property 19: Line Item Converted Data Stored**
    - **Property 20: Line Item Audit Fields Updated**
    - **Validates: Requirements 7.1 through 7.12**

- [x] 8. Implement Batch Creator Service
  - Create `BatchCreatorService` class
  - Implement method to create inventory batch record for each received item
  - Set batch_number using BatchNumberGeneratorService
  - Set warehouse_id from purchase order
  - Set product_id from received item
  - Set uom_id to base unit (using UnitConversionService)
  - Set quantity to converted quantity (using UnitConversionService)
  - Set purchase_order_batch_id and purchase_order_detail_id references
  - Set created_by to current user ID
  - Set created_at to current timestamp
  - Set tenant_id from purchase order
  - Persist to `inv_s_batches` table
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 11.3_

  - [ ]* 8.1 Write property tests for Batch Creator
    - **Property 4: Batch Created for Each Received Item**
    - **Property 7: Batch References Correct Warehouse**
    - **Property 8: Batch References Correct Product**
    - **Property 10: Batch References Correct PO and Line Item**
    - **Property 11: Batch Audit Fields Set Correctly**
    - **Validates: Requirements 3.1 through 3.13, 11.3**

- [x] 9. Implement PO Status Updater Service
  - Create `POStatusUpdaterService` class
  - Implement method to update general_status to "Recibida"
  - Implement method to update audit fields (updated_by, updated_at)
  - Persist changes to `inv_s_purchase_order_batch` table
  - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 9.1 Write property tests for PO Status Updater
    - **Property 12: PO Status Updated to Recibida**
    - **Property 13: PO Audit Fields Updated**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 10. Implement Tenant Validator Service
  - Create `TenantValidatorService` class
  - Implement method to verify purchase order belongs to specified tenant
  - Return NotFoundException if PO belongs to different tenant
  - Implement method to verify batch number uniqueness within tenant
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 10.1 Write property tests for Tenant Validator
    - **Property 23: Tenant Isolation**
    - **Property 27: Cross-Tenant Access Prevention**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

---

### Phase 3: Main Orchestrator Service

- [x] 11. Implement Receipt Service (Main Orchestrator)
  - Create `ReceiptService` class with all specialized service dependencies
  - Implement main `receive()` method that orchestrates the entire process
  - Start database transaction at beginning
  - Call ReceiptValidatorService to validate input
  - Call LineItemUpdaterService to update all line items with received data
  - Call BatchCreatorService to create inventory batches for each received item
  - Call TotalCalculatorService to calculate received totals
  - Call POStatusUpdaterService to update PO status to "Recibida"
  - Commit transaction on success
  - Rollback transaction on any error
  - Return updated purchase order with all received data
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 11.1 Write property tests for Receipt Service orchestration
    - **Property 21: Transaction Atomicity**
    - **Property 22: Response Contains Updated PO**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4**

- [x] 12. Implement error handling in Receipt Service
  - Catch NotFoundException for missing line items and re-throw with context
  - Catch NotFoundException for missing purchase order and re-throw with context
  - Catch BadRequestException for validation errors and re-throw with context
  - Catch database errors and rollback transaction
  - Log all errors with context (user ID, PO ID, tenant ID, error details)
  - Return appropriate HTTP status codes and error messages
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 12.1 Write property tests for error handling
    - **Property 26: Line Item Not Found Error**
    - **Property 28: Error Logging**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

---

### Phase 4: HTTP Controller

- [x] 13. Implement Receipt Controller
  - Create `ReceiptController` class
  - Implement POST endpoint: `/purchase-orders/:id/receipt`
  - Extract tenant ID from request context
  - Extract user ID from authenticated request
  - Call ReceiptService.receive() with DTO, tenant ID, and user ID
  - Return updated purchase order in response
  - Apply JwtAuthGuard and TenantModuleValidationGuard
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 13.1 Write integration tests for Receipt Controller
    - Test successful receipt with valid data
    - Test validation error responses
    - Test NotFoundException for missing PO
    - Test cross-tenant access prevention
    - _Requirements: 1.1 through 1.5, 9.1 through 9.4, 10.1, 10.2, 10.3, 11.2_

---

### Phase 5: Comprehensive Testing

- [x] 14. Write unit tests for Receipt Validator Service
  - Test rejection when all quantities are zero
  - Test rejection when any quantity is negative
  - Test rejection when quantity exceeds 999,999.999
  - Test rejection when line item does not exist
  - Test acceptance when at least one item has quantity > 0
  - Test error messages contain specific line item references
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 15. Write unit tests for Unit Conversion Service
  - Test successful conversion from received UOM to base UOM
  - Test base unit retrieval for various products
  - Test error handling for unsupported conversions
  - Test conversion with various quantity values
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Write unit tests for Batch Number Generator Service
  - Test batch number format compliance
  - Test sequential number increment
  - Test uniqueness within tenant
  - Test warehouse prefix retrieval
  - Test zero-padding of sequential number to 6 digits
  - _Requirements: 3.2, 3.4, 3.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17. Write unit tests for Total Calculator Service
  - Test subtotal calculation with various quantities and prices
  - Test IVA calculation with different percentages
  - Test IEPS calculation with different percentages
  - Test total calculation (subtotal + IVA + IEPS)
  - Test decimal precision (2 decimal places)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 18. Write unit tests for Line Item Updater Service
  - Test storage of all received_original_* fields
  - Test storage of received_converted_* fields
  - Test audit field updates (updated_by, updated_at)
  - Test persistence to database
  - _Requirements: 7.1 through 7.12_

- [x] 19. Write unit tests for Batch Creator Service
  - Test batch creation for each received item
  - Test batch references (warehouse, product, PO, line item)
  - Test batch audit fields (created_by, created_at)
  - Test tenant_id assignment
  - Test persistence to database
  - _Requirements: 3.1 through 3.13, 11.3_

- [x] 20. Write unit tests for PO Status Updater Service
  - Test status update to "Recibida"
  - Test audit field updates (updated_by, updated_at)
  - Test persistence to database
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 21. Write unit tests for Tenant Validator Service
  - Test tenant validation passes for correct tenant
  - Test NotFoundException for cross-tenant access
  - Test batch number uniqueness verification within tenant
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 22. Write unit tests for Receipt Service error handling
  - Test NotFoundException for missing line items
  - Test NotFoundException for missing purchase order
  - Test BadRequestException for validation errors
  - Test transaction rollback on error
  - Test error logging with context
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 23. Write integration tests for Receipt Service
  - Test complete receipt flow with valid data
  - Test transaction atomicity (all succeed or all fail)
  - Test response includes updated PO with all received data
  - Test response includes updated line items with received data
  - Test response includes status "Recibida"
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

- [x] 24. Checkpoint - Ensure all unit and integration tests pass
  - Run all test suites for services and controller
  - Verify code coverage is above 80%
  - Ensure all property-based tests pass with minimum 100 iterations
  - Ask the user if questions arise.

---

### Phase 6: Integration and Wiring

- [x] 25. Register all services in Purchase Orders Module
  - Add ReceiptService to module providers
  - Add ReceiptValidatorService to module providers
  - Add UnitConversionService to module providers
  - Add BatchNumberGeneratorService to module providers
  - Add TotalCalculatorService to module providers
  - Add LineItemUpdaterService to module providers
  - Add BatchCreatorService to module providers
  - Add POStatusUpdaterService to module providers
  - Add TenantValidatorService to module providers
  - Ensure all dependencies are properly injected
  - _Requirements: All_

- [x] 26. Register Receipt Controller in Purchase Orders Module
  - Add ReceiptController to module controllers
  - Ensure controller is exported if needed by other modules
  - Verify routing is correctly configured
  - _Requirements: 1.1 through 1.5_

- [x] 27. Verify database migrations are applied
  - Run pending migrations to add receipt-related fields
  - Verify all new columns exist in `inv_s_purchase_order_batch` table
  - Verify all new columns exist in `inv_s_purchase_order_batch_detail` table
  - Verify database indexes are created for performance
  - _Requirements: 3.1, 5.1, 7.1, 7.9_

- [x] 28. Write end-to-end integration test
  - Create a complete test scenario: create PO → add line items → receive products
  - Verify all batches are created with correct data
  - Verify PO status is updated to "Recibida"
  - Verify received totals are calculated correctly
  - Verify line items have received data stored
  - Verify response includes all updated data
  - _Requirements: All_

- [x] 29. Final checkpoint - Ensure all tests pass and feature is complete
  - Run complete test suite (unit, integration, end-to-end)
  - Verify all property-based tests pass
  - Verify code coverage is above 80%
  - Verify no console errors or warnings
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are strongly recommended for production quality
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties across all valid inputs
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and early error detection
- All services follow dependency injection pattern for testability
- Transaction management is critical for data consistency
- Tenant isolation must be enforced at every layer
