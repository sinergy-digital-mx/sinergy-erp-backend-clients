# Implementation Plan: Purchase Orders System

## Overview

This implementation plan breaks down the Purchase Orders System into discrete, incremental coding tasks. Each task builds on previous steps, with property-based tests integrated throughout to catch errors early. The system follows the MODULE_STANDARD.md patterns for NestJS, TypeORM, and RBAC integration, with AWS S3 integration for document management.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure: `src/api/purchase-orders/`, `src/entities/purchase-orders/`, `src/database/migrations/`
  - Define core TypeScript interfaces and types for PurchaseOrder, LineItem, Payment, and Document entities
  - Set up testing framework configuration
  - Configure AWS S3 client for document management
  - _Requirements: 1.1, 1.2, 5.1_

- [x] 2. Create Purchase Order entity and database migration
  - [x] 2.1 Implement PurchaseOrder entity with all fields
    - Include UUID primary key, tenant_id foreign key, timestamps, and indexes
    - Add enum columns for status and payment_status
    - Include all header, payment, and totals fields
    - Define relationships to LineItem, Payment, and Document entities
    - _Requirements: 1.1, 1.2, 4.1_
  
  - [ ]* 2.2 Write property test for Purchase Order entity creation
    - **Property 1: Purchase Order Header Storage**
    - **Validates: Requirements 1.1, 1.4**
  
  - [x] 2.3 Create database migration for purchase_orders table
    - Define all columns with proper types and constraints
    - Create indexes on tenant_id, status, vendor_id, and warehouse_id
    - Add foreign key constraint to rbac_tenants
    - _Requirements: 1.1, 1.2_

- [x] 3. Create Line Item entity and database migration
  - [x] 3.1 Implement LineItem entity with all fields
    - Include UUID primary key, purchase_order_id foreign key, timestamps
    - Add decimal columns for quantity, prices, and tax calculations
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.2 Create database migration for line_items table
    - Define all columns with proper types and constraints
    - Create index on purchase_order_id
    - Add foreign key constraint to purchase_orders
    - _Requirements: 2.1_

- [x] 4. Create Payment and Document entities and migrations
  - [x] 4.1 Implement Payment entity with all fields
    - Include UUID primary key, purchase_order_id foreign key, timestamps
    - Add decimal columns for payment amounts
    - _Requirements: 4.2_
  
  - [x] 4.2 Create database migration for payments table
    - Define all columns with proper types and constraints
    - Create index on purchase_order_id
    - Add foreign key constraint to purchase_orders
    - _Requirements: 4.2_
  
  - [x] 4.3 Implement Document entity with all fields
    - Include UUID primary key, purchase_order_id foreign key, timestamps
    - Add columns for S3 metadata (s3_key, s3_url)
    - _Requirements: 5.1, 5.2_
  
  - [x] 4.4 Create database migration for documents table
    - Define all columns with proper types and constraints
    - Create index on purchase_order_id
    - Add foreign key constraint to purchase_orders
    - _Requirements: 5.1_

- [x] 5. Create DTOs for Purchase Order operations
  - [x] 5.1 Implement CreatePurchaseOrderDto with validation
    - Add validators for vendor_id, warehouse_id, and dates
    - Include all required header fields
    - _Requirements: 1.1, 9.1, 9.2_
  
  - [x] 5.2 Implement UpdatePurchaseOrderDto with validation
    - Make all fields optional
    - Include same validators as CreatePurchaseOrderDto
    - _Requirements: 1.3_
  
  - [x] 5.3 Implement CreateLineItemDto with validation
    - Add validators for product_id, quantity, unit_price, and tax percentages
    - _Requirements: 2.1, 2.2, 9.3_
  
  - [x] 5.4 Implement RecordPaymentDto with validation
    - Add validators for payment_date, payment_amount, and payment_method
    - _Requirements: 4.2_
  
  - [x] 5.5 Implement CancelPurchaseOrderDto with validation
    - Add validator for cancellation_reason
    - _Requirements: 6.1_
  
  - [x] 5.6 Implement QueryPurchaseOrderDto for search and pagination
    - Add vendor_id, status, and date range filters
    - Include pagination validation (min/max limits)
    - _Requirements: 1.5_

