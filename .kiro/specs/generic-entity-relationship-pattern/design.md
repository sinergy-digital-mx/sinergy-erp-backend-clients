# Design Document: Generic Entity Relationship Pattern Refactoring

## Overview

This design establishes a clean, scalable pattern for linking entities across the system using EntityRegistry as the single source of truth. Instead of hardcoded entity_type strings, the system uses entity_type_id as a foreign key to EntityRegistry, enabling support for any entity type while maintaining data consistency and multi-tenant isolation.

The pattern is applied to:
1. **EmailThread** - Refactored from hardcoded entity_type strings to EntityRegistry pattern
2. **Transaction** - New entity built with the pattern from the start

This design ensures:
- Scalability: New entity types can be added without code changes
- Consistency: All modules use the same pattern
- Type safety: Foreign key constraints prevent invalid entity types
- Performance: Proper indexing on tenant_id and entity_type_id
- Backward compatibility: Existing EmailThread data is preserved during migration

## Architecture

### Entity Relationship Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    EntityRegistry                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id (PK)  │ code (unique)  │ name                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ 1        │ lead           │ Lead                     │   │
│  │ 2        │ contract       │ Contract                 │   │
│  │ 3        │ customer       │ Customer                 │   │
│  │ 4        │ property       │ Property                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ FK
                           │
┌─────────────────────────────────────────────────────────────┐
│                    EmailThread                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id (PK)  │ tenant_id │ entity_type_id (FK) │ entity_id   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ uuid-1   │ tenant-1  │ 1 (Lead)            │ uuid-lead-1 │
│  │ uuid-2   │ tenant-1  │ 2 (Contract)        │ uuid-con-1  │
│  │ uuid-3   │ tenant-2  │ 3 (Customer)        │ uuid-cust-1 │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Transaction                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id (PK)  │ tenant_id │ entity_type_id (FK) │ entity_id   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ uuid-1   │ tenant-1  │ 2 (Contract)        │ uuid-con-1  │
│  │ uuid-2   │ tenant-1  │ 3 (Customer)        │ uuid-cust-1 │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **entity_type_id as Foreign Key**: Enforces referential integrity at the database level
2. **entity_id as UUID**: Supports any entity type regardless of its primary key type
3. **Computed entity_type Property**: Derived from entity_type_id relationship, not stored
4. **Tenant-scoped Queries**: All queries include tenant_id for multi-tenant isolation
5. **Backward Compatibility**: lead_id column remains during transition period

## Components and Interfaces

### EntityRegistry Entity

```typescript
@Entity('entity_registry')
export class EntityRegistry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 'lead', 'contract', 'customer', 'property'

  @Column()
  name: string; // 'Lead', 'Contract', 'Customer', 'Property'
}
```

### EmailThread Entity (Refactored)

```typescript
@Entity('email_threads')
@Index(['tenant_id', 'entity_type_id', 'entity_id'])
@Index(['tenant_id', 'status'])
export class EmailThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  // NEW: Foreign key to EntityRegistry
  @ManyToOne(() => EntityRegistry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entity_type_id' })
  entityType: EntityRegistry;

  @Column()
  entity_type_id: number;

  // entity_id: UUID of the specific entity instance
  @Column()
  entity_id: string;

  // COMPUTED: Derived from entityType relationship
  get entity_type(): string {
    return this.entityType?.code || null;
  }

  @Column()
  subject: string;

  @Column()
  email_from: string;

  @Column()
  email_to: string;

  @Column({ default: 'draft' })
  status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date | null;

  @Column({ default: 0 })
  message_count: number;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => EmailMessage, (message) => message.thread)
  messages: EmailMessage[];

  // DEPRECATED: Kept for backward compatibility during transition
  @Column({ nullable: true })
  lead_id: number;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;
}
```

### Transaction Entity (New)

