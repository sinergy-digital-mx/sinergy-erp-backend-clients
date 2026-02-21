# Design Document: Contracts, Payment Plans, and Payments System

## Overview

The Contracts, Payment Plans, and Payments System is an enhancement to the existing Sinergy ERP contracts and payments modules. This design extends the current implementation by introducing Payment Plans as a new entity that manages flexible payment scheduling between Contracts and Payments. The system is built on the established Sinergy ERP multi-tenant architecture, following all existing patterns for RBAC enforcement, service-oriented design, and data isolation.

### Key Design Principles

- **Multi-tenant First**: Every entity includes tenant_id for complete data isolation
- **Referential Integrity**: Foreign key constraints and cascade operations maintain data consistency
- **RBAC Enforcement**: Permission checks at every operation boundary
- **Immutable References**: Customer and property references cannot be changed after contract creation
- **Cascade Operations**: Status changes and deletions cascade appropriately through relationships
- **Flexible Scheduling**: Support for multiple payment frequencies with automatic date calculations
- **Existing Pattern Compliance**: Follows established Sinergy ERP conventions for services, controllers, DTOs, and entities

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (REST)                         │
│  /contracts  /payment-plans  /payments  /statistics         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Service Layer (Business Logic)                 │
│  ContractService  PaymentPlanService  PaymentService       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           Repository Layer (Data Access)                    │
│  ContractRepository  PaymentPlanRepository  PaymentRepository
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Database Layer (PostgreSQL)                    │
│  contracts  payment_plans  payments  (with tenant_id)      │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Cutting Concerns

- **Authentication**: Verified before any operation
- **Authorization (RBAC)**: Permission checks at service layer
- **Multi-tenant Filtering**: Applied at repository layer
- **Validation**: Input validation at service layer
- **Audit Logging**: Timestamps (created_at, updated_at) on all entities



## Components and Interfaces

### Contract Service

**Responsibilities**:
- Create, read, update, delete contracts
- Validate contract data and relationships
- Enforce RBAC permissions
- Cascade status changes to payment plans
- Prevent deletion if payment plans exist

**Key Methods**:
```
createContract(tenantId, customerId, propertyId, contractType, startDate, totalAmount, currency, terms, conditions?, metadata?) -> Contract
getContract(tenantId, contractId) -> Contract
listContracts(tenantId, filters?, pagination?) -> Contract[]
updateContract(tenantId, contractId, updates) -> Contract
deleteContract(tenantId, contractId) -> void
changeContractStatus(tenantId, contractId, newStatus) -> Contract
```

### Payment Plan Service

**Responsibilities**:
- Create, read, update, delete payment plans
- Calculate next_payment_date based on frequency
- Validate payment plan data and relationships
- Enforce RBAC permissions
- Prevent payment creation for inactive plans
- Recalculate dates on updates

**Key Methods**:
```
createPaymentPlan(tenantId, contractId, frequency, amountPerPeriod, currency, startDate, endDate?) -> PaymentPlan
getPaymentPlan(tenantId, planId) -> PaymentPlan
listPaymentPlans(tenantId, filters?, pagination?) -> PaymentPlan[]
updatePaymentPlan(tenantId, planId, updates) -> PaymentPlan
deletePaymentPlan(tenantId, planId) -> void
calculateNextPaymentDate(startDate, frequency) -> Date
```

### Payment Service

**Responsibilities**:
- Create, read, update, delete payments
- Validate payment data and relationships
- Enforce RBAC permissions
- Update payment plan's next_payment_date on completion
- Check and update plan status when all payments completed
- Prevent payments for inactive plans

**Key Methods**:
```
createPayment(tenantId, paymentPlanId, amount, paymentDate, paymentMethod) -> Payment
getPayment(tenantId, paymentId) -> Payment
listPayments(tenantId, filters?, pagination?) -> Payment[]
updatePayment(tenantId, paymentId, updates) -> Payment
deletePayment(tenantId, paymentId) -> void
completePayment(tenantId, paymentId) -> Payment
```

### Statistics Service

**Responsibilities**:
- Calculate contract statistics
- Calculate payment statistics
- Calculate payment plan statistics
- Enforce RBAC permissions
- Filter by tenant

**Key Methods**:
```
getContractStatistics(tenantId) -> ContractStats
getPaymentStatistics(tenantId) -> PaymentStats
getPaymentPlanStatistics(tenantId) -> PaymentPlanStats
```



## Data Models

