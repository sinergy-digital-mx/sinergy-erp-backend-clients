# Implementation Plan: Fix Payment Dates and Regenerate Schedule

## Overview

This implementation regenerates all contract payments with correct payment dates (always 5th of each month) while preserving the paid history. The system follows a multi-phase architecture: analysis (count paid payments), regeneration (delete and recreate with correct dates), verification (validate results), and reporting (summarize changes).

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create `src/modules/payment-regeneration/` directory structure
  - Define TypeScript interfaces for all data models (Contract, Payment, RegenerationResult, VerificationResult)
  - Set up database connection and transaction handling
  - Create logger service for tracking changes
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 2. Implement PaymentAnalyzer component
  - [ ] 2.1 Create PaymentAnalyzer service
    - Implement `countPaidPayments(contractId)` to query payments with status = "pagado"
    - Implement `getAllContracts()` to fetch all contracts from database
    - Implement `storeAnalysis(contractId, paidCount)` to store analysis results in memory
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write property test for payment counting
    - **Property 1: Paid Payment Count Preservation**
    - **Validates: Requirements 1.2, 3.1**

- [ ] 3. Implement PaymentGenerator component
  - [ ] 3.1 Create PaymentGenerator service
    - Implement `calculatePaymentDate(contractDate, paymentNumber)` to calculate 5th of each month
    - Implement `generatePayments()` to create payment objects with correct dates and amounts
    - Ensure payment_number is sequential (1, 2, 3, ...)
    - Set amount = monthly_payment for all payments
    - _Requirements: 2.2, 2.3, 2.5, 2.6_

  - [ ]* 3.2 Write property test for payment date calculation
    - **Property 2: Payment Date Calculation**
    - **Validates: Requirements 2.3**

  - [ ]* 3.3 Write property test for payment numbering
    - **Property 5: Payment Numbering Sequence**
    - **Validates: Requirements 2.5**

  - [ ]* 3.4 Write property test for payment amount consistency
    - **Property 4: Payment Amount Consistency**
    - **Validates: Requirements 2.6**

- [ ] 4. Implement BalanceCalculator component
  - [ ] 4.1 Create BalanceCalculator service
    - Implement `calculateRemainingBalance()` formula: (total_price - down_payment) - (paid_count × monthly_payment)
    - Implement balance clamping to minimum 0
    - Implement `updateContractBalance(contractId, balance)` to persist balance to database
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Write property test for balance calculation
    - **Property 8: Balance Calculation Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 5. Implement PaymentRegenerator orchestrator
  - [ ] 5.1 Create PaymentRegenerator service
    - Implement `regenerateContract(contractId, dryRun)` with transaction handling
    - Delete all existing payments for contract
    - Generate new payments with correct dates using PaymentGenerator
    - Mark first N payments as "pagado" based on analysis
    - Update contract balance using BalanceCalculator
    - Implement rollback on error
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 5.1, 5.2_

  - [ ]* 5.2 Write property test for paid payment invariants
    - **Property 6: Paid Payment Invariants**
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 5.3 Write property test for pending payment invariants
    - **Property 7: Pending Payment Invariants**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 5.4 Write property test for payment deletion completeness
    - **Property 12: Payment Deletion Completeness**
    - **Validates: Requirements 2.1**

  - [ ] 5.5 Implement `regenerateAll(dryRun)` method
    - Run PaymentAnalyzer to count paid payments for all contracts
    - Process each contract in transaction
    - Collect results and errors
    - Return RegenerationSummary with statistics
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implement PaymentVerifier component
  - [ ] 6.1 Create PaymentVerifier service
    - Implement `verifyContract(contractId)` to check all verification criteria
    - Verify payment count matches payment_months
    - Verify first N payments have status "pagado", rest have "pendiente"
    - Verify all payment_dates are on 5th of month
    - Verify balance calculation is correct
    - _Requirements: 6.1_

  - [ ]* 6.2 Write property test for payment count invariant
    - **Property 3: Payment Count Invariant**
    - **Validates: Requirements 2.2, 6.1**

  - [ ]* 6.3 Write property test for payment date day invariant
    - **Property 9: Payment Date Day Invariant**
    - **Validates: Requirements 2.3, 6.3**

  - [ ] 6.4 Implement `verifyAll()` method
    - Run verification on all contracts
    - Collect verification results
    - Return VerificationSummary with failures
    - _Requirements: 6.1_

- [ ] 7. Implement ReportGenerator component
  - [ ] 7.1 Create ReportGenerator service
    - Generate summary report with total contracts, successful, failed counts
    - Log all changes (contract_id, old_paid_count, new_paid_count, payment_dates)
    - Format verification failures for reporting
    - Export report to console and file
    - _Requirements: 5.3, 5.4, 6.1_

- [ ] 8. Create main regeneration script
  - [ ] 8.1 Create `regenerate-payments.ts` script
    - Parse command-line arguments (--dry-run, --contract-id)
    - Initialize database connection
    - Call PaymentAnalyzer to count paid payments
    - Call PaymentRegenerator to regenerate all contracts
    - Call PaymentVerifier to verify results
    - Call ReportGenerator to output summary
    - Handle errors and exit codes
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 6.1_

  - [ ]* 8.2 Write property test for dry-run non-destructiveness
    - **Property 10: Dry-Run Non-Destructiveness**
    - **Validates: Requirements 5.5**

  - [ ]* 8.3 Write property test for transaction isolation
    - **Property 11: Transaction Isolation**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no compilation errors
  - Ensure all properties pass with 100+ iterations
  - Ask the user if questions arise

- [ ] 10. Create integration tests
  - [ ] 10.1 Write integration test for complete regeneration flow
    - Create test contracts with various payment states
    - Run full regeneration pipeline
    - Verify all components work together
    - Verify database state after regeneration
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

  - [ ]* 10.2 Write integration test for error handling and rollback
    - Test contract with invalid data
    - Test database connection failure
    - Verify rollback on error
    - Verify other contracts continue processing
    - _Requirements: 5.1, 5.2_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Run complete test suite including integration tests
  - Verify all properties pass
  - Verify script runs without errors
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across generated inputs
- Unit tests validate specific examples and edge cases
- All components use TypeScript with strict type checking
- Database transactions ensure data consistency and enable rollback on errors
- Dry-run mode allows previewing changes before applying to production
