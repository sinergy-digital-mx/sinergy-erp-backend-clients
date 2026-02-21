# Requirements Document: Contracts, Payment Plans, and Payments System

## Introduction

The Contracts, Payment Plans, and Payments System is an enhancement to the existing Sinergy ERP contracts and payments modules. This system extends the current implementation to add Payment Plans as a new entity that sits between Contracts and Payments, enabling flexible payment scheduling with multiple frequency options (monthly, quarterly, annual, one_time). The system manages the complete lifecycle of customer contracts, recurring payment schedules, and payment transactions while maintaining strict multi-tenant data isolation and RBAC enforcement. This enhancement integrates seamlessly with the existing contract and payment infrastructure, following established Sinergy ERP patterns and conventions.

## Glossary

- **Contract**: A formal agreement between a customer and the organization regarding a property, defining terms, conditions, and financial obligations
- **Payment_Plan**: A recurring payment schedule linked to a contract, defining frequency, amount, and duration of payments
- **Payment**: An individual transaction record representing a payment made against a payment plan
- **Tenant**: An isolated organizational context in the multi-tenant system, ensuring data separation
- **Customer**: An entity representing a person or organization that enters into contracts
- **Property**: A physical or logical asset that is the subject of a contract
- **Contract_Type**: Classification of contracts (venta, arrendamiento, otro)
- **Payment_Frequency**: The interval at which payments are due (monthly, quarterly, annual, one_time)
- **Payment_Method**: The mechanism used to process a payment (efectivo, transferencia, tarjeta, cheque)
- **Contract_Status**: The lifecycle state of a contract (activo, completado, cancelado)
- **Payment_Status**: The state of an individual payment (pendiente, completado, fallido, cancelado)
- **Plan_Status**: The state of a payment plan (activo, completado, cancelado)
- **RBAC**: Role-Based Access Control system for permission management
- **Multi-tenant**: Architecture pattern ensuring complete data isolation between different organizational contexts

## Requirements

### Requirement 1: Contract Creation and Management

**User Story:** As a contract manager, I want to create and manage contracts linking customers to properties, so that I can establish formal agreements and track contractual obligations.

#### Acceptance Criteria

1. WHEN a user with appropriate permissions creates a contract, THE System SHALL create a new contract record with all required fields (tenant_id, customer_id, property_id, contract_type, start_date, total_amount, currency, terms, status)
2. WHEN a contract is created, THE System SHALL validate that the customer_id and property_id exist and belong to the same tenant
3. WHEN a contract is created, THE System SHALL set the initial status to "activo"
4. WHEN a contract is created, THE System SHALL set created_at and updated_at timestamps to the current time
5. WHEN a user updates a contract, THE System SHALL validate that end_date is either null or greater than or equal to start_date
6. WHEN a user updates a contract, THE System SHALL update the updated_at timestamp
7. WHEN a user retrieves a contract, THE System SHALL only return contracts belonging to the user's tenant
8. WHEN a user deletes a contract, THE System SHALL prevent deletion if payment plans exist for that contract
9. WHEN a contract status is changed to "cancelado", THE System SHALL cascade the status change to all associated payment plans

#### Acceptance Criteria (Continued)

10. THE Contract SHALL support optional fields: end_date, conditions, and metadata
11. THE Contract SHALL store currency as a string with a default value of "MXN"
12. THE Contract SHALL support three contract types: venta, arrendamiento, otro

### Requirement 2: Payment Plan Creation and Scheduling

**User Story:** As a financial administrator, I want to create flexible payment plans with various frequencies, so that I can accommodate different payment schedules and business models.

#### Acceptance Criteria

1. WHEN a user creates a payment plan, THE System SHALL create a new payment plan record with all required fields (tenant_id, contract_id, frequency, amount_per_period, currency, start_date, status)
2. WHEN a payment plan is created, THE System SHALL validate that the contract_id exists and belongs to the same tenant
3. WHEN a payment plan is created, THE System SHALL set the initial status to "activo"
4. WHEN a payment plan is created, THE System SHALL calculate and set next_payment_date based on start_date and frequency
5. WHEN a payment plan is created with frequency "one_time", THE System SHALL set end_date equal to start_date
6. WHEN a payment plan is created with frequency "monthly", THE System SHALL calculate next_payment_date as start_date plus one month
7. WHEN a payment plan is created with frequency "quarterly", THE System SHALL calculate next_payment_date as start_date plus three months
8. WHEN a payment plan is created with frequency "annual", THE System SHALL calculate next_payment_date as start_date plus one year
9. WHEN a user updates a payment plan, THE System SHALL validate that end_date is either null or greater than or equal to start_date
10. WHEN a user updates a payment plan, THE System SHALL recalculate next_payment_date if start_date or frequency changes
11. WHEN a user retrieves payment plans, THE System SHALL only return plans belonging to the user's tenant
12. WHEN a payment plan status is changed to "completado" or "cancelado", THE System SHALL prevent creation of new payments for that plan

