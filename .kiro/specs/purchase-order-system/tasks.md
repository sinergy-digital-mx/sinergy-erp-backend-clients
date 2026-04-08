# Implementation Plan: Purchase Order System

## Overview

This plan implements a complete purchase order management system with automatic batch generation and unit conversions. The implementation follows NestJS patterns with TypeORM entities, DTOs for validation, services for business logic, and controllers with /tenant/ prefixed routes. All database tables use the "inv_s_" prefix for inventory-specific structures.

## Tasks

- [x] 1. Create database migrations for purchase order tables
  - [x] 1.1 Create migration for inv_s_purchase_order_batch table
    - Create table with all columns: id, tenant_id, fiscal_configuration_id, warehouse_id, vendor_id, expected_delivery_date, payment_status, general_status, notes, audit fields
    - Add foreign key constraints to rbac_tenants, fiscal_configurations, warehouses, vendors
    - Add indexes for tenant_id, general_status, payment_status, vendor_id, warehouse_id, expected_delivery_date
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 1.2 Create migration for inv_s_purchase_order_batch_detail table
    - Create table with requested columns: id, purchase_order_batch_id, product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Add received_original columns: received_original_product_id, received_original_uom_id, received_original_quantity, received_original_unit_total, received_original_iva_percentage, received_original_iva_unit, received_original_ieps_percentage, received_original_ieps_unit
    - Add received_converted columns: received_converted_uom_id, received_converted_quantity
    - Add audit fields: created_by, created_at, updated_by, updated_at
    - Add foreign key constraints and indexes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 1.3 Create migration for inv_s_batches table
    - Create table with columns: id, tenant_id, batch_number, warehouse_id, product_id, uom_id, quantity, purchase_order_batch_id, purchase_order_detail_id, created_by, created_at
    - Add foreign key constraints to rbac_tenants, warehouses, products, uom_catalog, inv_s_purchase_order_batch, inv_s_purchase_order_batch_detail
    - Add unique constraint on (tenant_id, batch_number)
    - Add indexes for tenant_id, warehouse_id, product_id, batch_number, purchase_order_batch_id
    - _Requirements: 7.5, 7.6_
  
  - [x] 1.4 Create migration to add prefix column to warehouses table
    - Add prefix VARCHAR(10) NULL column after code column
    - Add index on prefix column
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Create TypeORM entities
  - [x] 2.1 Create PurchaseOrderBatch entity
    - Define entity class with @Entity('inv_s_purchase_order_batch') decorator
    - Add all columns with appropriate TypeORM decorators and types
    - Define relations to RBACTenant, FiscalConfiguration, Warehouse, Vendor
    - Define one-to-many relation to PurchaseOrderBatchDetail
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 2.2 Create PurchaseOrderBatchDetail entity
    - Define entity class with @Entity('inv_s_purchase_order_batch_detail') decorator
    - Add requested columns with decimal precision (12,3) for quantities and (12,2) for monetary values
    - Add received_original columns as nullable
    - Add received_converted columns as nullable
    - Define relations to PurchaseOrderBatch, Product, UoMCatalog
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.3 Create InventoryBatch entity
    - Define entity class with @Entity('inv_s_batches') decorator
    - Add all columns with appropriate types
    - Define relations to RBACTenant, Warehouse, Product, UoMCatalog, PurchaseOrderBatch, PurchaseOrderBatchDetail
    - _Requirements: 7.5, 7.6_
  
  - [x] 2.4 Update Warehouse entity to include prefix column
    - Add prefix column as nullable string with max length 10
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 3. Create DTOs for validation
  - [x] 3.1 Create CreatePurchaseOrderDto and CreateLineItemDto
    - Define CreatePurchaseOrderDto with fiscal_configuration_id, warehouse_id, vendor_id, expected_delivery_date, payment_status, notes, line_items
    - Define CreateLineItemDto with product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Add class-validator decorators: @IsUUID, @IsNotEmpty, @IsDateString, @IsEnum, @IsString, @IsOptional, @IsArray, @ValidateNested, @IsNumber, @Min, @Max
    - Use @Type(() => CreateLineItemDto) for nested validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  
  - [x] 3.2 Create ReceivePurchaseOrderDto and ReceivedLineItemDto
    - Define ReceivePurchaseOrderDto with received_items array
    - Define ReceivedLineItemDto with line_item_id, product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Add class-validator decorators for all fields
    - _Requirements: 6.1, 6.2_
  
  - [x] 3.3 Create UpdateLineItemDto
    - Define DTO with optional fields: unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Add class-validator decorators with @IsOptional
    - _Requirements: 10.1_
  
  - [x] 3.4 Create QueryPurchaseOrderDto
    - Define DTO with optional filters: general_status, payment_status, vendor_id, page, limit
    - Add class-validator decorators with @IsOptional, @IsEnum, @IsUUID, @IsInt, @Min, @Max
    - Use @Type(() => Number) for numeric query parameters
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Implement UnitConversionService
  - [x] 4.1 Create UnitConversionService with TypeORM repository injection
    - Inject ProductUom repository
    - Implement getConversionFactor(productUomId) method to retrieve factor from product_uoms table
    - Implement getBaseUom(productId) method to find UOM where is_base = true
    - Implement convertToBaseUnit(quantity, productUomId) method that multiplies quantity by conversion factor
    - _Requirements: 6.3, 6.4_
  
  - [ ]*  4.2 Write property test for unit conversion
    - **Property 1: Conversion to base unit is always positive**
    - **Validates: Requirements 6.3**
    - Test that for any positive quantity and valid product_uom_id, convertToBaseUnit returns a positive number
  
  - [ ]* 4.3 Write property test for conversion factor retrieval
    - **Property 2: Conversion factor is always positive**
    - **Validates: Requirements 6.3**
    - Test that getConversionFactor always returns a positive number for valid product_uom_id

