# Implementation Plan: Contract HOA Payments

## Overview

This implementation plan covers the development of the HOA (Homeowners Association) payments system for contracts. The system will allow automatic generation of monthly HOA payments, recording of payments (full and partial), and complete lifecycle management of HOA payments. The implementation follows NestJS architecture patterns and integrates with the existing contracts module.

## Tasks

- [ ] 1. Create database migration for contract_hoa_payments table
  - Create TypeORM migration file with table schema
  - Define all columns with appropriate types and constraints
  - Add foreign keys to rbac_tenants and contracts tables
  - Create indexes on tenant_id, contract_id, due_date, and status
  - _Requirements: 11.1-11.11, 12.1-12.4_

- [ ] 2. Create ContractHoaPayment entity
  - [ ] 2.1 Define entity class with TypeORM decorators
    - Create entity file at src/entities/contracts/contract-hoa-payment.entity.ts
    - Define all entity properties with appropriate decorators
    - Configure enum for status field (pagado, pendiente, parcial, cancelado)
    - Set up relationships with RBACTenant and Contract entities
    - _Requirements: 11.1-11.11_

- [ ] 3. Create DTOs for HOA payments
  - [ ] 3.1 Create GenerateHoaPaymentsDto
    - Define validation rules for start_date, end_date, and monthly_amount
    - Ensure monthly_amount is greater than 0
    - _Requirements: 14.1-14.3_
  
  - [ ] 3.2 Create RecordHoaPaymentDto
    - Define validation rules for amount, payment_date, payment_method
    - Add optional fields for reference_number and notes
    - Ensure amount is greater than 0
    - _Requirements: 14.4-14.8_
  
  - [ ] 3.3 Create UpdateHoaPaymentDto
    - Define optional fields for amount_paid, due_date, paid_date, payment_method, notes
    - Add validation rules for each field
    - _Requirements: 5.1-5.7_
  
  - [ ] 3.4 Create HoaPaymentStatsDto
    - Define response structure for payment statistics
    - Include counts for each status and monetary totals
    - Include partial payment details structure
    - _Requirements: 4.1-4.6_