### Requirement 3: Payment Recording and Tracking

**User Story:** As a payment processor, I want to record individual payments against payment plans, so that I can track payment history and maintain accurate financial records.

#### Acceptance Criteria

1. WHEN a user creates a payment, THE System SHALL create a new payment record with all required fields (tenant_id, payment_plan_id, amount, payment_date, payment_method, status)
2. WHEN a payment is created, THE System SHALL validate that the payment_plan_id exists and belongs to the same tenant
3. WHEN a payment is created, THE System SHALL set the initial status to "pendiente"
4. WHEN a payment is created, THE System SHALL set created_at and updated_at timestamps to the current time
5. WHEN a payment is created, THE System SHALL validate that the amount is greater than zero
6. WHEN a payment is created, THE System SHALL validate that payment_date is not in the future
7. WHEN a user updates a payment status to "completado", THE System SHALL update the updated_at timestamp
8. WHEN a user retrieves payments, THE System SHALL only return payments belonging to the user's tenant
9. WHEN a payment status is changed to "completado", THE System SHALL update the associated payment plan's next_payment_date
10. WHEN a payment status is changed to "completado", THE System SHALL check if all payments for a plan are completed and update plan status to "completado" if applicable
11. THE Payment SHALL support four payment methods: efectivo, transferencia, tarjeta, cheque
12. THE Payment SHALL support four payment statuses: pendiente, completado, fallido, cancelado

### Requirement 4: Multi-Tenant Data Isolation

**User Story:** As a system administrator, I want to ensure complete data isolation between tenants, so that customer data remains secure and confidential.

#### Acceptance Criteria

1. WHEN a user performs any operation (create, read, update, delete), THE System SHALL automatically filter results by the user's tenant_id
2. WHEN a user attempts to access a contract, payment plan, or payment from a different tenant, THE System SHALL return a 403 Forbidden error
3. WHEN a contract is created, THE System SHALL require tenant_id as a mandatory field
4. WHEN a payment plan is created, THE System SHALL require tenant_id as a mandatory field
5. WHEN a payment is created, THE System SHALL require tenant_id as a mandatory field
6. WHEN querying contracts, THE System SHALL include tenant_id in all WHERE clauses
7. WHEN querying payment plans, THE System SHALL include tenant_id in all WHERE clauses
8. WHEN querying payments, THE System SHALL include tenant_id in all WHERE clauses

### Requirement 5: Role-Based Access Control

**User Story:** As a security administrator, I want to enforce role-based permissions for contract and payment operations, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. WHEN a user attempts to create a contract, THE System SHALL verify the user has the "contract:create" permission
2. WHEN a user attempts to read a contract, THE System SHALL verify the user has the "contract:read" permission
3. WHEN a user attempts to update a contract, THE System SHALL verify the user has the "contract:update" permission
4. WHEN a user attempts to delete a contract, THE System SHALL verify the user has the "contract:delete" permission
5. WHEN a user attempts to create a payment plan, THE System SHALL verify the user has the "payment_plan:create" permission
6. WHEN a user attempts to read a payment plan, THE System SHALL verify the user has the "payment_plan:read" permission
7. WHEN a user attempts to update a payment plan, THE System SHALL verify the user has the "payment_plan:update" permission
8. WHEN a user attempts to delete a payment plan, THE System SHALL verify the user has the "payment_plan:delete" permission
9. WHEN a user attempts to create a payment, THE System SHALL verify the user has the "payment:create" permission
10. WHEN a user attempts to read a payment, THE System SHALL verify the user has the "payment:read" permission
11. WHEN a user attempts to update a payment, THE System SHALL verify the user has the "payment:update" permission
12. WHEN a user attempts to delete a payment, THE System SHALL verify the user has the "payment:delete" permission

### Requirement 6: Contract Statistics and Reporting

**User Story:** As a financial analyst, I want to retrieve contract and payment statistics, so that I can analyze financial performance and payment trends.

#### Acceptance Criteria