- [x] 6. Create TaxCalculationService for IVA and IEPS calculations
  - [x] 6.1 Implement calculateLineItemTotals() method
    - Calculate subtotal from quantity and unit_price
    - Calculate IVA and IEPS amounts based on percentages
    - Calculate line total
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 6.2 Write property test for line item calculations
    - **Property 5: Line Item Subtotal Calculation**
    - **Property 6: IVA and IEPS Calculation**
    - **Property 7: Line Item Total Calculation**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [x] 6.3 Implement calculateOrderTotals() method
    - Sum all line item subtotals, IVA, IEPS, and totals
    - Return order-level totals
    - _Requirements: 2.4_
  
  - [ ]* 6.4 Write property test for order totals calculation
    - **Property 8: Order Totals Calculation**
    - **Validates: Requirements 2.4**

- [x] 7. Create PurchaseOrderService with core business logic
  - [x] 7.1 Implement create() method
    - Validate vendor_id and warehouse_id exist
    - Set default status to 'En Proceso'
    - Set default payment_status to 'No pagado'
    - Store tenant_id from context
    - Initialize totals to zero
    - _Requirements: 1.1, 3.1, 4.1, 9.1, 9.2_
  
  - [ ]* 7.2 Write property test for Purchase Order creation
    - **Property 2: UUID and Timestamp Generation**
    - **Validates: Requirements 1.2**
  
  - [x] 7.3 Implement findAll() method with pagination and filtering
    - Support search by vendor_id, status, and date range
    - Implement pagination with page/limit validation
    - Filter by tenant_id
    - _Requirements: 1.5, 7.2_
  
  - [ ]* 7.4 Write property test for search and pagination
    - **Property 4: Search and Pagination**
    - **Validates: Requirements 1.5**
  
  - [x] 7.5 Implement findOne() method
    - Verify PO belongs to tenant
    - Return 404 if not found
    - _Requirements: 1.4, 7.2_
  
  - [x] 7.6 Implement update() method
    - Verify PO belongs to tenant
    - Prevent updates to cancelled POs
    - Preserve created_at timestamp
    - Update updated_at timestamp
    - _Requirements: 1.3, 3.5, 7.3_
  
  - [ ]* 7.7 Write property test for timestamp preservation
    - **Property 3: Timestamp Preservation on Update**
    - **Validates: Requirements 1.3**
  
  - [x] 7.8 Implement remove() method
    - Verify PO belongs to tenant
    - Delete PO record (cascade delete line items, payments, documents)
    - _Requirements: 7.3, 5.5_

- [x] 8. Create LineItemService with line item operations
  - [x] 8.1 Implement addLineItem() method
    - Validate product_id exists
    - Verify PO is not cancelled
    - Calculate line item totals using TaxCalculationService
    - Recalculate order totals
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5, 9.3_
  
  - [x] 8.2 Implement editLineItem() method
    - Verify PO is not cancelled
    - Recalculate line item totals
    - Recalculate order totals
    - _Requirements: 2.5, 3.5_
  
  - [ ]* 8.3 Write property test for line item edit recalculation
    - **Property 9: Line Item Edit Recalculation**
    - **Validates: Requirements 2.5**
  
  - [x] 8.4 Implement removeLineItem() method
    - Verify PO is not cancelled
    - Delete line item
    - Recalculate order totals
    - _Requirements: 2.6, 3.5_
  
  - [ ]* 8.5 Write property test for line item removal recalculation
    - **Property 10: Line Item Removal Recalculation**
    - **Validates: Requirements 2.6**

