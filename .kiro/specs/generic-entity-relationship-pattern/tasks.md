# Implementation Tasks: Generic Entity Relationship Pattern Refactoring

## Task 1: Refactor EmailThread Entity to Use EntityRegistry Pattern
- [x] 1.1 Update EmailThread entity to include entity_type_id FK to EntityRegistry
- [x] 1.2 Add computed entity_type property derived from entity_type_id relationship
- [x] 1.3 Keep lead_id column for backward compatibility
- [x] 1.4 Create migration to add entity_type_id column and populate from existing data
- [x] 1.5 Update EmailThread indexes to include entity_type_id

## Task 2: Create Transaction Entity with Generic Pattern
- [x] 2.1 Create Transaction entity with entity_type_id FK to EntityRegistry
- [x] 2.2 Add computed entity_type property derived from entity_type_id relationship
- [x] 2.3 Create migration to create transactions table
- [x] 2.4 Create proper indexes on tenant_id, entity_type_id, entity_id

## Task 3: Refactor EmailThreadService to Use New Pattern
- [x] 3.1 Update createThread to accept entity_type_id instead of entity_type string
- [x] 3.2 Update getThreadsByEntity to use entity_type_id and entity_id
- [x] 3.3 Update getAllThreads to filter by entity_type_id
- [x] 3.4 Add helper method to resolve entity type code to entity_type_id
- [x] 3.5 Ensure all queries include tenant_id for multi-tenant isolation

## Task 4: Create TransactionService with Generic Pattern
- [x] 4.1 Create TransactionService with createTransaction method
- [x] 4.2 Implement getTransactionsByEntity using entity_type_id and entity_id
- [x] 4.3 Implement getAllTransactions with filtering
- [x] 4.4 Add helper method to resolve entity type code to entity_type_id
- [x] 4.5 Ensure all queries include tenant_id for multi-tenant isolation

## Task 5: Create TransactionModule and Register in AppModule
- [x] 5.1 Create TransactionModule with TypeOrmModule imports
- [x] 5.2 Import TransactionModule into AppModule
- [x] 5.3 Verify module compiles without errors

## Task 6: Update EmailThreadController to Use New Service Interface
- [x] 6.1 Update createThread endpoint to accept entity_type_id
- [x] 6.2 Update getThreadsByEntity endpoint to use entity_type_id
- [x] 6.3 Update getAllThreads endpoint to filter by entity_type_id
- [ ] 6.4 Test backward compatibility with existing endpoints

## Task 7: Create TransactionController with New Pattern
- [x] 7.1 Create TransactionController with CRUD endpoints
- [x] 7.2 Implement POST /api/tenant/transactions for creating transactions
- [x] 7.3 Implement GET /api/tenant/transactions for listing
- [x] 7.4 Implement GET /api/tenant/transactions/:id for details
- [x] 7.5 Implement PUT /api/tenant/transactions/:id for updates
- [x] 7.6 Implement DELETE /api/tenant/transactions/:id for deletion
- [x] 7.7 Add permission guards to all endpoints

## Task 8: Create Permission Setup Scripts
- [x] 8.1 Create script to add Transaction permissions to Admin role
- [x] 8.2 Execute script to verify permissions are created
- [ ] 8.3 Verify EmailThread permissions still work after refactoring

## Task 9: Create Sample Data Scripts
- [ ] 9.1 Create script to generate sample transactions for testing
- [ ] 9.2 Execute script to populate test data
- [ ] 9.3 Verify sample data is created correctly

## Task 10: Write Unit Tests for EmailThread Refactoring
- [ ] 10.1 Test EmailThread entity with entity_type_id
- [ ] 10.2 Test computed entity_type property
- [ ] 10.3 Test EmailThreadService with new interface
- [ ] 10.4 Test backward compatibility with lead_id
- [ ] 10.5 Test multi-tenant isolation

## Task 11: Write Unit Tests for Transaction Entity and Service
- [ ] 11.1 Test Transaction entity creation
- [ ] 11.2 Test computed entity_type property
- [ ] 11.3 Test TransactionService methods
- [ ] 11.4 Test multi-tenant isolation
- [ ] 11.5 Test error handling for invalid entity_type_id

## Task 12: Write Property-Based Tests
- [ ] 12.1 Property test: EntityRegistry uniqueness
- [ ] 12.2 Property test: EmailThread entity type ID acceptance
- [ ] 12.3 Property test: EmailThread computed property consistency
- [ ] 12.4 Property test: EmailThread query specificity
- [ ] 12.5 Property test: Transaction entity type ID acceptance
- [ ] 12.6 Property test: Transaction computed property consistency
- [ ] 12.7 Property test: Transaction query specificity
- [ ] 12.8 Property test: Multi-tenant isolation for both entities
- [ ] 12.9 Property test: Tenant ID requirement enforcement

## Task 13: Integration Testing
- [ ] 13.1 Test creating EmailThread with new pattern
- [ ] 13.2 Test querying EmailThreads by entity
- [ ] 13.3 Test creating Transaction with new pattern
- [ ] 13.4 Test querying Transactions by entity
- [ ] 13.5 Test cross-entity queries (e.g., all transactions for a contract)
- [ ] 13.6 Test multi-tenant isolation end-to-end

## Task 14: Migration and Data Preservation
- [x] 14.1 Execute EmailThread migration
- [ ] 14.2 Verify all existing EmailThread data is preserved
- [x] 14.3 Verify entity_type_id is correctly populated
- [ ] 14.4 Verify lead_id column still exists
- [ ] 14.5 Test backward compatibility queries

## Task 15: Documentation and Cleanup
- [ ] 15.1 Update API documentation for new endpoints
- [ ] 15.2 Document entity_type_id pattern for future developers
- [ ] 15.3 Remove any deprecated code references
- [ ] 15.4 Create migration guide for other modules to adopt pattern
- [ ] 15.5 Final verification that all tests pass