- [ ] 5. Implement BatchNumberGenerator service
  - [x] 5.1 Create BatchNumberGenerator with TypeORM repository injection
    - Inject Warehouse repository
    - Create sequence tracking mechanism (can use database table or in-memory with locks)
    - Implement generateBatchNumber(warehouseId, tenantId) method
    - Retrieve warehouse prefix from warehouses table, default to "WH" if null
    - Generate auto-incrementing number scoped to tenant
    - Format as {prefix}-LOTE-{number} with 6-digit zero-padding
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.4_
  
  - [ ]* 5.2 Write property test for batch number format
    - **Property 3: Batch numbers always match format pattern**
    - **Validates: Requirements 7.1, 7.4**
    - Test that generated batch numbers always match regex pattern: ^[A-Z0-9]+-LOTE-\d{6}$
  
  - [ ]* 5.3 Write property test for batch number uniqueness
    - **Property 4: Batch numbers are unique within tenant**
    - **Validates: Requirements 7.3**
    - Test that consecutive calls to generateBatchNumber for same tenant produce different numbers

- [ ] 6. Implement VendorProductsService
  - [x] 6.1 Create VendorProductsService with repository injection
    - Inject Product, ProductUom, ProductVendorCost repositories
    - Implement getVendorProducts(vendorId, tenantId) method
    - Query products associated with vendor_id
    - For each product, join product_uoms to get all UOM configurations
    - For each product_uom, join product_vendor_costs to get pricing
    - Return structured response with product details, UOMs, costs, tax information, and conversion factors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 6.2 Write unit tests for VendorProductsService
    - Test getVendorProducts returns correct structure
    - Test filtering by vendor_id
    - Test inclusion of all UOM configurations
    - Test cost and tax calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Implement PurchaseOrderService core methods
  - [x] 7.1 Create PurchaseOrderService with repository and service injection
    - Inject PurchaseOrderBatch, PurchaseOrderBatchDetail, InventoryBatch repositories
    - Inject BatchNumberGenerator and UnitConversionService
    - Set up transaction management with TypeORM QueryRunner
    - _Requirements: All_
  
  - [ ] 7.2 Implement create(dto, tenantId, userId) method
    - Validate fiscal_configuration_id, warehouse_id, vendor_id exist
    - Create PurchaseOrderBatch with general_status = 'Creada'
    - Set payment_status from dto or default to 'Pendiente'
    - Create PurchaseOrderBatchDetail records for each line item
    - Initialize received_original and received_converted fields as null
    - Set created_by and created_at audit fields
    - Use transaction to ensure atomicity
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 7.3 Implement findAll(tenantId, filters) method
    - Query PurchaseOrderBatch filtered by tenant_id
    - Apply optional filters: general_status, payment_status, vendor_id
    - Include relations: fiscal_configuration, warehouse, vendor
    - Implement pagination with page and limit parameters
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 7.4 Implement findOne(id, tenantId) method
    - Query PurchaseOrderBatch by id and tenant_id
    - Include relations: fiscal_configuration, warehouse, vendor, line_items
    - For each line_item, include relations: product, uom, received_product, received_uom, converted_uom
    - Return complete purchase order with all details
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Implement PurchaseOrderService receiving logic
  - [ ] 8.1 Implement receive(id, receivedData, tenantId, userId) method
    - Validate purchase order exists and belongs to tenant
    - For each received line item, update corresponding PurchaseOrderBatchDetail
    - Set received_original fields: product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Call UnitConversionService.convertToBaseUnit to calculate received_converted_quantity
    - Call UnitConversionService.getBaseUom to get received_converted_uom_id
    - Update purchase order general_status to 'Recibida'
    - Set updated_by and updated_at audit fields
    - Use transaction to ensure atomicity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 8.2 Implement batch creation within receive method
    - For each received line item, call BatchNumberGenerator.generateBatchNumber
    - Create InventoryBatch record with generated batch_number
    - Set warehouse_id from purchase order
    - Set product_id from received_original_product_id
    - Set uom_id from received_converted_uom_id
    - Set quantity from received_converted_quantity
    - Link to purchase_order_batch_id and purchase_order_detail_id
    - Set created_by and created_at audit fields
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 8.3 Write integration tests for receive workflow
    - Test complete receive flow from purchase order to inventory batch creation
    - Test unit conversion is applied correctly
    - Test batch number generation
    - Test vendor substitution (different product received)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 9. Implement PurchaseOrderService additional methods
  - [ ] 9.1 Implement cancel(id, tenantId, userId) method
    - Validate purchase order exists and belongs to tenant
    - Check general_status is 'Creada'
    - If not 'Creada', throw BadRequestException with descriptive message
    - Update general_status to 'Cancelada'
    - Set updated_by and updated_at audit fields
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 9.2 Implement updateLineItem(orderId, lineItemId, dto, tenantId, userId) method
    - Validate purchase order exists and belongs to tenant
    - Validate line item exists and belongs to purchase order
    - Check purchase order general_status is 'Creada'
    - If not 'Creada', throw BadRequestException with descriptive message
    - Update line item fields: unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
    - Set updated_by and updated_at audit fields
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 9.3 Write unit tests for cancel and updateLineItem
    - Test cancel succeeds when status is 'Creada'
    - Test cancel fails when status is not 'Creada'
    - Test updateLineItem succeeds when status is 'Creada'
    - Test updateLineItem fails when status is not 'Creada'
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4_

