# Implementation Plan: Product System

## Overview

Implementation of a clean product management system with tenant-specific units of measure and product-specific UoM relationships. The system uses NestJS with TypeORM, following the existing project architecture with entities, repositories, services, and controllers organized by module. Each tenant defines their own UoMs, and the UI provides three distinct sections for managing UoM assignments and relationships.

## Tasks

- [x] 1. Create Product entity and repository
  - Create `src/entities/products/product.entity.ts` with fields: id, tenant_id, sku, name, description, created_at, updated_at
  - Add unique constraint on (tenant_id, sku)
  - Add indexes on tenant_id and sku
  - Create `src/api/products/repositories/product.repository.ts` with methods: create, findById, findBySku, findByTenant, update, delete
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create Unit of Measure (UoM) entity and repository
  - Create `src/entities/products/uom.entity.ts` with fields: id, tenant_id, code, name, created_at, updated_at
  - Add unique constraint on (tenant_id, code)
  - Add foreign key to Tenant with CASCADE delete
  - Create `src/api/products/repositories/uom.repository.ts` with methods: create, findById, findByTenant, update, delete
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Create UoM Relationship entity and repository
  - Create `src/entities/products/uom-relationship.entity.ts` with fields: id, product_id, source_uom_id, target_uom_id, conversion_factor, is_calculated, created_at, updated_at
  - Add unique constraint on (product_id, source_uom_id, target_uom_id)
  - Add check constraint: conversion_factor > 0
  - Add check constraint: source_uom_id != target_uom_id
  - Add foreign keys to Product and UoM with CASCADE delete
  - Create `src/api/products/repositories/uom-relationship.repository.ts` with methods: create, findById, findByProduct, delete
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Create Vendor Product Price entity and repository
  - Create `src/entities/products/vendor-product-price.entity.ts` with fields: id, vendor_id, product_id, uom_id, price, created_at, updated_at
  - Add unique constraint on (vendor_id, product_id, uom_id)
  - Add check constraint: price >= 0
  - Add foreign keys: vendor (CASCADE), product (CASCADE), uom (RESTRICT)
  - Create `src/api/products/repositories/vendor-product-price.repository.ts` with methods: create, findById, findByProduct, findByVendor, findByVendorProductUoM, update, delete, findByUoM
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement ProductService with validation
  - Create `src/api/products/services/product.service.ts`
  - Implement: createProduct (validate SKU uniqueness per tenant), getProduct, getProductBySku, updateProduct, deleteProduct, listProducts
  - Add validation: SKU not empty, SKU unique per tenant, name not empty
  - _Requirements: 1.5_

- [ ]* 5.1 Write property test for Product SKU uniqueness
  - **Property 1: Product SKU Uniqueness**
  - **Validates: Requirements 1.5**

- [x] 6. Implement UoMService with validation and conversion logic
  - Create `src/api/products/services/uom.service.ts`
  - Implement: createUoM (validate code uniqueness per tenant), getUoM, getUoMsByTenant, updateUoM, deleteUoM
  - Implement: createRelationship (validate conversion_factor > 0, same tenant, different UoMs), getRelationships, deleteRelationship
  - Implement: convertQuantity (traverse hierarchy, calculate equivalent quantity)
  - Add validation: code not empty, code unique per tenant, name not empty
  - Add check in deleteUoM: prevent deletion if referenced by vendor prices (throw UOM_IN_USE_BY_PRICE)
  - Add check in deleteUoM: prevent deletion if referenced by relationships (throw UOM_IN_USE_BY_RELATIONSHIP)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 5.1, 5.2_

- [ ]* 6.1 Write property test for UoM code uniqueness
  - **Property 2: UoM Code Uniqueness Within Tenant**
  - **Validates: Requirements 2.4**

- [ ]* 6.2 Write property test for UoM conversion round trip
  - **Property 3: UoM Conversion Round Trip**
  - **Validates: Requirements 3.8**

