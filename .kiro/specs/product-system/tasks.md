# Implementation Plan: Product System

## Overview

Implementation of a clean product management system with hierarchical units of measure and vendor pricing. The system will be built using NestJS with TypeORM, following the existing project architecture with entities, repositories, services, and controllers organized by module.

## Tasks

- [x] 1. Create Product entity and repository
  - Create `src/entities/products/product.entity.ts` with fields: id, sku, name, description, tenant_id, created_at, updated_at
  - Add unique constraint on (tenant_id, sku)
  - Add indexes on tenant_id and sku
  - Create `src/api/products/repositories/product.repository.ts` with methods: create, findById, findBySku, findByTenant, update, delete
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create Unit of Measure (UoM) entity and repository
  - Create `src/entities/products/uom.entity.ts` with fields: id, product_id, code, name, created_at, updated_at
  - Add unique constraint on (product_id, code)
  - Add foreign key to Product with CASCADE delete
  - Create `src/api/products/repositories/uom.repository.ts` with methods: create, findById, findByProduct, update, delete
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 3. Create UoM Relationship entity and repository
  - Create `src/entities/products/uom-relationship.entity.ts` with fields: id, product_id, source_uom_id, target_uom_id, conversion_factor, created_at, updated_at
  - Add unique constraint on (product_id, source_uom_id, target_uom_id)
  - Add check constraint: conversion_factor > 0
  - Add check constraint: source_uom_id != target_uom_id
  - Add foreign keys to Product and UoM with CASCADE delete
  - Create `src/api/products/repositories/uom-relationship.repository.ts` with methods: create, findById, findByProduct, delete
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4. Create Vendor Product Price entity and repository
  - Create `src/entities/products/vendor-product-price.entity.ts` with fields: id, vendor_id, product_id, uom_id, price, created_at, updated_at
  - Add unique constraint on (vendor_id, product_id, uom_id)
  - Add check constraint: price >= 0
  - Add foreign keys: vendor (CASCADE), product (CASCADE), uom (RESTRICT)
  - Create `src/api/products/repositories/vendor-product-price.repository.ts` with methods: create, findById, findByProduct, findByVendor, findByVendorProductUoM, update, delete
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Implement ProductService with validation
  - Create `src/api/products/services/product.service.ts`
  - Implement: createProduct (validate SKU uniqueness), getProduct, getProductBySku, updateProduct, deleteProduct, listProducts
  - Add validation: SKU not empty, SKU unique per tenant, name not empty
  - _Requirements: 1.5_

- [ ]* 5.1 Write property test for Product SKU uniqueness
  - **Property 1: Product SKU Uniqueness**
  - **Validates: Requirements 1.5**

- [x] 6. Implement UoMService with validation and conversion logic
  - Create `src/api/products/services/uom.service.ts`
  - Implement: createUoM (validate code uniqueness), getUoM, getUoMsByProduct, updateUoM, deleteUoM
  - Implement: createRelationship (validate conversion_factor > 0, same product, different UoMs), getRelationships, deleteRelationship
  - Implement: convertQuantity (traverse hierarchy, calculate equivalent quantity)
  - Add validation: code not empty, code unique per product, name not empty
  - _Requirements: 2.4, 3.4, 3.6_

- [ ]* 6.1 Write property test for UoM code uniqueness
  - **Property 3: UoM Code Uniqueness Within Product**
  - **Validates: Requirements 2.4**

- [ ]* 6.2 Write property test for UoM conversion round trip
  - **Property 7: UoM Conversion Round Trip**
  - **Validates: Requirements 3.6**

- [x] 7. Implement VendorProductPriceService with validation
  - Create `src/api/products/services/vendor-product-price.service.ts`
  - Implement: createPrice (validate UoM belongs to product, validate price >= 0), getPrice, getPricesByProduct, getPricesByVendor, getPriceByVendorProductUoM, updatePrice, deletePrice
  - Add validation: price >= 0, UoM belongs to product
  - _Requirements: 4.6, 4.7, 4.8_

- [ ]* 7.1 Write property test for vendor price UoM validity
  - **Property 8: Vendor Price UoM Validity**
  - **Validates: Requirements 4.6**

- [ ]* 7.2 Write property test for vendor price non-negativity
  - **Property 9: Vendor Price Non-Negative**
  - **Validates: Requirements 4.7**