- [ ] 10. Create PurchaseOrderController with /tenant/ prefix
  - [x] 10.1 Create controller with @Controller('tenant/purchase-orders') decorator
    - Apply JWT authentication guard
    - Inject PurchaseOrderService
    - Extract tenantId and userId from request context
    - _Requirements: 12.1, 12.2_
  
  - [ ] 10.2 Implement POST /tenant/purchase-orders endpoint
    - Use @Post() decorator
    - Accept CreatePurchaseOrderDto with @Body() decorator
    - Call purchaseOrderService.create(dto, tenantId, userId)
    - Return created purchase order with 201 status
    - _Requirements: 12.2_
  
  - [ ] 10.3 Implement GET /tenant/purchase-orders endpoint
    - Use @Get() decorator
    - Accept QueryPurchaseOrderDto with @Query() decorator
    - Call purchaseOrderService.findAll(tenantId, filters)
    - Return paginated list of purchase orders
    - _Requirements: 12.3_
  
  - [ ] 10.4 Implement GET /tenant/purchase-orders/:id endpoint
    - Use @Get(':id') decorator
    - Accept id with @Param('id') decorator
    - Call purchaseOrderService.findOne(id, tenantId)
    - Return purchase order details with line items
    - _Requirements: 12.4_
  
  - [ ] 10.5 Implement POST /tenant/purchase-orders/:id/receive endpoint
    - Use @Post(':id/receive') decorator
    - Accept id with @Param('id') and ReceivePurchaseOrderDto with @Body()
    - Call purchaseOrderService.receive(id, dto, tenantId, userId)
    - Return updated purchase order with generated batches
    - _Requirements: 12.5_
  
  - [ ] 10.6 Implement DELETE /tenant/purchase-orders/:id endpoint
    - Use @Delete(':id') decorator
    - Accept id with @Param('id') decorator
    - Call purchaseOrderService.cancel(id, tenantId, userId)
    - Return success message
    - _Requirements: 12.6_
  
  - [ ] 10.7 Implement PATCH /tenant/purchase-orders/:orderId/line-items/:lineItemId endpoint
    - Use @Patch(':orderId/line-items/:lineItemId') decorator
    - Accept orderId, lineItemId with @Param() and UpdateLineItemDto with @Body()
    - Call purchaseOrderService.updateLineItem(orderId, lineItemId, dto, tenantId, userId)
    - Return updated line item
    - _Requirements: 12.8_