- [x] 9. Create PaymentService with payment operations
  - [x] 9.1 Implement recordPayment() method
    - Verify PO is not cancelled
    - Store payment information
    - Calculate payment_status based on payment_amount vs grand_total
    - Calculate remaining_amount
    - Update PO payment fields
    - _Requirements: 4.2, 4.3, 4.4, 4.6_
  
  - [ ]* 9.2 Write property test for payment status calculation
    - **Property 18: Payment Status Calculation**
    - **Property 19: Remaining Amount Calculation**
    - **Validates: Requirements 4.3, 4.4**
  
  - [x] 9.3 Implement getPaymentInfo() method
    - Return complete payment information for a PO
    - _Requirements: 4.5_

- [x] 10. Create DocumentService with AWS S3 integration
  - [x] 10.1 Implement uploadDocument() method
    - Upload file to AWS S3
    - Generate secure S3 URL
    - Store document metadata in database
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 10.2 Write property test for document upload
    - **Property 22: Document Upload and Metadata Storage**
    - **Property 23: S3 URL Generation**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x] 10.3 Implement deleteDocument() method
    - Delete document from AWS S3
    - Delete document record from database
    - _Requirements: 5.3_
  
  - [ ]* 10.4 Write property test for document deletion
    - **Property 24: Document Deletion**
    - **Validates: Requirements 5.3**
  
  - [x] 10.5 Implement getDocuments() method
    - Return all documents for a PO with metadata and S3 URLs
    - _Requirements: 5.4_
  
  - [ ]* 10.6 Write property test for document retrieval
    - **Property 25: Document Retrieval with PO**
    - **Validates: Requirements 5.4**

- [x] 11. Implement status management
  - [x] 11.1 Implement updateStatus() method
    - Validate status transitions
    - Update status and record timestamp
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 11.2 Write property test for status transitions
    - **Property 11: Default Status is En Proceso**
    - **Property 12: Status Transitions**
    - **Property 13: Status Change Timestamp**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [x] 11.3 Implement cancelPurchaseOrder() method
    - Set status to 'Cancelada'
    - Record cancellation_date and cancellation_reason
    - Prevent further modifications
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 11.4 Write property test for cancellation
    - **Property 27: Cancellation Recording**
    - **Property 28: Cancelled PO Immutability (Comprehensive)**
    - **Property 29: Historical Data Preservation**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [x] 11.5 Implement status filtering in findAll()
    - Support filtering POs by status
    - _Requirements: 3.4_
  
  - [ ]* 11.6 Write property test for status filtering
    - **Property 14: Status Filtering**
    - **Property 30: Cancellation Filtering**
    - **Validates: Requirements 3.4, 6.4**

- [x] 12. Create PurchaseOrderController with API endpoints
  - [x] 12.1 Implement POST /tenant/purchase-orders endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Create'
    - Call PurchaseOrderService.create()
    - Return 201 Created with PO data
    - Document with Swagger decorators
    - _Requirements: 1.1, 8.1_
  
  - [x] 12.2 Implement GET /tenant/purchase-orders endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Read'
    - Call PurchaseOrderService.findAll() with query parameters
    - Return paginated results
    - Document with Swagger decorators
    - _Requirements: 1.5, 8.2_
  
  - [x] 12.3 Implement GET /tenant/purchase-orders/:id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Read'
    - Call PurchaseOrderService.findOne()
    - Return PO data or 404
    - Document with Swagger decorators
    - _Requirements: 1.4, 8.2_
  
  - [x] 12.4 Implement PUT /tenant/purchase-orders/:id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call PurchaseOrderService.update()
    - Return updated PO data
    - Document with Swagger decorators
    - _Requirements: 1.3, 8.3_
  
  - [x] 12.5 Implement DELETE /tenant/purchase-orders/:id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Delete'
    - Call PurchaseOrderService.remove()
    - Return 200 OK
    - Document with Swagger decorators
    - _Requirements: 8.4_

