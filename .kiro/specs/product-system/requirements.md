# Requirements Document: Product System

## Introduction

A clean, minimal product management system that supports hierarchical units of measure (UoM) with cascading relationships and vendor pricing. Each tenant defines their own UoMs, and products within that tenant can use those UoMs. Product-specific UoM relationships define conversion factors between units. Vendor-specific pricing is tied to these units, and the system enforces data integrity by preventing UoM deletion when referenced by vendor prices.

## Glossary

- **Product**: A catalog item with unique SKU, name, and description (tenant-specific)
- **SKU**: Stock Keeping Unit - unique identifier for a product within a tenant
- **Unit of Measure (UoM)**: A unit in which a product can be measured or received (e.g., piece, display, box) - defined per tenant
- **Product UoM**: A UoM that has been assigned to a specific product
- **UoM Relationship**: A product-specific conversion rule defining how one UoM equals a quantity of another (e.g., 1 box = 10 displays)
- **Conversion Factor**: The numeric multiplier in a UoM relationship (e.g., 10 in "1 box = 10 displays")
- **Explicit Relationship**: A UoM relationship manually created by the user
- **Calculated Relationship**: A UoM relationship automatically computed by the system from explicit relationships (e.g., box → piece derived from box → display → piece)
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

### Requirement 2: Unit of Measure Definition and Assignment

**User Story:** As a warehouse manager, I want to define units of measure for my tenant and assign them to products, so that I can receive and manage inventory in different units.

#### Acceptance Criteria

1. THE UoM SHALL have an id field that uniquely identifies it
2. THE UoM SHALL have a code field (e.g., "piece", "display", "box")
3. THE UoM SHALL have a name field for display purposes
4. WHEN a UoM is created, THE System SHALL validate that code is not empty and unique within the tenant
5. WHEN a UoM is created, THE System SHALL validate that name is not empty
6. THE Product SHALL have a collection of UoMs assigned to it
7. WHEN a UoM is assigned to a product, THE System SHALL validate that the UoM belongs to the same tenant as the product
8. WHEN a UoM is removed from a product, THE System SHALL allow removal only if it is not referenced by any UoM relationships or vendor product prices

### Requirement 3: UoM Relationships and Cascading Conversions

**User Story:** As a warehouse manager, I want to define relationships between units of measure for each product, so that I can receive products in cascading quantities and automatically calculate conversions.

#### Acceptance Criteria

1. WHEN a UoM relationship is defined, THE System SHALL establish that one UoM equals a specific quantity of another UoM for that product
2. THE UoM relationship SHALL have a source_uom (the larger unit) and target_uom (the smaller unit)
3. THE UoM relationship SHALL have a conversion_factor (how many target_uom equal one source_uom)
4. WHEN a UoM relationship is created, THE System SHALL validate that conversion_factor is greater than zero
5. WHEN a UoM relationship is created, THE System SHALL validate that both UoMs are assigned to the same product
6. WHEN a UoM relationship is created, THE System SHALL validate that source_uom and target_uom are different
7. THE Product SHALL maintain an ordered collection of explicit UoM relationships that define its hierarchy
8. WHEN converting a quantity from one UoM to another, THE System SHALL traverse the hierarchy and calculate the equivalent quantity
9. WHEN a conversion path exists through multiple relationships, THE System SHALL automatically calculate and display the derived relationship (e.g., box → piece calculated from box → display → piece)

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

### Requirement 5: Data Integrity and Vendor Price Constraints

**User Story:** As a system administrator, I want to ensure data integrity across products, units, and pricing, so that the system remains consistent and prevents orphaned data.

#### Acceptance Criteria

1. WHEN a UoM is removed from a Product, THE System SHALL prevent removal if it is referenced by any Vendor Product Price
2. WHEN a UoM is removed from a Product, THE System SHALL prevent removal if it is referenced by any UoM relationship
3. WHEN a UoM is referenced by a Vendor Product Price, THE System SHALL return error code UOM_IN_USE_BY_PRICE with message "Cannot delete UoM: it is referenced by vendor product prices"
4. WHEN a UoM is referenced by a UoM relationship, THE System SHALL return error code UOM_IN_USE_BY_RELATIONSHIP with message "Cannot delete UoM: it is referenced by UoM relationships"
5. WHEN a Product is deleted, THE System SHALL cascade delete all associated UoMs, UoM relationships, and Vendor Product Prices
6. WHEN a Vendor is deleted, THE System SHALL cascade delete all associated Vendor Product Prices
7. WHEN a user attempts to delete a UoM with vendor prices, THE UI SHALL display a clear error message and suggest deleting vendor prices first

### Requirement 6: UI Management of UoM Relationships

**User Story:** As a warehouse manager, I want a clear interface to manage UoM assignments and relationships, so that I can easily configure product units and conversions.

#### Acceptance Criteria

1. WHEN editing a product, THE UI SHALL display three distinct sections: "Asignar Nuevas Unidades", "Unidades Asignadas", and "Relaciones de Conversión"
2. WHEN in the "Asignar Nuevas Unidades" section, THE UI SHALL display a dropdown of available UoMs from the catalog
3. WHEN a user selects a UoM and clicks "Asignar", THE System SHALL assign that UoM to the product and refresh the "Unidades Asignadas" section
4. WHEN in the "Unidades Asignadas" section, THE UI SHALL display all assigned UoMs with their names and descriptions
5. WHEN in the "Unidades Asignadas" section, THE UI SHALL provide a delete button for each UoM, with validation to prevent deletion if referenced by relationships or vendor prices
6. WHEN in the "Relaciones de Conversión" section, THE UI SHALL display a form to create new relationships with dropdowns for source and target UoMs
7. WHEN in the "Relaciones de Conversión" section, THE UI SHALL display a table of all relationships, distinguishing between explicit (user-created) and calculated (system-derived) relationships
8. WHEN a relationship is calculated by the system, THE UI SHALL mark it as "Calculada" and prevent deletion
9. WHEN a user attempts to delete a UoM with relationships, THE UI SHALL display an error message and list the relationships that must be deleted first
10. WHEN a user attempts to delete a UoM with vendor prices, THE UI SHALL display an error message and suggest deleting vendor prices first