- [ ] 4. Implement HoaPaymentsService
  - [ ] 4.1 Implement generateHoaPayments method
    - Validate date range (end_date must be after start_date)
    - Check if payments already exist for the contract
    - Calculate number of months between dates
    - Generate one payment per month with sequential payment_number
    - Set due_date to 5th of each month
    - Initialize amount_paid to 0 and amount_pending to monthly_amount
    - Set initial status to "pendiente"
    - _Requirements: 1.1-1.7, 14.1-14.3_
  
  - [ ]* 4.2 Write unit tests for generateHoaPayments
    - Test successful generation of multiple payments
    - Test error when payments already exist
    - Test due_date is set to 5th of month
    - Test sequential payment numbering
    - Test invalid date range validation
    - _Requirements: 1.1-1.7_
  
  - [ ] 4.3 Implement recordHoaPayment method
    - Validate payment is not cancelled
    - Update amount_paid by adding the payment amount
    - Recalculate amount_pending
    - Update status to "pagado" if fully paid, "parcial" if partially paid
    - Validate only one partial payment exists per contract
    - Save payment_date and payment_method
    - Add payment note with details
    - _Requirements: 2.1-2.9, 10.1-10.4_
  
  - [ ]* 4.4 Write unit tests for recordHoaPayment
    - Test full payment updates status to "pagado"
    - Test partial payment updates status to "parcial"
    - Test error when payment is cancelled
    - Test error when second partial payment attempted
    - Test amount calculations are correct
    - _Requirements: 2.1-2.9, 10.1-10.4_
  
  - [ ] 4.5 Implement getContractHoaPayments method
    - Query all payments for a contract filtered by tenant_id
    - Order results by payment_number ascending
    - Return all payment details
    - _Requirements: 3.1-3.2_
  
  - [ ] 4.6 Implement getHoaPayment method
    - Query single payment by ID and tenant_id
    - Throw NotFoundException if not found
    - Return complete payment details
    - _Requirements: 3.3-3.4_
  
  - [ ] 4.7 Implement getHoaPaymentStats method
    - Calculate total payments count
    - Count payments by status (pagado, pendiente, parcial, vencido, cancelado)
    - Calculate total_paid from pagado and parcial payments
    - Calculate total_pending from pendiente and parcial payments
    - Calculate total_expected from all payments
    - Find and include partial payment details if exists
    - _Requirements: 4.1-4.6_
  
  - [ ]* 4.8 Write unit tests for query methods
    - Test getContractHoaPayments returns ordered list
    - Test getHoaPayment throws error when not found
    - Test getHoaPaymentStats calculates correctly
    - Test stats include partial payment details
    - _Requirements: 3.1-3.4, 4.1-4.6_
  
  - [ ] 4.9 Implement updateHoaPayment method
    - Validate payment is not cancelled
    - Update provided fields (amount_paid, due_date, paid_date, payment_method, notes)
    - Recalculate amount_pending and status if amount_paid changed
    - Add automatic update note with timestamp
    - _Requirements: 5.1-5.7_
  
  - [ ] 4.10 Implement cancelHoaPayment method
    - Check if payment is already cancelled
    - Update status to "cancelado"
    - Add cancellation note with timestamp
    - _Requirements: 6.1-6.3_
  
  - [ ] 4.11 Implement resetHoaPayment method
    - Validate payment is not cancelled
    - Reset amount_paid to 0
    - Reset amount_pending to original amount
    - Reset status to "pendiente"
    - Clear paid_date
    - Add reset note with timestamp and previous amount
    - _Requirements: 8.1-8.6_
  
  - [ ] 4.12 Implement deleteHoaPayment method
    - Validate payment exists and belongs to tenant
    - Delete payment from database
    - Throw NotFoundException if not found
    - _Requirements: 7.1-7.2_
  
  - [ ] 4.13 Implement markOverdueHoaPayments method
    - Query payments with due_date before current date
    - Filter only "pendiente" and "parcial" status payments
    - Update is_overdue to true for matching payments
    - Return count of updated payments
    - _Requirements: 9.1-9.4_
  
  - [ ]* 4.14 Write unit tests for lifecycle methods
    - Test updateHoaPayment recalculates correctly
    - Test cancelHoaPayment adds note
    - Test resetHoaPayment clears all payment data
    - Test deleteHoaPayment removes record
    - Test markOverdueHoaPayments only marks correct statuses
    - _Requirements: 5.1-5.7, 6.1-6.3, 7.1-7.2, 8.1-8.6, 9.1-9.4_

