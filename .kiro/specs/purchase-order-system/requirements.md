# Requirements Document

## Introduction

This document specifies the requirements for a Purchase Order/Requisition System that manages the complete lifecycle of inventory procurement from vendors. The system enables users to create purchase orders with detailed product line items, track requested versus received quantities with unit conversions, and automatically generate inventory batches upon receiving goods. The system uses the "inv_s_" prefix to differentiate inventory structures from other system components.

## Glossary

- **Purchase_Order_System**: The complete inventory procurement management system
- **Purchase_Order**: A request to a vendor for products, containing header information and line items (stored in inv_s_purchase_order_batch)
- **Line_Item**: A single product entry within a purchase order with requested and received quantities (stored in inv_s_purchase_order_batch_detail)
- **Inventory_Batch**: A tracked lot of received inventory with warehouse-specific identifier (stored in inv_s_batches)
- **Fiscal_Configuration**: Tax and billing configuration entity (from fiscal_configurations table)
- **Warehouse**: Physical location for storing inventory (from warehouses table)
- **Vendor**: Supplier of products (from vendors table)
- **Product**: Item that can be purchased (from products table)
- **UOM**: Unit of Measure for quantifying products (from uom_catalog table)
- **Product_UOM**: Specific unit of measure configuration for a product (from product_uoms table)
- **Product_Vendor_Cost**: Pricing information for a product from a specific vendor (from product_vendor_costs table)
- **Base_Unit**: The fundamental unit of measure for a product used for inventory tracking
- **Conversion_Factor**: Multiplier used to convert between different units of measure
- **Batch_Number**: Auto-incrementing identifier for inventory batches in format {warehouse_prefix}-LOTE-{number}
- **Warehouse_Prefix**: Short code identifying a warehouse, used in batch number generation
- **Tenant**: Multi-tenant organization context for data isolation

## Requirements

### Requirement 1: Create Purchase Orders

**User Story:** As a procurement manager, I want to create purchase orders with vendor and delivery information, so that I can formally request inventory from suppliers.

#### Acceptance Criteria

1. WHEN creating a purchase order, THE Purchase_Order_System SHALL require fiscal_configuration_id, warehouse_id, vendor_id, and expected_delivery_date
2. WHEN creating a purchase order, THE Purchase_Order_System SHALL set payment_status to one of: Pendiente, Pagado
3. WHEN creating a purchase order, THE Purchase_Order_System SHALL set general_status to Creada
4. WHEN creating a purchase order, THE Purchase_Order_System SHALL accept optional notes
5. WHEN creating a purchase order, THE Purchase_Order_System SHALL record created_by and created_at audit fields
6. THE Purchase_Order_System SHALL store purchase orders in the inv_s_purchase_order_batch table

### Requirement 2: Add Product Line Items to Purchase Orders

**User Story:** As a procurement manager, I want to add product line items with quantities and pricing to purchase orders, so that I can specify exactly what I need from the vendor.

#### Acceptance Criteria

1. WHEN adding a line item, THE Purchase_Order_System SHALL require product_id, uom_id, quantity, and unit_total
2. WHEN adding a line item, THE Purchase_Order_System SHALL accept iva_percentage, iva_unit, ieps_percentage, and ieps_unit
3. WHEN adding a line item, THE Purchase_Order_System SHALL initialize received_original fields as null
4. WHEN adding a line item, THE Purchase_Order_System SHALL initialize received_converted fields as null
5. THE Purchase_Order_System SHALL store line items in the inv_s_purchase_order_batch_detail table
6. WHEN adding a line item, THE Purchase_Order_System SHALL record created_by and created_at audit fields

### Requirement 3: Retrieve Products by Vendor with Pricing

**User Story:** As a procurement manager, I want to see available products from a selected vendor with their units and costs, so that I can accurately populate purchase order line items.

#### Acceptance Criteria