- [ ]* 6.3 Write property test for UoM deletion constraint with vendor prices
  - **Property 4: UoM Deletion Constraint - Vendor Prices**
  - **Validates: Requirements 5.1, 5.3**

- [ ]* 6.4 Write property test for UoM deletion constraint with relationships
  - **Property 5: UoM Deletion Constraint - Relationships**
  - **Validates: Requirements 5.2**

- [x] 7. Implement VendorProductPriceService with validation
  - Create `src/api/products/services/vendor-product-price.service.ts`
  - Implement: createPrice (validate UoM belongs to product, validate price >= 0), getPrice, getPricesByProduct, getPricesByVendor, getPriceByVendorProductUoM, updatePrice, deletePrice
  - Add validation: price >= 0, UoM belongs to product
  - _Requirements: 4.6, 4.7, 4.8_

- [ ]* 7.1 Write property test for vendor price UoM validity
  - **Property 6: Vendor Price UoM Validity**
  - **Validates: Requirements 4.6**

- [ ]* 7.2 Write property test for vendor price non-negativity
  - **Property 7: Vendor Price Non-Negative**
  - **Validates: Requirements 4.7**

- [x] 8. Create ProductController with REST endpoints
  - Create `src/api/products/controllers/product.controller.ts`
  - Implement endpoints:
    - POST /tenant/products (create product)
    - GET /tenant/products/:id (get product)
    - GET /tenant/products/sku/:sku (get product by SKU)
    - GET /tenant/products (list products with pagination)
    - PATCH /tenant/products/:id (update product)
    - DELETE /tenant/products/:id (delete product)
  - Add request/response DTOs with validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 9. Create UoMController with REST endpoints
  - Create `src/api/products/controllers/uom.controller.ts`
  - Implement endpoints:
    - POST /tenant/uoms (create UoM)
    - GET /tenant/uoms (list UoMs by tenant)
    - GET /tenant/uoms/:uomId (get UoM)
    - PATCH /tenant/uoms/:uomId (update UoM)
    - DELETE /tenant/uoms/:uomId (delete UoM with vendor_prices check)
    - POST /tenant/products/:productId/uom-relationships (create relationship)
    - GET /tenant/products/:productId/uom-relationships (list relationships)
    - DELETE /tenant/products/:productId/uom-relationships/:relationshipId (delete relationship)
    - POST /tenant/products/:productId/uom-convert (convert quantity between UoMs)
  - Add request/response DTOs with validation
  - Add error handling for UOM_IN_USE_BY_PRICE and UOM_IN_USE_BY_RELATIONSHIP
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 5.1, 5.2_

- [x] 10. Create VendorProductPriceController with REST endpoints
  - Create `src/api/products/controllers/vendor-product-price.controller.ts`
  - Implement endpoints:
    - POST /tenant/vendor-product-prices (create price)
    - GET /tenant/vendor-product-prices/:id (get price)
    - GET /tenant/products/:productId/vendor-prices (list prices by product)
    - GET /tenant/vendors/:vendorId/product-prices (list prices by vendor)
    - GET /tenant/vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId (get specific price)
    - PATCH /tenant/vendor-product-prices/:id (update price)
    - DELETE /tenant/vendor-product-prices/:id (delete price)
  - Add request/response DTOs with validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 11. Create ProductModule and wire components
  - Create `src/api/products/products.module.ts`
  - Register entities: Product, UoM, UoMRelationship, VendorProductPrice
  - Register repositories: ProductRepository, UoMRepository, UoMRelationshipRepository, VendorProductPriceRepository
  - Register services: ProductService, UoMService, VendorProductPriceService
  - Register controllers: ProductController, UoMController, VendorProductPriceController
  - Export services for use in other modules
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 12. Integrate ProductModule into AppModule
  - Import ProductModule in `src/app.module.ts`
  - Verify all entities are registered in TypeORM configuration
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 13. Create database migration
  - Create migration file in `src/database/migrations/` for all product system tables
  - Include: products, uoms, uom_relationships, vendor_product_prices tables
  - Include: all constraints, indexes, and foreign keys
  - Run migration: `npm run typeorm migration:run`
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 14. Add ProductSystem to module setup script
  - Update `src/database/scripts/setup-all-modules.ts` to include product system
  - Add module configuration: code='products', name='Product Management', entity='Product'
  - Create CRUD permissions for Product entity
  - Enable module for all tenants
  - Assign permissions to Admin roles
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 15. Implement UI: Create UoM section
  - Create component for creating new UoMs for the tenant
  - Display form with code and name fields
  - Implement POST /tenant/uoms to create UoM
  - Add validation: code not empty, code unique per tenant, name not empty
  - Add error handling and success messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 16. Implement UI: Asignar Unidades section (in product edit)
  - Create component for assigning UoMs to a product
  - Display dropdown of available UoMs from GET /tenant/uoms
  - Implement POST /tenant/products/{id}/uom-relationships to assign UoM
  - Add validation: prevent duplicate assignments
  - Add error handling and success messages
  - _Requirements: 2.6, 2.7, 2.8_