```typescript
@Entity('transactions')
@Index(['tenant_id', 'entity_type_id', 'entity_id'])
@Index(['tenant_id', 'status'])
@Index(['entity_type_id', 'entity_id'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  // Foreign key to EntityRegistry
  @ManyToOne(() => EntityRegistry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entity_type_id' })
  entityType: EntityRegistry;

  @Column()
  entity_type_id: number;

  // entity_id: UUID of the specific entity instance
  @Column()
  entity_id: string;

  // COMPUTED: Derived from entityType relationship
  get entity_type(): string {
    return this.entityType?.code || null;
  }

  @Column({ length: 50 })
  transaction_number: string;

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'transferencia' })
  payment_method: string;

  @Column({
    type: 'enum',
    enum: ['pagado', 'pendiente', 'atrasado', 'cancelado'],
    default: 'pendiente',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

### Service Interfaces

#### EmailThreadService

```typescript
interface IEmailThreadService {
  // Create thread with entity_type_id instead of entity_type string
  createThread(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
    emailTo: string,
    subject: string,
    body: string,
    userId: string,
  ): Promise<{ thread: EmailThread; message: EmailMessage }>;

  // Query by entity using entity_type_id and entity_id
  getThreadsByEntity(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
  ): Promise<EmailThread[]>;

  // Get thread details with computed entity_type
  getThreadDetails(tenantId: string, threadId: string): Promise<EmailThread>;

  // Update thread status
  updateThreadStatus(
    tenantId: string,
    threadId: string,
    status: 'draft' | 'sent' | 'replied' | 'closed' | 'archived',
  ): Promise<EmailThread>;

  // Get all threads for tenant
  getAllThreads(
    tenantId: string,
    filters?: {
      entityTypeId?: number;
      status?: string;
      archived?: boolean;
    },
  ): Promise<EmailThread[]>;
}
```

#### TransactionService

```typescript
interface ITransactionService {
  // Create transaction with entity_type_id
  createTransaction(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
    transactionNumber: string,
    transactionDate: Date,
    amount: number,
    paymentMethod: string,
    status: string,
  ): Promise<Transaction>;

  // Query by entity using entity_type_id and entity_id
  getTransactionsByEntity(
    tenantId: string,
    entityTypeId: number,
    entityId: string,
  ): Promise<Transaction[]>;

  // Get transaction details with computed entity_type
  getTransactionDetails(tenantId: string, transactionId: string): Promise<Transaction>;

  // Update transaction status
  updateTransactionStatus(
    tenantId: string,
    transactionId: string,
    status: string,
  ): Promise<Transaction>;

  // Get all transactions for tenant
  getAllTransactions(
    tenantId: string,
    filters?: {
      entityTypeId?: number;
      status?: string;
    },
  ): Promise<Transaction[]>;
}
```

## Data Models

### EmailThread Schema (After Migration)

```sql
CREATE TABLE email_threads (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  entity_type_id INT NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email_from VARCHAR(255) NOT NULL,
  email_to VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  last_message_at TIMESTAMP NULL,
  message_count INT DEFAULT 0,
  is_read BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lead_id INT NULL, -- DEPRECATED: For backward compatibility
  
  FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_type_id) REFERENCES entity_registry(id) ON DELETE RESTRICT,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  
  INDEX idx_tenant_entity (tenant_id, entity_type_id, entity_id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_lead_id (lead_id)
);
```

### Transaction Schema (New)

```sql
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  entity_type_id INT NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  transaction_number VARCHAR(50) NOT NULL,
  transaction_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'transferencia',
  status ENUM('pagado', 'pendiente', 'atrasado', 'cancelado') DEFAULT 'pendiente',
  notes TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_type_id) REFERENCES entity_registry(id) ON DELETE RESTRICT,
  
  INDEX idx_tenant_entity (tenant_id, entity_type_id, entity_id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_entity_type_id (entity_type_id, entity_id)
);
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.


### Property 1: EntityRegistry Uniqueness
*For any* EntityRegistry, all entries SHALL have unique codes and non-empty names.
**Validates: Requirements 1.3**

### Property 2: EntityRegistry Consistency
*For any* query to EntityRegistry, multiple queries for the same entity type SHALL return identical results.
**Validates: Requirements 1.4**