1. WHEN querying products for a vendor, THE Purchase_Order_System SHALL return all products associated with the vendor_id
2. FOR EACH product returned, THE Purchase_Order_System SHALL include all available Product_UOM configurations
3. FOR EACH Product_UOM returned, THE Purchase_Order_System SHALL include the corresponding cost from Product_Vendor_Cost
4. FOR EACH Product_UOM returned, THE Purchase_Order_System SHALL include iva_percentage, ieps_percentage, iva_unit_total, and ieps_unit_total
5. FOR EACH Product_UOM returned, THE Purchase_Order_System SHALL include the conversion_factor from Product_UOM

### Requirement 4: List Purchase Orders

**User Story:** As a procurement manager, I want to view all purchase orders with filtering options, so that I can track and manage procurement activities.

#### Acceptance Criteria

1. THE Purchase_Order_System SHALL return all purchase orders for the authenticated Tenant
2. WHERE filtering by general_status is requested, THE Purchase_Order_System SHALL return only purchase orders matching the specified status
3. WHERE filtering by payment_status is requested, THE Purchase_Order_System SHALL return only purchase orders matching the specified payment status
4. WHERE filtering by vendor_id is requested, THE Purchase_Order_System SHALL return only purchase orders for the specified vendor
5. FOR EACH purchase order returned, THE Purchase_Order_System SHALL include fiscal_configuration, warehouse, and vendor details

### Requirement 5: Retrieve Purchase Order Details

**User Story:** As a procurement manager, I want to view complete details of a specific purchase order including all line items, so that I can review what was requested and received.

#### Acceptance Criteria

1. WHEN retrieving a purchase order by id, THE Purchase_Order_System SHALL return the purchase order header with fiscal_configuration, warehouse, and vendor details
2. WHEN retrieving a purchase order by id, THE Purchase_Order_System SHALL return all associated line items from inv_s_purchase_order_batch_detail
3. FOR EACH line item returned, THE Purchase_Order_System SHALL include requested product details: product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
4. FOR EACH line item returned, THE Purchase_Order_System SHALL include received_original details if the purchase order has been received
5. FOR EACH line item returned, THE Purchase_Order_System SHALL include received_converted details if the purchase order has been received

### Requirement 6: Receive Purchase Orders and Generate Inventory Batches

**User Story:** As a warehouse manager, I want to receive purchase orders and record what was actually delivered, so that I can update inventory and handle vendor substitutions or quantity discrepancies.

#### Acceptance Criteria

1. WHEN receiving a purchase order, THE Purchase_Order_System SHALL require received_original data for each line item: product_id, uom_id, quantity, unit_total, iva_percentage, iva_unit, ieps_percentage, ieps_unit
2. WHEN receiving a purchase order, THE Purchase_Order_System SHALL allow the received_original product_id to differ from the requested product_id
3. WHEN receiving a purchase order, THE Purchase_Order_System SHALL calculate received_converted quantity by applying the conversion_factor to convert to the Base_Unit
4. WHEN receiving a purchase order, THE Purchase_Order_System SHALL store the Base_Unit uom_id in received_converted uom_id
5. WHEN receiving a purchase order, THE Purchase_Order_System SHALL update the purchase order general_status to Recibida
6. WHEN receiving a purchase order, THE Purchase_Order_System SHALL record updated_by and updated_at audit fields

### Requirement 7: Generate Batch Numbers for Received Inventory

**User Story:** As a warehouse manager, I want inventory batches to have unique, warehouse-specific identifiers, so that I can track and trace inventory lots.

#### Acceptance Criteria

1. WHEN creating an Inventory_Batch, THE Purchase_Order_System SHALL generate a Batch_Number in the format {warehouse_prefix}-LOTE-{number}
2. WHEN generating a Batch_Number, THE Purchase_Order_System SHALL retrieve the Warehouse_Prefix from the warehouses table
3. WHEN generating a Batch_Number, THE Purchase_Order_System SHALL use an auto-incrementing number scoped to the Tenant
4. WHEN generating a Batch_Number, THE Purchase_Order_System SHALL zero-pad the number to 6 digits
5. THE Purchase_Order_System SHALL store inventory batches in the inv_s_batches table
6. WHEN creating an Inventory_Batch, THE Purchase_Order_System SHALL record created_by and created_at audit fields

