# Design Document: Payment Regeneration and Schedule Fix

## Overview

This feature regenerates all payments across all contracts with correct payment dates. The system preserves the paid history by counting currently paid payments before deletion, then recreates the payment schedule with dates always on the 5th of each month starting from the contract's start date. The implementation includes transaction safety, dry-run capability, and comprehensive verification.

## Architecture

The payment regeneration system follows a multi-phase architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Regeneration Flow                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Phase 1: Analysis                                           │
│  ├─ Query all contracts                                      │
│  ├─ Count paid payments per contract                         │
│  └─ Store paid counts for later use                          │
│                                                               │
│  Phase 2: Regeneration (per contract, in transaction)        │
│  ├─ Delete all existing payments                             │
│  ├─ Generate new payments with correct dates                 │
│  ├─ Mark first N as "pagado"                                 │
│  └─ Update contract balance                                  │
│                                                               │
│  Phase 3: Verification                                       │
│  ├─ Verify payment count matches payment_months              │
│  ├─ Verify payment dates are on 5th of month                 │
│  ├─ Verify paid/pending status distribution                  │
│  └─ Verify balance calculation                               │
│                                                               │
│  Phase 4: Reporting                                          │
│  ├─ Generate summary report                                  │
│  ├─ Log all changes                                          │
│  └─ Report verification failures                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PaymentAnalyzer

Analyzes current payment state before regeneration.

```typescript
interface PaymentAnalyzer {
  // Count paid payments for a contract
  countPaidPayments(contractId: string): Promise<number>;
  
  // Get all contracts
  getAllContracts(): Promise<Contract[]>;
  
  // Store analysis results
  storeAnalysis(contractId: string, paidCount: number): Promise<void>;
}
```

### 2. PaymentGenerator

Generates new payments with correct dates.

```typescript
interface PaymentGenerator {
  // Generate payment date for a given payment number
  calculatePaymentDate(contractDate: Date, paymentNumber: number): Date;
  
  // Generate all payments for a contract
  generatePayments(
    contractId: string,
    contractDate: Date,
    paymentMonths: number,
    monthlyPayment: number,
    paidCount: number
  ): Promise<Payment[]>;
}
```

### 3. PaymentRegenerator

Orchestrates the regeneration process with transaction safety.

```typescript
interface PaymentRegenerator {
  // Regenerate payments for a single contract
  regenerateContract(
    contractId: string,
    dryRun: boolean
  ): Promise<RegenerationResult>;
  
  // Regenerate all contracts
  regenerateAll(dryRun: boolean): Promise<RegenerationSummary>;
}
```

### 4. BalanceCalculator

Calculates and updates contract balances.

```typescript
interface BalanceCalculator {
  // Calculate remaining balance
  calculateRemainingBalance(
    totalPrice: number,
    downPayment: number,
    paidCount: number,
    monthlyPayment: number
  ): number;
  
  // Update contract balance
  updateContractBalance(contractId: string, balance: number): Promise<void>;
}
```

### 5. PaymentVerifier

Verifies regeneration results.

```typescript
interface PaymentVerifier {
  // Verify all payments for a contract
  verifyContract(contractId: string): Promise<VerificationResult>;
  
  // Verify all contracts
  verifyAll(): Promise<VerificationSummary>;
}
```

## Data Models

### Contract

```typescript
interface Contract {
  id: string;
  contract_date: Date;
  total_price: number;
  down_payment: number;
  monthly_payment: number;
  payment_months: number;
  remaining_balance: number;
}
```

### Payment

```typescript
interface Payment {
  id: string;
  contract_id: string;
  payment_number: number;
  payment_date: Date;
  due_date: Date;
  amount: number;
  amount_paid: number;
  amount_pending: number;
  status: "pagado" | "pendiente";
  paid_date: Date | null;
}
```

### RegenerationResult