### Property 3: EmailThread Entity Type ID Acceptance
*For any* valid entity_type_id from EntityRegistry and any UUID entity_id, creating an EmailThread SHALL store both values correctly.
**Validates: Requirements 2.1, 2.2**

### Property 4: EmailThread Computed Property
*For any* EmailThread loaded from the database, the computed entity_type property SHALL match the code from the related EntityRegistry entry.
**Validates: Requirements 2.3, 7.1, 7.4**

### Property 5: EmailThread Entity Query Specificity
*For any* tenant, entity_type_id, and entity_id, querying EmailThreads SHALL return only threads matching all three criteria.
**Validates: Requirements 2.4**

### Property 6: EmailThread Data Preservation
*For any* existing EmailThread data before migration, the count of threads after migration SHALL equal the count before migration.
**Validates: Requirements 2.6, 6.2**

### Property 7: EmailThread Migration Mapping
*For any* EmailThread after migration, the entity_type_id SHALL reference a valid EntityRegistry entry.
**Validates: Requirements 2.6, 6.3**

### Property 8: Transaction Entity Type ID Acceptance
*For any* valid entity_type_id from EntityRegistry and any UUID entity_id, creating a Transaction SHALL store both values correctly.
**Validates: Requirements 3.1, 3.2**

### Property 9: Transaction Computed Property
*For any* Transaction loaded from the database, the computed entity_type property SHALL match the code from the related EntityRegistry entry.
**Validates: Requirements 3.3, 7.2, 7.4**

### Property 10: Transaction Entity Query Specificity
*For any* tenant, entity_type_id, and entity_id, querying Transactions SHALL return only transactions matching all three criteria.
**Validates: Requirements 3.4**

### Property 11: Transaction Multi-Entity Support
*For any* entity type in EntityRegistry, creating a Transaction with that entity_type_id SHALL succeed and be retrievable.
**Validates: Requirements 3.5**

### Property 12: Multi-Tenant Isolation for EmailThread
*For any* two different tenants, querying EmailThreads for one tenant SHALL never return threads from the other tenant.
**Validates: Requirements 4.1**

### Property 13: Multi-Tenant Isolation for Transaction
*For any* two different tenants, querying Transactions for one tenant SHALL never return transactions from the other tenant.
**Validates: Requirements 4.1**

### Property 14: Tenant ID Requirement
*For any* attempt to create an EmailThread or Transaction without tenant_id, the operation SHALL fail.
**Validates: Requirements 4.2**

### Property 15: Query Rejection Without Tenant ID
*For any* query to EmailThreads or Transactions without tenant_id filter, the system SHALL reject the query.
**Validates: Requirements 4.4**

### Property 16: EmailThreadService Entity Type Resolution
*For any* entity type code, EmailThreadService SHALL resolve it to the correct entity_type_id from EntityRegistry.
**Validates: Requirements 5.1**

### Property 17: TransactionService Entity Type Resolution
*For any* entity type code, TransactionService SHALL resolve it to the correct entity_type_id from EntityRegistry.
**Validates: Requirements 5.3**

### Property 18: Service Computed Property Availability
*For any* EmailThread or Transaction returned by a service method, the entity_type property SHALL be populated and accessible.
**Validates: Requirements 5.5, 7.3**

### Property 19: Backward Compatibility - Lead ID Query
*For any* existing EmailThread with lead_id set, querying by lead_id SHALL still return the thread during transition period.
**Validates: Requirements 6.1**

### Property 20: Lead ID Column Persistence
*For any* EmailThread after migration, the lead_id column SHALL exist and contain the original value if it was set.
**Validates: Requirements 6.4**

## Error Handling

### Invalid Entity Type ID
- **Scenario**: Attempting to create EmailThread or Transaction with non-existent entity_type_id
- **Response**: Database constraint violation (FOREIGN KEY constraint)
- **User Impact**: API returns 400 Bad Request with message: "Invalid entity_type_id"

### Missing Tenant ID
- **Scenario**: Attempting to create EmailThread or Transaction without tenant_id
- **Response**: Validation error in service layer
- **User Impact**: API returns 400 Bad Request with message: "tenant_id is required"