- [x] 13. Create LineItemController with API endpoints
  - [x] 13.1 Implement POST /tenant/purchase-orders/:id/line-items endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call LineItemService.addLineItem()
    - Return 201 Created with line item data
    - Document with Swagger decorators
    - _Requirements: 2.1, 8.3_
  
  - [x] 13.2 Implement PUT /tenant/purchase-orders/:po-id/line-items/:item-id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call LineItemService.editLineItem()
    - Return updated line item data
    - Document with Swagger decorators
    - _Requirements: 2.5, 8.3_
  
  - [x] 13.3 Implement DELETE /tenant/purchase-orders/:po-id/line-items/:item-id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call LineItemService.removeLineItem()
    - Return 200 OK
    - Document with Swagger decorators
    - _Requirements: 2.6, 8.3_

- [x] 14. Create PaymentController with API endpoints
  - [x] 14.1 Implement POST /tenant/purchase-orders/:id/payments endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call PaymentService.recordPayment()
    - Return 201 Created with payment data
    - Document with Swagger decorators
    - _Requirements: 4.2, 8.3_
  
  - [x] 14.2 Implement GET /tenant/purchase-orders/:id/payments endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Read'
    - Call PaymentService.getPaymentInfo()
    - Return payment information
    - Document with Swagger decorators
    - _Requirements: 4.5, 8.2_

- [x] 15. Create DocumentController with API endpoints
  - [x] 15.1 Implement POST /tenant/purchase-orders/:id/documents endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call DocumentService.uploadDocument()
    - Return 201 Created with document data
    - Document with Swagger decorators
    - _Requirements: 5.1, 8.3_
  
  - [x] 15.2 Implement GET /tenant/purchase-orders/:id/documents endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Read'
    - Call DocumentService.getDocuments()
    - Return all documents with metadata and S3 URLs
    - Document with Swagger decorators
    - _Requirements: 5.4, 8.2_
  
  - [x] 15.3 Implement DELETE /tenant/purchase-orders/:po-id/documents/:doc-id endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call DocumentService.deleteDocument()
    - Return 200 OK
    - Document with Swagger decorators
    - _Requirements: 5.3, 8.3_

- [x] 16. Create status management endpoints
  - [x] 16.1 Implement PUT /tenant/purchase-orders/:id/status endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call PurchaseOrderService.updateStatus()
    - Return updated PO data
    - Document with Swagger decorators
    - _Requirements: 3.2, 8.3_
  
  - [x] 16.2 Implement POST /tenant/purchase-orders/:id/cancel endpoint
    - Use @RequirePermissions decorator for 'purchase_orders:Update'
    - Call PurchaseOrderService.cancelPurchaseOrder()
    - Return cancelled PO data
    - Document with Swagger decorators
    - _Requirements: 6.1, 8.3_

- [x] 17. Implement tenant isolation and security
  - [x] 17.1 Verify tenant_id filtering in all queries
    - Ensure all service methods filter by tenant_id
    - Verify findOne() checks tenant ownership
    - Verify update() and remove() check tenant ownership
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 17.2 Write property test for tenant isolation in creation
    - **Property 31: Tenant Isolation in Creation**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 17.3 Write property test for tenant isolation in mutations
    - **Property 32: Tenant Isolation in Mutations**
    - **Validates: Requirements 7.3, 7.4**
  
  - [x] 17.4 Implement cascade delete on tenant deletion
    - Add TypeORM cascade delete configuration
    - Verify POs and documents are deleted when tenant is deleted
    - _Requirements: 7.5, 5.5_
  
  - [ ]* 17.5 Write property test for cascade delete
    - **Property 33: Cascade Delete on Tenant Deletion**
    - **Validates: Requirements 7.5**