```typescript
interface RegenerationResult {
  contractId: string;
  success: boolean;
  oldPaidCount: number;
  newPaidCount: number;
  paymentCount: number;
  error?: string;
  changes: {
    deletedPayments: number;
    createdPayments: number;
    balanceUpdated: boolean;
  };
}
```

### RegenerationSummary

```typescript
interface RegenerationSummary {
  totalContracts: number;
  successfulContracts: number;
  failedContracts: number;
  totalPaymentsRegenerated: number;
  dryRun: boolean;
  errors: Array<{
    contractId: string;
    error: string;
  }>;
  verificationResults: VerificationSummary;
}
```

### VerificationResult

```typescript
interface VerificationResult {
  contractId: string;
  isValid: boolean;
  checks: {
    paymentCountCorrect: boolean;
    paymentDatesCorrect: boolean;
    statusDistributionCorrect: boolean;
    balanceCorrect: boolean;
  };
  failures: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Paid Payment Count Preservation

*For any* contract with an initial paid count N, after regeneration the first N payments should have status "pagado" and the remaining payments should have status "pendiente".

**Validates: Requirements 1.2, 3.1**

### Property 2: Payment Date Calculation

*For any* contract with contract_date D and payment number P, the calculated payment_date should be the 5th day of the month (D.month + P - 1).

**Validates: Requirements 2.3**

### Property 3: Payment Count Invariant

*For any* contract with payment_months M, after regeneration the contract should have exactly M payments.

**Validates: Requirements 2.2, 6.1**

### Property 4: Payment Amount Consistency

*For any* payment in a regenerated contract, the amount field should equal the contract's monthly_payment value.

**Validates: Requirements 2.6**

### Property 5: Payment Numbering Sequence

*For any* set of regenerated payments for a contract, the payment_number values should form a sequence from 1 to payment_months with no gaps.

**Validates: Requirements 2.5**

### Property 6: Paid Payment Invariants

*For any* payment with status "pagado", the following must hold: amount_paid = monthly_payment, amount_pending = 0, paid_date = payment_date, due_date = payment_date.

**Validates: Requirements 3.2, 3.4**

### Property 7: Pending Payment Invariants

*For any* payment with status "pendiente", the following must hold: amount_paid = 0, amount_pending = monthly_payment, paid_date = null, due_date = payment_date.

**Validates: Requirements 3.3, 3.4**

### Property 8: Balance Calculation Correctness

*For any* contract, the remaining_balance should equal (total_price - down_payment) - (paid_count × monthly_payment), clamped to minimum 0.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 9: Payment Date Day Invariant

*For any* payment in a regenerated contract, the day component of payment_date should always be 5.

**Validates: Requirements 2.3, 6.3**

### Property 10: Dry-Run Non-Destructiveness

*For any* contract processed in dry-run mode, the database state should remain unchanged after the operation completes.

**Validates: Requirements 5.5**

### Property 11: Transaction Isolation

*For any* contract that fails during regeneration, all changes to that contract should be rolled back and other contracts should continue processing normally.

**Validates: Requirements 5.1, 5.2**

### Property 12: Payment Deletion Completeness

*For any* contract undergoing regeneration, all existing payments should be deleted before new payments are created.

**Validates: Requirements 2.1**

## Error Handling

### Transaction Rollback

Each contract regeneration is wrapped in a database transaction. If any step fails:
- All changes to that contract are rolled back
- The error is logged with contract_id and error details
- Processing continues with the next contract
- The error is included in the final summary report

### Validation Errors

Before regeneration begins:
- Verify contract has required fields (contract_date, payment_months, monthly_payment)
- Verify payment_months > 0
- Verify monthly_payment > 0
- Log and skip contracts that fail validation

### Balance Clamping

If calculated remaining_balance is negative:
- Set remaining_balance to 0
- Log this adjustment
- Include in verification report

### Verification Failures

After regeneration:
- Run verification checks on all contracts
- Log any verification failures
- Include failures in final report
- Do not attempt to fix failures automatically

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

1. **Payment Date Calculation Examples**
   - Test contract_date = 2026-01-01, payment 1 → 2026-01-05
   - Test contract_date = 2026-01-15, payment 1 → 2026-01-05
   - Test contract_date = 2026-01-01, payment 2 → 2026-02-05
   - Test month boundary: contract_date = 2026-12-01, payment 2 → 2027-01-05

2. **Balance Calculation Examples**
   - Test: total_price=10000, down_payment=2000, paid_count=3, monthly_payment=1000 → balance=4000
   - Test: total_price=10000, down_payment=2000, paid_count=10, monthly_payment=1000 → balance=0 (clamped)
   - Test: total_price=10000, down_payment=0, paid_count=0, monthly_payment=1000 → balance=10000

3. **Edge Cases**
   - Contract with 0 paid payments
   - Contract with all payments paid
   - Contract with single payment
   - Contract with 12+ payments (year boundary)

4. **Error Handling**
   - Invalid contract data (missing fields)
   - Database connection failure
   - Transaction rollback on payment creation failure

### Property-Based Testing

Property-based tests verify universal properties across generated inputs:

1. **Property 1: Paid Payment Count Preservation**
   - Generate: random contract with 0-N paid payments
   - Action: regenerate payments
   - Assert: first N have status "pagado", rest have status "pendiente"
   - Iterations: 100+

2. **Property 2: Payment Date Calculation**
   - Generate: random contract_date, random payment_number (1-24)
   - Action: calculate payment_date
   - Assert: day = 5, month = (contract_date.month + payment_number - 1) mod 12
   - Iterations: 100+

3. **Property 3: Payment Count Invariant**
   - Generate: random contract with payment_months M
   - Action: regenerate payments
   - Assert: count(payments) = M
   - Iterations: 100+

4. **Property 4: Payment Amount Consistency**
   - Generate: random contract with monthly_payment M
   - Action: regenerate payments
   - Assert: all payments have amount = M
   - Iterations: 100+

5. **Property 5: Payment Numbering Sequence**
   - Generate: random contract with payment_months M
   - Action: regenerate payments
   - Assert: payment_numbers = [1, 2, ..., M] (sorted)
   - Iterations: 100+

6. **Property 6: Paid Payment Invariants**
   - Generate: random paid payment
   - Action: regenerate
   - Assert: amount_paid = monthly_payment, amount_pending = 0, paid_date = payment_date
   - Iterations: 100+

7. **Property 7: Pending Payment Invariants**
   - Generate: random pending payment
   - Action: regenerate
   - Assert: amount_paid = 0, amount_pending = monthly_payment, paid_date = null
   - Iterations: 100+

8. **Property 8: Balance Calculation Correctness**
   - Generate: random contract with total_price, down_payment, paid_count, monthly_payment
   - Action: calculate balance
   - Assert: balance = max(0, (total_price - down_payment) - (paid_count × monthly_payment))
   - Iterations: 100+

9. **Property 9: Payment Date Day Invariant**
   - Generate: random contract, random payment_number
   - Action: calculate payment_date
   - Assert: day(payment_date) = 5
   - Iterations: 100+

10. **Property 10: Dry-Run Non-Destructiveness**
    - Generate: random contract with payments
    - Action: regenerate in dry-run mode
    - Assert: database state unchanged
    - Iterations: 50+

11. **Property 11: Transaction Isolation**
    - Generate: random contracts, inject failure in one
    - Action: regenerate all
    - Assert: failed contract rolled back, others succeed
    - Iterations: 50+

12. **Property 12: Payment Deletion Completeness**
    - Generate: random contract with N payments
    - Action: regenerate
    - Assert: old payments deleted, new payments created
    - Iterations: 100+

### Test Configuration

- **Framework**: Jest with custom property-based testing utilities or fast-check
- **Minimum iterations**: 100 per property test
- **Timeout**: 30 seconds per test
- **Database**: Use test database with transaction rollback between tests
- **Tag format**: `Feature: contracts-temp-paid-months-import, Property {number}: {property_text}`

