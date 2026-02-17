# Requirements Document: Generic Entity Relationship Pattern Refactoring

## Introduction

This feature refactors the system to use a clean, scalable generic entity relationship pattern across all modules. Currently, EmailThread uses hardcoded entity_type strings and numeric lead IDs, creating confusion and limiting scalability. This refactoring introduces a proper EntityRegistry-based pattern where entity_type_id serves as a foreign key to EntityRegistry, enabling support for any entity type (Lead, Contract, Customer, Property, etc.) while maintaining multi-tenant isolation.

## Glossary

- **EntityRegistry**: A lookup table that defines all entity types in the system (Lead, Contract, Customer, Property, etc.)
- **entity_type_id**: Foreign key to EntityRegistry, identifies the type of entity being referenced
- **entity_id**: UUID of the specific entity instance (e.g., a specific Lead's UUID)
- **entity_type**: Computed property derived from entity_type_id relationship, returns the entity type name
- **EmailThread**: System for managing email conversations linked to entities
- **Transaction**: Financial record of payments or transactions linked to entities
- **Multi-tenant isolation**: Ensuring data from different tenants is completely separated
- **Backward compatibility**: Maintaining existing functionality while transitioning to new pattern

## Requirements

### Requirement 1: Establish EntityRegistry as the Single Source of Truth

**User Story:** As a system architect, I want EntityRegistry to be the authoritative source for all entity types, so that the system can support any entity type consistently.

#### Acceptance Criteria

1. THE EntityRegistry SHALL contain entries for all entity types (Lead, Contract, Customer, Property, etc.)
2. WHEN a new entity type is needed, THE system SHALL add it to EntityRegistry before using it
3. THE EntityRegistry entry SHALL have a unique code (e.g., "lead", "contract") and a display name
4. WHERE EntityRegistry is queried, THE system SHALL return consistent results across all modules

### Requirement 2: Refactor EmailThread to Use EntityRegistry Pattern

**User Story:** As a developer, I want EmailThread to use entity_type_id instead of hardcoded entity_type strings, so that it can support any entity type and maintain data consistency.

#### Acceptance Criteria

1. WHEN an EmailThread is created, THE system SHALL accept entity_type_id (FK to EntityRegistry) instead of entity_type string
2. WHEN an EmailThread is created, THE system SHALL accept entity_id as a UUID of the specific entity instance
3. THE EmailThread entity_type property SHALL be computed from the entity_type_id relationship
4. WHEN querying EmailThreads by entity, THE system SHALL use entity_type_id and entity_id for lookups
5. WHEN an EmailThread is retrieved, THE system SHALL include the computed entity_type property
6. THE EmailThread migration SHALL preserve existing data by mapping hardcoded entity_type strings to EntityRegistry IDs

### Requirement 3: Create Transaction/Payment Entity Using Clean Pattern

**User Story:** As a developer, I want the Payment/Transaction system to use the generic entity relationship pattern from the start, so that it can support any entity type without future refactoring.

#### Acceptance Criteria

1. WHEN a Transaction is created, THE system SHALL accept entity_type_id (FK to EntityRegistry) instead of hardcoded entity types
2. WHEN a Transaction is created, THE system SHALL accept entity_id as a UUID of the specific entity instance
3. THE Transaction entity_type property SHALL be computed from the entity_type_id relationship
4. WHEN querying Transactions by entity, THE system SHALL use entity_type_id and entity_id for lookups
5. THE Transaction entity SHALL support any entity type (Contract, Customer, Property, etc.)
6. THE Transaction migration SHALL create the table with proper foreign key constraints

### Requirement 4: Maintain Multi-Tenant Isolation

**User Story:** As a system administrator, I want multi-tenant isolation to be enforced at the database level, so that tenant data remains completely separated.

#### Acceptance Criteria

1. WHEN querying EmailThreads or Transactions, THE system SHALL always filter by tenant_id
2. WHEN creating EmailThreads or Transactions, THE system SHALL require tenant_id
3. THE database indexes SHALL include tenant_id for all queries
4. IF a query attempts to access data without tenant_id, THEN the system SHALL reject it

### Requirement 5: Update Services to Work with New Structure

**User Story:** As a developer, I want services to work seamlessly with the new entity relationship pattern, so that business logic remains clean and maintainable.

#### Acceptance Criteria

1. WHEN EmailThreadService creates a thread, THE system SHALL resolve entity_type_id from EntityRegistry
2. WHEN EmailThreadService queries threads, THE system SHALL use entity_type_id and entity_id
3. WHEN TransactionService creates a transaction, THE system SHALL resolve entity_type_id from EntityRegistry
4. WHEN TransactionService queries transactions, THE system SHALL use entity_type_id and entity_id
5. THE services SHALL provide computed entity_type property to consumers

### Requirement 6: Ensure Backward Compatibility Where Possible

**User Story:** As a system maintainer, I want the transition to be smooth with minimal disruption, so that existing functionality continues to work.

#### Acceptance Criteria

1. WHEN existing code queries EmailThreads by lead_id, THE system SHALL continue to work during transition period
2. WHEN the migration runs, THE system SHALL preserve all existing EmailThread data
3. WHEN the migration runs, THE system SHALL map existing entity_type strings to EntityRegistry entries
4. THE old lead_id column SHALL be deprecated but remain in the database during transition

### Requirement 7: Support Computed Properties for Entity Type

**User Story:** As a developer, I want entity_type to be automatically computed from entity_type_id, so that I don't have to manually manage this relationship.

#### Acceptance Criteria

1. WHEN an EmailThread is loaded, THE entity_type property SHALL be automatically populated from the entity_type_id relationship
2. WHEN a Transaction is loaded, THE entity_type property SHALL be automatically populated from the entity_type_id relationship
3. THE computed entity_type SHALL be available in API responses without additional queries
4. THE computed entity_type SHALL be consistent with the EntityRegistry entry