- [x] 18. Implement referential integrity validation
  - [x] 18.1 Implement vendor validation
    - Verify vendor_id references valid vendor before creating PO
    - Return 400 Bad Request if vendor not found
    - _Requirements: 9.1_
  
  - [x] 18.2 Implement warehouse validation
    - Verify warehouse_id references valid warehouse before creating PO
    - Return 400 Bad Request if warehouse not found
    - _Requirements: 9.2_
  
  - [x] 18.3 Implement product validation
    - Verify product_id references valid product before adding line item
    - Return 400 Bad Request if product not found
    - _Requirements: 9.3_
  
  - [x] 18.4 Implement user validation
    - Verify creator_id references valid user before creating PO
    - Return 400 Bad Request if user not found
    - _Requirements: 9.4_
  
  - [x] 18.5 Implement related entity information retrieval
    - Load vendor name, warehouse name, product details in PO queries
    - _Requirements: 9.5_

- [x] 19. Implement serialization and round-trip testing
  - [x] 19.1 Implement PO serialization to JSON
    - Ensure all fields, line items, payments, and documents are included
    - Maintain data type consistency
    - _Requirements: 10.1, 10.4_
  
  - [x] 19.2 Implement PO deserialization from JSON
    - Reconstruct PO object with all fields and relationships
    - Validate all fields are correctly typed
    - _Requirements: 10.2_
  
  - [ ]* 19.3 Write property test for serialization round trip
    - **Property 34: Purchase Order Serialization Round Trip**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 20. Create PurchaseOrderModule and wire dependencies
  - [x] 20.1 Create purchase-orders.module.ts
    - Import TypeOrmModule with all entities (PurchaseOrder, LineItem, Payment, Document)
    - Import RBACModule for permission checking
    - Register all services as providers
    - Register all controllers
    - Export services for use by other modules
    - _Requirements: 1.1, 4.1, 8.1_

- [x] 21. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Verify no compilation errors
  - Ask the user if questions arise

- [x] 22. Create integration tests
  - [x]* 22.1 Write integration test for complete PO lifecycle
    - Create PO with header information
    - Add multiple line items with tax calculations
    - Record payment information
    - Upload documents
    - Update PO status
    - Verify all operations succeed
    - _Requirements: 1.1, 2.1, 4.2, 5.1, 3.2_
  
  - [x]* 22.2 Write integration test for line item operations
    - Add line items to PO
    - Edit line items and verify recalculation
    - Remove line items and verify recalculation
    - Verify order totals are correct
    - _Requirements: 2.1, 2.5, 2.6, 2.4_
  
  - [x]* 22.3 Write integration test for payment tracking
    - Record full payment and verify status is 'Pagada'
    - Record partial payment and verify status is 'Parcial'
    - Verify remaining_amount calculation
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x]* 22.4 Write integration test for document management
    - Upload documents to PO
    - Verify S3 storage and URL generation
    - Delete documents and verify removal from S3
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x]* 22.5 Write integration test for PO cancellation
    - Create PO with line items and payments
    - Cancel PO
    - Verify historical data is preserved
    - Attempt to modify cancelled PO (should fail)
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x]* 22.6 Write integration test for tenant isolation
    - Create POs for different tenants
    - Verify cross-tenant access is denied
    - Verify each tenant only sees their POs
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x]* 22.7 Write integration test for RBAC permissions
    - Test each permission (Create, Read, Update, Delete)
    - Verify operations are denied without permissions
    - Verify operations succeed with permissions
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x]* 22.8 Write integration test for referential integrity
    - Test vendor validation
    - Test warehouse validation
    - Test product validation
    - Test user validation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 23. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Verify API documentation is complete
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests are integrated throughout to catch errors early
- Checkpoints ensure incremental validation of functionality
- All code follows MODULE_STANDARD.md patterns for consistency
- RBAC integration uses @RequirePermissions decorator for all endpoints
- Tenant isolation is enforced at the service layer for all operations
- AWS S3 integration requires proper configuration and credentials
- Tax calculations use decimal precision to avoid floating-point errors
- Cascade deletes ensure data consistency when POs or tenants are deleted
