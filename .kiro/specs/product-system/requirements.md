# Requirements Document: Product System

## Introduction

A clean, minimal product management system that supports hierarchical units of measure (UoM) with cascading relationships and vendor pricing. The system enables flexible product definitions with predefined UoM configurations and vendor-specific pricing tied to those units.

## Glossary

- **Product**: A catalog item with unique SKU, name, and description
- **SKU**: Stock Keeping Unit - unique identifier for a product
- **Unit of Measure (UoM)**: A unit in which a product can be measured or received (e.g., piece, display, box)
- **UoM Hierarchy**: A cascading relationship between UoMs where one UoM equals a quantity of another (e.g., 1 box = 10 displays)
- **Vendor**: A supplier providing products
- **Vendor Product Price**: The price a specific vendor charges for a product in a specific UoM
- **Conversion**: The ability to convert quantities between different UoMs in a product's hierarchy

## Requirements

### Requirement 1: Product Definition

**User Story:** As a warehouse manager, I want to define products with clean, essential information, so that I can maintain a simple product catalog.

#### Acceptance Criteria

1. THE Product SHALL have an id field that uniquely identifies it
2. THE Product SHALL have a sku field that is a unique string identifier
3. THE Product SHALL have a name field for the product description
4. THE Product SHALL have a description field for additional details
5. WHEN a product is created, THE System SHALL validate that sku is not empty and is unique

### Requirement 2: Unit of Measure Definition

**User Story:** As a warehouse manager, I want to define units of measure for products, so that I can receive and manage inventory in different units.

#### Acceptance Criteria

1. THE UoM SHALL have an id field that uniquely identifies it
2. THE UoM SHALL have a code field (e.g., "piece", "display", "box")
3. THE UoM SHALL have a name field for display purposes
4. WHEN a UoM is created, THE System SHALL validate that code is not empty and unique within the product context
5. THE Product SHALL have a collection of UoMs associated with it

### Requirement 3: UoM Hierarchy and Cascading Relationships

**User Story:** As a warehouse manager, I want to define relationships between units of measure, so that I can receive products in cascading quantities.

#### Acceptance Criteria

1. WHEN a UoM relationship is defined, THE System SHALL establish that one UoM equals a specific quantity of another UoM
2. THE UoM relationship SHALL have a source_uom (the larger unit) and target_uom (the smaller unit)
3. THE UoM relationship SHALL have a conversion_factor (how many target_uom equal one source_uom)
4. WHEN a UoM relationship is created, THE System SHALL validate that conversion_factor is greater than zero
5. THE Product SHALL maintain an ordered collection of UoM relationships that define its hierarchy
6. WHEN converting a quantity from one UoM to another, THE System SHALL traverse the hierarchy and calculate the equivalent quantity

### Requirement 4: Vendor Product Pricing

**User Story:** As a procurement manager, I want to define vendor-specific prices for products in their respective units of measure, so that I can use accurate pricing for requisitions.

#### Acceptance Criteria

1. THE Vendor Product Price SHALL have an id field that uniquely identifies it
2. THE Vendor Product Price SHALL reference a Vendor
3. THE Vendor Product Price SHALL reference a Product
4. THE Vendor Product Price SHALL reference a UoM from the Product's UoM collection
5. THE Vendor Product Price SHALL have a price field representing the cost in the specified UoM
6. WHEN a vendor price is created, THE System SHALL validate that the referenced UoM belongs to the Product
7. WHEN a vendor price is created, THE System SHALL validate that price is greater than or equal to zero
8. THE System SHALL allow multiple vendor prices for the same product in different UoMs

### Requirement 5: Data Integrity and Consistency

**User Story:** As a system administrator, I want to ensure data integrity across products, units, and pricing, so that the system remains consistent.

#### Acceptance Criteria

1. WHEN a UoM is removed from a Product, THE System SHALL prevent removal if it is referenced by any Vendor Product Price
2. WHEN a UoM is removed from a Product, THE System SHALL prevent removal if it is referenced by any UoM relationship
3. WHEN a Product is deleted, THE System SHALL cascade delete all associated UoMs, UoM relationships, and Vendor Product Prices
4. WHEN a Vendor is deleted, THE System SHALL cascade delete all associated Vendor Product Prices