### Contract Entity

```typescript
interface Contract {
  id: UUID;
  tenant_id: UUID;
  customer_id: UUID;
  property_id: UUID;
  contract_type: 'venta' | 'arrendamiento' | 'otro';
  start_date: Timestamp;
  end_date: Timestamp | null;
  total_amount: Decimal;
  currency: string; // default: 'MXN'
  terms: string;
  conditions: string | null;
  metadata: JSON | null;
  status: 'activo' | 'completado' | 'cancelado';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Constraints**:
- tenant_id, customer_id, property_id, contract_type, start_date, total_amount, terms are required
- total_amount > 0
- start_date <= end_date (if end_date is not null)
- start_date not in future
- customer_id and property_id must exist and belong to same tenant
- Foreign keys: customer_id (customers), property_id (properties), tenant_id (tenants)

### Payment Plan Entity

```typescript
interface PaymentPlan {
  id: UUID;
  tenant_id: UUID;
  contract_id: UUID;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  amount_per_period: Decimal;
  currency: string;
  start_date: Timestamp;
  end_date: Timestamp | null;
  next_payment_date: Timestamp;
  status: 'activo' | 'completado' | 'cancelado';
  metadata: JSON | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Constraints**:
- tenant_id, contract_id, frequency, amount_per_period, currency, start_date are required
- amount_per_period > 0
- start_date <= end_date (if end_date is not null)
- start_date not in future
- contract_id must exist and belong to same tenant
- next_payment_date calculated based on frequency
- For one_time: end_date = start_date
- Foreign key: contract_id (contracts), tenant_id (tenants)

### Payment Entity

```typescript
interface Payment {
  id: UUID;
  tenant_id: UUID;
  payment_plan_id: UUID;
  amount: Decimal;
  payment_date: Timestamp;
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  status: 'pendiente' | 'completado' | 'fallido' | 'cancelado';
  metadata: JSON | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Constraints**:
- tenant_id, payment_plan_id, amount, payment_date, payment_method are required
- amount > 0
- payment_date not in future
- payment_plan_id must exist and belong to same tenant
- payment_plan must be active (status = 'activo')
- Foreign key: payment_plan_id (payment_plans), tenant_id (tenants)

### Database Schema

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  property_id UUID NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  terms TEXT NOT NULL,
  conditions TEXT,
  metadata JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  CHECK (total_amount > 0),
  CHECK (start_date <= end_date OR end_date IS NULL),
  INDEX (tenant_id, status),
  INDEX (tenant_id, customer_id),
  INDEX (tenant_id, property_id)
);

CREATE TABLE payment_plans (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  contract_id UUID NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  amount_per_period DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_payment_date TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'activo',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CHECK (amount_per_period > 0),
  CHECK (start_date <= end_date OR end_date IS NULL),
  INDEX (tenant_id, status),
  INDEX (tenant_id, contract_id),
  INDEX (tenant_id, next_payment_date)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  payment_plan_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE,
  CHECK (amount > 0),
  INDEX (tenant_id, status),
  INDEX (tenant_id, payment_plan_id),
  INDEX (tenant_id, payment_date)
);
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property-Based Testing Overview

Property-based testing (PBT) validates software correctness by testing universal properties across many generated inputs. Each property is a formal specification that should hold for all valid inputs.

### Core Principles

1. **Universal Quantification**: Every property must contain an explicit "for all" statement
2. **Requirements Traceability**: Each property must reference the requirements it validates
3. **Executable Specifications**: Properties must be implementable as automated tests
4. **Comprehensive Coverage**: Properties should cover all testable acceptance criteria

### Correctness Properties

#### Property 1: Contract Creation Completeness
*For any* valid contract input (customer_id, property_id, contract_type, start_date, total_amount, currency, terms), creating a contract SHALL result in all required fields being stored and retrievable.
**Validates: Requirements 1.1**

#### Property 2: Contract Tenant Isolation
*For any* contract created in tenant A, querying contracts from tenant B SHALL not return that contract.
**Validates: Requirements 1.7, 4.1**

#### Property 3: Contract Status Cascade
*For any* contract with associated payment plans, changing the contract status to "cancelado" SHALL result in all associated payment plans also having status "cancelado".
**Validates: Requirements 1.9**

#### Property 4: Contract Deletion Prevention
*For any* contract with associated payment plans, attempting to delete that contract SHALL fail with an error.
**Validates: Requirements 1.8**

#### Property 5: Contract Date Validation
*For any* contract update with end_date not null, the end_date SHALL be greater than or equal to start_date.
**Validates: Requirements 1.5, 7.3**

#### Property 6: Payment Plan Frequency Calculation
*For any* payment plan with frequency "monthly" and start_date D, the next_payment_date SHALL be exactly one month after D.
**Validates: Requirements 2.6**

#### Property 7: Payment Plan Quarterly Calculation
*For any* payment plan with frequency "quarterly" and start_date D, the next_payment_date SHALL be exactly three months after D.
**Validates: Requirements 2.7**

#### Property 8: Payment Plan Annual Calculation
*For any* payment plan with frequency "annual" and start_date D, the next_payment_date SHALL be exactly one year after D.
**Validates: Requirements 2.8**

#### Property 9: Payment Plan One-Time Calculation
*For any* payment plan with frequency "one_time" and start_date D, the end_date SHALL equal D.
**Validates: Requirements 2.5**

#### Property 10: Payment Plan Recalculation on Update
*For any* payment plan where start_date or frequency is updated, the next_payment_date SHALL be recalculated according to the new values.
**Validates: Requirements 2.10**

#### Property 11: Payment Plan Tenant Isolation
*For any* payment plan created in tenant A, querying payment plans from tenant B SHALL not return that plan.
**Validates: Requirements 2.11, 4.1**

#### Property 12: Payment Plan Status Lock
*For any* payment plan with status "completado" or "cancelado", attempting to create a new payment for that plan SHALL fail.
**Validates: Requirements 2.12**

#### Property 13: Payment Creation Completeness
*For any* valid payment input (payment_plan_id, amount, payment_date, payment_method), creating a payment SHALL result in all required fields being stored with status "pendiente".
**Validates: Requirements 3.1, 3.3**

#### Property 14: Payment Amount Validation
*For any* payment creation attempt with amount <= 0, the creation SHALL fail with a validation error.
**Validates: Requirements 3.5, 7.5**

#### Property 15: Payment Date Validation
*For any* payment creation attempt with payment_date in the future, the creation SHALL fail with a validation error.
**Validates: Requirements 3.6, 7.8**

#### Property 16: Payment Tenant Isolation
*For any* payment created in tenant A, querying payments from tenant B SHALL not return that payment.
**Validates: Requirements 3.8, 4.1**

#### Property 17: Payment Completion Updates Next Date
*For any* payment that is marked as "completado", the associated payment plan's next_payment_date SHALL be updated to the next scheduled date.
**Validates: Requirements 3.9**

#### Property 18: Payment Plan Auto-Completion
*For any* payment plan where all payments are marked "completado", the payment plan status SHALL automatically become "completado".
**Validates: Requirements 3.10**

#### Property 19: Multi-Tenant Access Control
*For any* user attempting to access a contract, payment plan, or payment from a different tenant, the system SHALL return a 403 Forbidden error.
**Validates: Requirements 4.2**

#### Property 20: Mandatory Tenant ID
*For any* contract, payment plan, or payment creation attempt without tenant_id, the creation SHALL fail with a validation error.
**Validates: Requirements 4.3, 4.4, 4.5**

#### Property 21: RBAC Permission Enforcement
*For any* user without the required permission attempting an operation (create/read/update/delete), the system SHALL deny the operation.
**Validates: Requirements 5.1-5.12**

#### Property 22: Contract Statistics Accuracy
*For any* set of contracts in a tenant, the contract statistics SHALL accurately reflect the count, total value, and groupings by type and status.
**Validates: Requirements 6.1-6.4**

#### Property 23: Payment Statistics Accuracy
*For any* set of payments in a tenant, the payment statistics SHALL accurately reflect total completed amount, counts by method and status, and average amount.
**Validates: Requirements 6.5-6.8**

#### Property 24: Payment Plan Statistics Accuracy
*For any* set of payment plans in a tenant, the payment plan statistics SHALL accurately reflect pending payment totals and counts by frequency.
**Validates: Requirements 6.9-6.10**

#### Property 25: Contract Referential Integrity
*For any* contract creation, the customer_id and property_id SHALL exist in their respective tables and belong to the same tenant.
**Validates: Requirements 8.1-8.3**

#### Property 26: Payment Plan Referential Integrity
*For any* payment plan creation, the contract_id SHALL exist in the contracts table and belong to the same tenant.
**Validates: Requirements 8.4-8.5**

#### Property 27: Payment Referential Integrity
*For any* payment creation, the payment_plan_id SHALL exist in the payment_plans table and belong to the same tenant.
**Validates: Requirements 8.6-8.7**

#### Property 28: Cascade Delete Contracts
*For any* contract deletion, all associated payment plans and payments SHALL also be deleted.
**Validates: Requirements 8.8**

#### Property 29: Cascade Delete Payment Plans
*For any* payment plan deletion, all associated payments SHALL also be deleted.
**Validates: Requirements 8.9**

#### Property 30: API Endpoint Availability
*For any* required endpoint (POST/GET/PUT/DELETE for contracts, payment plans, payments, and statistics), the endpoint SHALL be available and respond with appropriate status codes.
**Validates: Requirements 9.1-9.18**



## Error Handling

### Validation Errors (400 Bad Request)

- Invalid contract_type (not in: venta, arrendamiento, otro)
- Invalid payment_frequency (not in: monthly, quarterly, annual, one_time)
- Invalid payment_method (not in: efectivo, transferencia, tarjeta, cheque)
- Invalid payment_status (not in: pendiente, completado, fallido, cancelado)
- Invalid contract_status (not in: activo, completado, cancelado)
- total_amount <= 0
- amount_per_period <= 0
- amount <= 0
- start_date in future
- end_date < start_date
- Missing required fields (tenant_id, customer_id, property_id, etc.)

### Referential Integrity Errors (422 Unprocessable Entity)

- customer_id does not exist
- property_id does not exist
- contract_id does not exist
- payment_plan_id does not exist
- customer and property belong to different tenants
- Entity belongs to different tenant

### Business Logic Errors (409 Conflict)

- Cannot delete contract with existing payment plans
- Cannot create payment for inactive payment plan
- Cannot create payment plan for inactive contract
- Cannot update customer_id or property_id on existing contract
- Cannot update contract_id on existing payment plan
- Cannot update payment_plan_id on existing payment

### Authorization Errors (403 Forbidden)

- User lacks required permission for operation
- User attempting to access entity from different tenant

### Not Found Errors (404 Not Found)

- Contract not found
- Payment plan not found
- Payment not found

### Server Errors (500 Internal Server Error)

- Database connection failures
- Unexpected calculation errors
- Cascade operation failures

## Testing Strategy

### Dual Testing Approach

This system requires both unit testing and property-based testing for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- Both are complementary and necessary for complete correctness validation

### Unit Testing

Unit tests should focus on:
- Specific examples demonstrating correct behavior
- Integration points between services
- Edge cases and error conditions
- Boundary values (zero amounts, null dates, etc.)
- Error message validation

Example unit test areas:
- Contract creation with valid data
- Payment plan date calculations for each frequency
- Payment status transitions
- Cascade operations (status changes, deletions)
- RBAC permission denials
- Multi-tenant filtering

### Property-Based Testing

Property-based tests should verify:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be maintained
- Round-trip properties (create → read → verify)
- Cascade behavior across all scenarios

**Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: contracts-payments-system, Property {number}: {property_text}**

### Test Implementation Guidelines

1. **For each correctness property in this design**:
   - Create ONE property-based test
   - Use the property-based testing library for the target language
   - Configure minimum 100 iterations
   - Tag with property number and text

2. **For each acceptance criterion marked as "yes - example"**:
   - Create ONE unit test
   - Test the specific example scenario
   - Verify expected behavior

3. **For each acceptance criterion marked as "edge-case"**:
   - Include in property test generators
   - Ensure generators produce edge case values
   - Verify system handles them correctly

### Testing Libraries

- **TypeScript/JavaScript**: fast-check for property-based testing
- **Python**: Hypothesis for property-based testing
- **Java**: QuickTheories or jqwik for property-based testing
- **Go**: gopter for property-based testing

### Test Organization

```
tests/
├── unit/
│   ├── contracts.test.ts
│   ├── payment-plans.test.ts
│   └── payments.test.ts
├── properties/
│   ├── contracts.properties.test.ts
│   ├── payment-plans.properties.test.ts
│   ├── payments.properties.test.ts
│   └── statistics.properties.test.ts
└── integration/
    └── cascade-operations.test.ts
```

### Coverage Goals

- All 30 correctness properties must have corresponding property-based tests
- All error conditions must be tested
- All RBAC scenarios must be tested
- All multi-tenant scenarios must be tested
- Minimum 80% code coverage overall