- [ ] 11. Create VendorProductsController with /tenant/ prefix
  - [x] 11.1 Create controller with @Controller('tenant/vendors') decorator
    - Apply JWT authentication guard
    - Inject VendorProductsService
    - Extract tenantId from request context
    - _Requirements: 12.1, 12.7_
  
  - [ ] 11.2 Implement GET /tenant/vendors/:vendorId/products endpoint
    - Use @Get(':vendorId/products') decorator
    - Accept vendorId with @Param('vendorId') decorator
    - Call vendorProductsService.getVendorProducts(vendorId, tenantId)
    - Return list of products with UOMs and pricing
    - _Requirements: 12.7_

- [ ] 12. Create PurchaseOrderModule
  - [x] 12.1 Create module with @Module decorator
    - Import TypeOrmModule.forFeature with all entities: PurchaseOrderBatch, PurchaseOrderBatchDetail, InventoryBatch, Warehouse, Product, ProductUom, ProductVendorCost
    - Import AuthModule for JWT authentication
    - Declare controllers: PurchaseOrderController, VendorProductsController
    - Declare providers: PurchaseOrderService, VendorProductsService, BatchNumberGenerator, UnitConversionService
    - Export services for potential use by other modules
    - _Requirements: All_
  
  - [x] 12.2 Register PurchaseOrderModule in AppModule
    - Add PurchaseOrderModule to imports array in AppModule
    - _Requirements: All_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All endpoints use /tenant/ prefix as specified in Requirement 12
- Database tables use "inv_s_" prefix for inventory-specific structures
- Unit conversions always convert to base units for inventory tracking
- Batch numbers are auto-generated with warehouse-specific prefixes
- All operations are tenant-scoped for multi-tenancy support
- Transactions ensure data consistency during complex operations