- [ ] 17. Implement UI: Unidades Asignadas section
  - Create component to display assigned UoMs for a product
  - Fetch data from GET /tenant/products/{id}/uom-relationships
  - Display UoM code and name
  - Implement delete button with validation
  - Add error handling for UOM_IN_USE_BY_PRICE and UOM_IN_USE_BY_RELATIONSHIP
  - Show helpful error messages suggesting to delete vendor prices or relationships first
  - _Requirements: 2.6, 2.7, 2.8, 5.1, 5.2_

- [ ] 18. Implement UI: Relaciones de Conversión section
  - Create component for managing UoM relationships
  - Display form to create new relationships with dropdowns for source and target UoMs
  - Implement POST /tenant/products/{id}/uom-relationships to create relationship
  - Add validation: both UoMs must be assigned, cannot be same UoM, factor > 0
  - Fetch relationships from GET /tenant/products/{id}/uom-relationships
  - Display table with explicit and calculated relationships
  - Mark calculated relationships as "Calculada" and prevent deletion
  - Implement delete button for explicit relationships only
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 19. Implement UI: Error handling and validation
  - Add comprehensive error handling for all API calls
  - Display user-friendly error messages for UOM_IN_USE_BY_PRICE and UOM_IN_USE_BY_RELATIONSHIP
  - Show validation errors for invalid inputs
  - Implement loading states and spinners
  - Add success notifications for completed actions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.5, 6.9, 6.10_

- [ ] 20. Implement UI: Integration with product edit form
  - Integrate the UoM management sections into the product edit modal/page
  - Ensure proper data flow between sections
  - Add save/cancel buttons
  - Implement proper state management
  - Test complete workflow: create UoMs → assign to product → create relationships → save
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [x] 21. Checkpoint - Ensure all tests pass
  - Run all unit tests: `npm run test`
  - Run all property-based tests: `npm run test:pbt`
  - Verify no compilation errors: `npm run build`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Final checkpoint - Ensure all tests pass
  - Run all unit tests: `npm run test`
  - Run all property-based tests: `npm run test:pbt`
  - Verify no compilation errors: `npm run build`
  - Test endpoints manually or with integration tests
  - Test UI workflow: create UoMs, assign to product, create relationships, delete with constraints
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- All entities follow the existing project pattern with tenant_id for multi-tenancy
- All services include comprehensive validation and error handling
- All controllers follow REST conventions and include DTOs with validation
- Cascade deletion is configured at the database level via foreign key constraints
- UoM deletion uses RESTRICT foreign key to prevent deletion when vendor prices exist
- Each tenant defines their own UoMs - no global catalog
- Error messages guide users to resolve constraint violations (e.g., delete vendor prices first)