- [x] 8. Implement referential integrity constraints
  - Add check in UoMService.deleteUoM: prevent deletion if UoM is referenced by vendor prices (throw error with code UOM_IN_USE_BY_PRICE)
  - Add check in UoMService.deleteUoM: prevent deletion if UoM is referenced by relationships (throw error with code UOM_IN_USE_BY_RELATIONSHIP)
  - Verify cascade deletion: Product deletion cascades to UoMs, relationships, and vendor prices
  - Verify cascade deletion: Vendor deletion cascades to vendor prices
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property test for UoM deletion constraint with vendor prices
  - **Property 11: UoM Deletion Constraint - Vendor Prices**
  - **Validates: Requirements 5.1**

- [ ]* 8.2 Write property test for UoM deletion constraint with relationships
  - **Property 12: UoM Deletion Constraint - Relationships**
  - **Validates: Requirements 5.2**

- [ ]* 8.3 Write property test for product cascade deletion
  - **Property 13: Product Cascade Deletion**
  - **Validates: Requirements 5.3**

- [ ]* 8.4 Write property test for vendor cascade deletion
  - **Property 14: Vendor Cascade Deletion**
  - **Validates: Requirements 5.4**

- [x] 9. Create ProductController with REST endpoints
  - Create `src/api/products/controllers/product.controller.ts`
  - Implement endpoints:
    - POST /products (create product)
    - GET /products/:id (get product)
    - GET /products/sku/:sku (get product by SKU)
    - GET /products (list products with pagination)
    - PATCH /products/:id (update product)
    - DELETE /products/:id (delete product)
  - Add request/response DTOs with validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 10. Create UoMController with REST endpoints
  - Create `src/api/products/controllers/uom.controller.ts`
  - Implement endpoints:
    - POST /products/:productId/uoms (create UoM)
    - GET /products/:productId/uoms (list UoMs)
    - GET /products/:productId/uoms/:uomId (get UoM)
    - PATCH /products/:productId/uoms/:uomId (update UoM)
    - DELETE /products/:productId/uoms/:uomId (delete UoM)
    - POST /products/:productId/uom-relationships (create relationship)
    - GET /products/:productId/uom-relationships (list relationships)
    - DELETE /products/:productId/uom-relationships/:relationshipId (delete relationship)
    - POST /products/:productId/convert (convert quantity between UoMs)
  - Add request/response DTOs with validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Create VendorProductPriceController with REST endpoints
  - Create `src/api/products/controllers/vendor-product-price.controller.ts`
  - Implement endpoints:
    - POST /vendor-product-prices (create price)
    - GET /vendor-product-prices/:id (get price)
    - GET /products/:productId/vendor-prices (list prices by product)
    - GET /vendors/:vendorId/product-prices (list prices by vendor)
    - GET /vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId (get specific price)
    - PATCH /vendor-product-prices/:id (update price)
    - DELETE /vendor-product-prices/:id (delete price)
  - Add request/response DTOs with validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 12. Create ProductModule and wire components
  - Create `src/api/products/products.module.ts`
  - Register entities: Product, UoM, UoMRelationship, VendorProductPrice
  - Register repositories: ProductRepository, UoMRepository, UoMRelationshipRepository, VendorProductPriceRepository
  - Register services: ProductService, UoMService, VendorProductPriceService
  - Register controllers: ProductController, UoMController, VendorProductPriceController
  - Export services for use in other modules
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 13. Integrate ProductModule into AppModule
  - Import ProductModule in `src/app.module.ts`
  - Verify all entities are registered in TypeORM configuration
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 14. Checkpoint - Ensure all tests pass
  - Run all unit tests: `npm run test`
  - Run all property-based tests: `npm run test:pbt`
  - Verify no compilation errors: `npm run build`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create database migration
  - Create migration file in `src/database/migrations/` for all product system tables
  - Include: products, uoms, uom_relationships, vendor_product_prices tables
  - Include: all constraints, indexes, and foreign keys
  - Run migration: `npm run typeorm migration:run`
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 16. Add ProductSystem to module setup script
  - Update `src/database/scripts/setup-all-modules.ts` to include product system
  - Add module configuration: code='products', name='Product Management', entity='Product'
  - Create CRUD permissions for Product entity
  - Enable module for all tenants
  - Assign permissions to Admin roles
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Run all unit tests: `npm run test`
  - Run all property-based tests: `npm run test:pbt`
  - Verify no compilation errors: `npm run build`
  - Test endpoints manually or with integration tests
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