1. WHEN a user requests contract statistics, THE System SHALL return the total number of active contracts for the tenant
2. WHEN a user requests contract statistics, THE System SHALL return the total contract value (sum of total_amount) for active contracts
3. WHEN a user requests contract statistics, THE System SHALL return the count of contracts grouped by contract_type
4. WHEN a user requests contract statistics, THE System SHALL return the count of contracts grouped by status
5. WHEN a user requests payment statistics, THE System SHALL return the total amount of completed payments for the tenant
6. WHEN a user requests payment statistics, THE System SHALL return the count of payments grouped by payment_method
7. WHEN a user requests payment statistics, THE System SHALL return the count of payments grouped by payment_status
8. WHEN a user requests payment statistics, THE System SHALL return the average payment amount
9. WHEN a user requests payment plan statistics, THE System SHALL return the total amount of pending payments across all active plans
10. WHEN a user requests payment plan statistics, THE System SHALL return the count of payment plans grouped by frequency

### Requirement 7: Data Validation and Integrity

**User Story:** As a data quality manager, I want the system to validate all inputs and maintain data integrity, so that the database remains consistent and reliable.

#### Acceptance Criteria

1. WHEN a contract is created, THE System SHALL validate that total_amount is greater than zero
2. WHEN a contract is created, THE System SHALL validate that start_date is not in the future
3. WHEN a contract is created, THE System SHALL validate that end_date is null or greater than start_date
4. WHEN a payment plan is created, THE System SHALL validate that amount_per_period is greater than zero
5. WHEN a payment plan is created, THE System SHALL validate that start_date is not in the future
6. WHEN a payment plan is created, THE System SHALL validate that end_date is null or greater than start_date
7. WHEN a payment is created, THE System SHALL validate that amount is greater than zero
8. WHEN a payment is created, THE System SHALL validate that payment_date is not in the future
9. WHEN a payment is created, THE System SHALL validate that the payment_plan_id references an active payment plan
10. WHEN a contract is updated, THE System SHALL prevent changes to customer_id or property_id
11. WHEN a payment plan is updated, THE System SHALL prevent changes to contract_id
12. WHEN a payment is updated, THE System SHALL prevent changes to payment_plan_id

### Requirement 8: Relationship Integrity

**User Story:** As a database administrator, I want to maintain referential integrity between contracts, payment plans, and payments, so that the system remains consistent.

#### Acceptance Criteria

1. WHEN a contract is created, THE System SHALL verify that the customer_id exists in the customers table
2. WHEN a contract is created, THE System SHALL verify that the property_id exists in the properties table
3. WHEN a contract is created, THE System SHALL verify that both customer and property belong to the same tenant
4. WHEN a payment plan is created, THE System SHALL verify that the contract_id exists in the contracts table
5. WHEN a payment plan is created, THE System SHALL verify that the contract belongs to the same tenant
6. WHEN a payment is created, THE System SHALL verify that the payment_plan_id exists in the payment_plans table
7. WHEN a payment is created, THE System SHALL verify that the payment plan belongs to the same tenant
8. WHEN a contract is deleted, THE System SHALL cascade delete all associated payment plans and payments
9. WHEN a payment plan is deleted, THE System SHALL cascade delete all associated payments
10. WHEN a customer is deleted, THE System SHALL prevent deletion if active contracts exist for that customer

### Requirement 9: API Endpoints

**User Story:** As an API consumer, I want well-defined REST endpoints for all contract, payment plan, and payment operations, so that I can integrate with the system programmatically.

#### Acceptance Criteria

1. THE System SHALL provide POST /contracts endpoint to create contracts
2. THE System SHALL provide GET /contracts endpoint to list contracts with pagination and filtering
3. THE System SHALL provide GET /contracts/:id endpoint to retrieve a specific contract
4. THE System SHALL provide PUT /contracts/:id endpoint to update a contract
5. THE System SHALL provide DELETE /contracts/:id endpoint to delete a contract
6. THE System SHALL provide POST /payment-plans endpoint to create payment plans
7. THE System SHALL provide GET /payment-plans endpoint to list payment plans with pagination and filtering
8. THE System SHALL provide GET /payment-plans/:id endpoint to retrieve a specific payment plan
9. THE System SHALL provide PUT /payment-plans/:id endpoint to update a payment plan
10. THE System SHALL provide DELETE /payment-plans/:id endpoint to delete a payment plan
11. THE System SHALL provide POST /payments endpoint to create payments
12. THE System SHALL provide GET /payments endpoint to list payments with pagination and filtering
13. THE System SHALL provide GET /payments/:id endpoint to retrieve a specific payment
14. THE System SHALL provide PUT /payments/:id endpoint to update a payment
15. THE System SHALL provide DELETE /payments/:id endpoint to delete a payment
16. THE System SHALL provide GET /contracts/:id/statistics endpoint to retrieve contract statistics
17. THE System SHALL provide GET /payments/statistics endpoint to retrieve payment statistics
18. THE System SHALL provide GET /payment-plans/statistics endpoint to retrieve payment plan statistics