### Requirement 8: Add Warehouse Prefix Column

**User Story:** As a system administrator, I want warehouses to have a prefix field, so that batch numbers can include warehouse-specific identifiers.

#### Acceptance Criteria

1. THE Purchase_Order_System SHALL add a prefix column to the warehouses table
2. THE Purchase_Order_System SHALL allow the prefix to be a string of up to 10 characters
3. WHEN a warehouse prefix is not provided, THE Purchase_Order_System SHALL allow the prefix to be null
4. WHERE a warehouse has a null prefix, THE Purchase_Order_System SHALL use "WH" as the default prefix for batch number generation

### Requirement 9: Cancel Purchase Orders

**User Story:** As a procurement manager, I want to cancel purchase orders that are no longer needed, so that I can maintain accurate procurement records.

#### Acceptance Criteria

1. WHEN canceling a purchase order, THE Purchase_Order_System SHALL verify the general_status is Creada
2. IF the general_status is not Creada, THEN THE Purchase_Order_System SHALL return an error indicating the purchase order cannot be canceled
3. WHEN canceling a purchase order with general_status Creada, THE Purchase_Order_System SHALL update general_status to Cancelada
4. WHEN canceling a purchase order, THE Purchase_Order_System SHALL record updated_by and updated_at audit fields

### Requirement 10: Update Purchase Order Line Item Pricing

**User Story:** As a procurement manager, I want to edit unit prices and tax amounts on line items, so that I can negotiate pricing or correct data entry errors.

#### Acceptance Criteria

1. WHEN updating a line item, THE Purchase_Order_System SHALL allow modification of unit_total, iva_percentage, iva_unit, ieps_percentage, and ieps_unit
2. WHEN updating a line item, THE Purchase_Order_System SHALL verify the associated purchase order general_status is Creada
3. IF the general_status is not Creada, THEN THE Purchase_Order_System SHALL return an error indicating the line item cannot be modified
4. WHEN updating a line item, THE Purchase_Order_System SHALL record updated_by and updated_at audit fields

### Requirement 11: Parse and Print Purchase Order Data

**User Story:** As a developer, I want to parse purchase order JSON data and format it back to JSON, so that I can reliably serialize and deserialize purchase order information.

#### Acceptance Criteria

1. WHEN valid purchase order JSON is provided, THE Purchase_Order_System SHALL parse it into a Purchase_Order object
2. WHEN invalid purchase order JSON is provided, THE Purchase_Order_System SHALL return a descriptive error
3. THE Purchase_Order_System SHALL format Purchase_Order objects back into valid JSON
4. FOR ALL valid Purchase_Order objects, parsing then formatting then parsing SHALL produce an equivalent object (round-trip property)

### Requirement 12: Tenant-Scoped API Endpoints

**User Story:** As a system architect, I want all API endpoints to include /tenant/ in their routes, so that it is explicit that these endpoints operate within a tenant context.

#### Acceptance Criteria

1. THE Purchase_Order_System SHALL prefix all API endpoint routes with /tenant/
2. WHEN creating a purchase order, THE Purchase_Order_System SHALL expose the endpoint at POST /tenant/purchase-orders
3. WHEN listing purchase orders, THE Purchase_Order_System SHALL expose the endpoint at GET /tenant/purchase-orders
4. WHEN retrieving a specific purchase order, THE Purchase_Order_System SHALL expose the endpoint at GET /tenant/purchase-orders/:id
5. WHEN receiving a purchase order, THE Purchase_Order_System SHALL expose the endpoint at POST /tenant/purchase-orders/:id/receive
6. WHEN canceling a purchase order, THE Purchase_Order_System SHALL expose the endpoint at DELETE /tenant/purchase-orders/:id
7. WHEN retrieving vendor products with pricing, THE Purchase_Order_System SHALL expose the endpoint at GET /tenant/vendors/:vendorId/products
8. WHEN updating a line item, THE Purchase_Order_System SHALL expose the endpoint at PATCH /tenant/purchase-orders/:orderId/line-items/:lineItemId
