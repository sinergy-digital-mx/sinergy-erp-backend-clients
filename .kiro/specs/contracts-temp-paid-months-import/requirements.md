# Requirements Document: Fix Payment Dates and Regenerate Schedule

## Introduction

This feature fixes incorrect payment dates across all contracts and regenerates the payment schedule with correct dates. The system counts how many payments are currently marked as "pagado" for each contract, then regenerates all payments with correct payment_date values (always the 5th of each month starting from contract_date month), while preserving the paid count by marking the first N payments as "pagado".

## Glossary

- **Contract**: A sales agreement with contract_date as the start date
- **Payment**: Monthly installment record with payment_date (should always be 5th of month)
- **payment_date**: The date the payment is due (MUST be 5th of each month, starting from contract_date month)
- **payment_due_day**: Always 5 (the 5th of each month)
- **Paid Count**: Number of payments currently marked as "pagado" for a contract
- **Regenerate**: Delete all payments and recreate with correct dates, preserving paid count

## Requirements

### Requirement 1: Count Paid Payments Per Contract (CORE)

**User Story:** As a system administrator, I want to count how many payments are currently marked as "pagado" for each contract, so I can preserve this count during regeneration.

#### Acceptance Criteria

1. WHEN the script runs, THE System SHALL query all contracts
2. FOR each contract, THE System SHALL count payments with status = "pagado"
3. THE System SHALL store this count for use in regeneration
4. THE System SHALL log contracts with 0 paid payments and contracts with all payments paid

### Requirement 2: Regenerate All Payments with Correct Dates

**User Story:** As a system administrator, I want to regenerate all payments with correct payment_date values, so the schedule reflects the proper monthly structure.

#### Acceptance Criteria

1. WHEN regeneration runs for a contract, THE System SHALL delete ALL existing payments
2. THE System SHALL generate payment_months number of new payments
3. FOR each payment, THE System SHALL calculate payment_date as: 5th day of (contract_date month + payment_number - 1)
4. EXAMPLE: If contract_date = 01/01/2026, then:
   - Payment 1: payment_date = 05/01/2026
   - Payment 2: payment_date = 05/02/2026
   - Payment 3: payment_date = 05/03/2026
5. THE System SHALL set payment_number sequentially (1, 2, 3, ...)
6. THE System SHALL set amount = monthly_payment for all payments
7. THE System SHALL NOT use first_payment_date field

### Requirement 3: Mark First N Payments as Paid

**User Story:** As a system administrator, I want to mark the first N payments as "pagado" based on the count from before regeneration, so the paid history is preserved.

#### Acceptance Criteria

1. WHEN regenerating payments, THE System SHALL mark the first N payments as "pagado" (where N = paid count from Requirement 1)
2. FOR each paid payment, THE System SHALL set:
   - status = "pagado"
   - amount_paid = monthly_payment
   - amount_pending = 0
   - paid_date = payment_date (the 5th of that month)
3. FOR each remaining payment, THE System SHALL set:
   - status = "pendiente"
   - amount_paid = 0
   - amount_pending = monthly_payment
   - paid_date = NULL
4. THE System SHALL set due_date = payment_date for all payments

### Requirement 4: Update Contract Balance

**User Story:** As a financial analyst, I want the contract balance to be automatically updated after regeneration.

#### Acceptance Criteria

1. WHEN regeneration completes, THE System SHALL calculate: total_paid = paid_count × monthly_payment
2. THE System SHALL calculate: remaining_balance = (total_price - down_payment) - total_paid
3. THE System SHALL update contract.remaining_balance with this value
4. IF remaining_balance < 0, THE System SHALL set it to 0

### Requirement 5: Process All Contracts in Production Safely

**User Story:** As a system administrator, I want to regenerate all contracts safely without data loss.

#### Acceptance Criteria

1. WHEN the script runs, THE System SHALL process each contract in a transaction
2. IF a contract fails, THE System SHALL rollback that contract and continue with others
3. THE System SHALL log all changes (contract_id, old_paid_count, new_paid_count, payment_dates)
4. THE System SHALL generate a summary report showing:
   - Total contracts processed
   - Total payments regenerated
   - Contracts with errors
5. THE System SHALL allow dry-run mode to preview changes before applying

### Requirement 6: Verify Regeneration Results

**User Story:** As a system administrator, I want to verify the regeneration was successful.

#### Acceptance Criteria

1. WHEN regeneration completes, THE System SHALL verify:
   - Each contract has exactly payment_months payments
   - First N payments have status = "pagado"
   - Remaining payments have status = "pendiente"
   - All payment_dates are on the 5th of their respective months
   - remaining_balance is correctly calculated
2. THE System SHALL report any verification failures