### Cross-Tenant Data Access
- **Scenario**: Attempting to query EmailThreads or Transactions for a different tenant
- **Response**: Query returns empty result set
- **User Impact**: No data leakage; user sees no results

### Invalid Entity ID Format
- **Scenario**: Attempting to create EmailThread or Transaction with non-UUID entity_id
- **Response**: Validation error in service layer
- **User Impact**: API returns 400 Bad Request with message: "entity_id must be a valid UUID"

### Migration Data Loss
- **Scenario**: Migration fails partway through
- **Response**: Transaction rollback; database returns to pre-migration state
- **User Impact**: No data loss; migration can be retried

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

1. **EntityRegistry Tests**
   - Verify EntityRegistry contains all expected entity types
   - Test unique constraint on code column
   - Test that querying returns consistent results

2. **EmailThread Entity Tests**
   - Test creating EmailThread with valid entity_type_id
   - Test computed entity_type property
   - Test that lead_id column still works for backward compatibility
   - Test that entity_type_id is required

3. **Transaction Entity Tests**
   - Test creating Transaction with valid entity_type_id
   - Test computed entity_type property
   - Test that entity_type_id is required

4. **EmailThreadService Tests**
   - Test createThread with entity_type_id
   - Test getThreadsByEntity with entity_type_id and entity_id
   - Test that service resolves entity type codes to IDs
   - Test multi-tenant isolation
   - Test error handling for invalid entity_type_id

5. **TransactionService Tests**
   - Test createTransaction with entity_type_id
   - Test getTransactionsByEntity with entity_type_id and entity_id
   - Test that service resolves entity type codes to IDs
   - Test multi-tenant isolation
   - Test error handling for invalid entity_type_id

6. **Migration Tests**
   - Test that existing EmailThread data is preserved
   - Test that entity_type strings are mapped to entity_type_id
   - Test that lead_id column remains
   - Test that all threads have valid entity_type_id after migration

### Property-Based Testing

Property-based tests verify universal properties across all inputs using randomization:

1. **Property 1: EntityRegistry Uniqueness**
   - Generate random EntityRegistry entries
   - Verify all codes are unique
   - Verify all names are non-empty

2. **Property 3: EmailThread Entity Type ID Acceptance**
   - Generate random valid entity_type_id values from EntityRegistry
   - Generate random UUID entity_id values
   - Create EmailThreads with these values
   - Verify both values are stored correctly

3. **Property 4: EmailThread Computed Property**
   - Generate random EmailThreads
   - Load them from database
   - Verify computed entity_type matches EntityRegistry code

4. **Property 5: EmailThread Entity Query Specificity**
   - Generate random EmailThreads for different entities
   - Query by entity_type_id and entity_id
   - Verify only matching threads are returned

5. **Property 8: Transaction Entity Type ID Acceptance**
   - Generate random valid entity_type_id values from EntityRegistry
   - Generate random UUID entity_id values
   - Create Transactions with these values
   - Verify both values are stored correctly

6. **Property 9: Transaction Computed Property**
   - Generate random Transactions
   - Load them from database
   - Verify computed entity_type matches EntityRegistry code

7. **Property 10: Transaction Entity Query Specificity**
   - Generate random Transactions for different entities
   - Query by entity_type_id and entity_id
   - Verify only matching transactions are returned

8. **Property 12: Multi-Tenant Isolation for EmailThread**
   - Generate random EmailThreads for different tenants
   - Query for one tenant
   - Verify no threads from other tenants are returned

9. **Property 13: Multi-Tenant Isolation for Transaction**
   - Generate random Transactions for different tenants
   - Query for one tenant
   - Verify no transactions from other tenants are returned

10. **Property 14: Tenant ID Requirement**
    - Attempt to create EmailThread without tenant_id
    - Attempt to create Transaction without tenant_id
    - Verify both operations fail

### Test Configuration

- **Minimum iterations per property test**: 100
- **Test framework**: Jest with fast-check for property-based testing
- **Coverage target**: 90% code coverage
- **Continuous integration**: All tests run on every commit