- [ ] 5. Checkpoint - Ensure service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement HoaPaymentsController
  - [ ] 6.1 Set up controller with base route and guards
    - Define controller with route prefix /tenant/contracts/:contractId/hoa-payments
    - Apply JWT authentication guard
    - Apply tenant validation guard
    - _Requirements: 13.1-13.10, 15.1_
  
  - [ ] 6.2 Implement POST /generate endpoint
    - Extract contractId from route params
    - Validate GenerateHoaPaymentsDto
    - Apply Contract:Create permission guard
    - Call service.generateHoaPayments
    - Return 201 Created with generated payments
    - _Requirements: 13.1, 15.2_
  
  - [ ] 6.3 Implement GET / endpoint
    - Extract contractId from route params
    - Apply Contract:Read permission guard
    - Call service.getContractHoaPayments
    - Return 200 OK with payments list
    - _Requirements: 13.2, 15.3_
  
  - [ ] 6.4 Implement GET /stats endpoint
    - Extract contractId from route params
    - Apply Contract:Read permission guard
    - Call service.getHoaPaymentStats
    - Return 200 OK with statistics
    - _Requirements: 13.3, 15.3_
  
  - [ ] 6.5 Implement GET /:paymentId endpoint
    - Extract contractId and paymentId from route params
    - Apply Contract:Read permission guard
    - Call service.getHoaPayment
    - Return 200 OK with payment details
    - _Requirements: 13.4, 15.3_
  
  - [ ] 6.6 Implement PUT /:paymentId endpoint
    - Extract contractId and paymentId from route params
    - Validate UpdateHoaPaymentDto
    - Apply Contract:Update permission guard
    - Call service.updateHoaPayment
    - Return 200 OK with updated payment
    - _Requirements: 13.5, 15.4_
  
  - [ ] 6.7 Implement POST /:paymentId/pay endpoint
    - Extract contractId and paymentId from route params
    - Validate RecordHoaPaymentDto
    - Apply Contract:Update permission guard
    - Call service.recordHoaPayment
    - Return 200 OK with updated payment
    - _Requirements: 13.6, 15.4_
  
  - [ ] 6.8 Implement POST /:paymentId/cancel endpoint
    - Extract contractId and paymentId from route params
    - Apply Contract:Update permission guard
    - Call service.cancelHoaPayment
    - Return 200 OK with cancelled payment
    - _Requirements: 13.7, 15.4_
  
  - [ ] 6.9 Implement POST /:paymentId/reset endpoint
    - Extract contractId and paymentId from route params
    - Apply Contract:Update permission guard
    - Call service.resetHoaPayment
    - Return 200 OK with reset payment
    - _Requirements: 13.8, 15.4_
  
  - [ ] 6.10 Implement DELETE /:paymentId endpoint
    - Extract contractId and paymentId from route params
    - Apply Contract:Delete permission guard
    - Call service.deleteHoaPayment
    - Return 204 No Content
    - _Requirements: 13.9, 15.5_
  
  - [ ] 6.11 Implement POST /mark-overdue endpoint
    - Extract contractId from route params
    - Apply Contract:Update permission guard
    - Call service.markOverdueHoaPayments
    - Return 200 OK with count of marked payments
    - _Requirements: 13.10, 15.4_

- [ ] 7. Create HoaPaymentsModule
  - [ ] 7.1 Define module with imports, providers, controllers, and exports
    - Import TypeOrmModule.forFeature with ContractHoaPayment and Contract entities
    - Import RBACModule for permission guards
    - Register HoaPaymentsService as provider
    - Register HoaPaymentsController
    - Export HoaPaymentsService for use in other modules
    - _Requirements: 13.1-13.10_

- [ ] 8. Integrate HoaPaymentsModule into ContractsModule
  - [ ] 8.1 Import HoaPaymentsModule in ContractsModule
    - Add HoaPaymentsModule to imports array in contracts.module.ts
    - Verify module loads correctly
    - _Requirements: 13.1-13.10_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Write integration tests for API endpoints
  - [ ]* 10.1 Write e2e test for POST /generate endpoint
    - Test successful generation with valid data
    - Test error when payments already exist
    - Test authentication and permission validation
    - _Requirements: 1.1-1.7, 15.1-15.2_
  
  - [ ]* 10.2 Write e2e test for payment recording flow
    - Test full payment recording
    - Test partial payment recording
    - Test error when second partial payment attempted
    - Test authentication and permission validation
    - _Requirements: 2.1-2.9, 10.1-10.4, 15.1, 15.4_
  
  - [ ]* 10.3 Write e2e test for query endpoints
    - Test GET / returns all payments
    - Test GET /stats returns correct statistics
    - Test GET /:paymentId returns single payment
    - Test 404 errors for non-existent payments
    - Test authentication and permission validation
    - _Requirements: 3.1-3.4, 4.1-4.6, 15.1, 15.3_
  
  - [ ]* 10.4 Write e2e test for lifecycle operations
    - Test update payment endpoint
    - Test cancel payment endpoint
    - Test reset payment endpoint
    - Test delete payment endpoint
    - Test mark overdue endpoint
    - Test authentication and permission validation
    - _Requirements: 5.1-5.7, 6.1-6.3, 7.1-7.2, 8.1-8.6, 9.1-9.4, 15.1, 15.4-15.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows NestJS best practices and TypeORM patterns
- All endpoints require JWT authentication and appropriate RBAC permissions
- The system maintains separation from regular contract payments while following similar patterns
- Database migration should be run before entity and service implementation
- Integration tests validate end-to-end flows including authentication and authorization
