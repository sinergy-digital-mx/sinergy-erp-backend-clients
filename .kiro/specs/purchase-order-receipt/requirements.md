# Requirements Document: Purchase Order Receipt Process

## Introduction

The Purchase Order Receipt (Recibo de Compra) feature enables users to record the receipt of products from purchase orders within the Purchase Orders module of the ERP system. When products arrive from a vendor, users can register the received quantities, which may differ from the originally requested amounts. The system automatically creates inventory batches with unique batch numbers and updates the purchase order status and totals. This feature is critical for inventory management and vendor reconciliation.

## Glossary

- **Purchase Order (PO)**: A formal request to a vendor for products, identified by a unique folio number (e.g., ODC-000001)
- **PO Status**: The current state of a purchase order (Creada, Recibida, Cancelada)
- **Received Quantity**: The actual quantity of a product received from the vendor, which may differ from the requested quantity
- **Batch**: A unique inventory record created for each product received, used to track product origin and expiration
- **Batch Number**: A unique identifier for a batch, generated with format {warehouse_prefix}-LOTE-{sequential_number} (e.g., MH-LOTE-000001)
- **Warehouse Prefix**: A 2-3 character code assigned to each warehouse (e.g., MH for "Matriz")
- **Base Unit**: The standard unit of measurement for a product, used for inventory tracking
- **Unit Conversion**: The process of converting received quantities from one unit of measurement to the base unit
- **Line Item**: A single product entry in a purchase order with quantity, unit price, and tax information
- **Received Totals**: Aggregated subtotal, IVA, IEPS, and total amounts for all received items
- **Inventory Batch Repository**: The database table (inv_s_batches) that stores batch records
- **Purchase Order Batch**: The main purchase order record (inv_s_purchase_order_batch)
- **Purchase Order Detail**: Individual line items in a purchase order (inv_s_purchase_order_batch_detail)

## Requirements

### Requirement 1: Display Purchase Order Receipt Modal

**User Story:** As a warehouse operator, I want to see a modal dialog showing the purchase order details and product list, so that I can accurately record received quantities.

#### Acceptance Criteria

1. WHEN a user opens the receipt modal for a purchase order, THE Receipt_Modal SHALL display the purchase order folio number
2. WHEN the receipt modal is displayed, THE Receipt_Modal SHALL display a list of all line items with their requested quantities and units of measurement
3. WHEN the receipt modal is displayed, THE Receipt_Modal SHALL display an input field for received quantity for each product
4. WHEN the receipt modal is displayed, THE Receipt_Modal SHALL display an optional input field for expiration date for each product
5. WHEN the receipt modal is displayed, THE Receipt_Modal SHALL display Cancel and Confirm Receipt buttons

### Requirement 2: Validate Received Quantities

**User Story:** As a system administrator, I want the system to validate received quantities before processing, so that invalid data does not corrupt inventory records.

#### Acceptance Criteria

1. WHEN a user confirms the receipt, THE Receipt_Validator SHALL verify that at least one product has a received quantity greater than zero
2. IF no products have received quantities greater than zero, THEN THE Receipt_Validator SHALL return an error message indicating at least one product must be received
3. WHEN a user confirms the receipt, THE Receipt_Validator SHALL verify that all received quantities are non-negative numbers
4. IF a received quantity is negative, THEN THE Receipt_Validator SHALL return an error message for that line item
5. WHEN a user confirms the receipt, THE Receipt_Validator SHALL verify that received quantities do not exceed reasonable limits (e.g., not exceeding 999,999.999 units)

### Requirement 3: Create Inventory Batches for Received Products

**User Story:** As an inventory manager, I want the system to automatically create inventory batch records for each received product, so that I can track product origin and manage expiration dates.

#### Acceptance Criteria

1. WHEN a user confirms the receipt with valid data, THE Batch_Creator SHALL create one inventory batch record for each product with a received quantity greater than zero
2. WHEN creating a batch, THE Batch_Creator SHALL generate a unique batch number using the format {warehouse_prefix}-LOTE-{sequential_number}
3. WHEN creating a batch, THE Batch_Creator SHALL retrieve the warehouse prefix from the warehouse associated with the purchase order
4. WHEN creating a batch, THE Batch_Creator SHALL increment the sequential number for each new batch within the same warehouse
5. WHEN creating a batch, THE Batch_Creator SHALL store the batch number in the inv_s_batches table with a unique constraint per tenant
6. WHEN creating a batch, THE Batch_Creator SHALL set the warehouse_id from the purchase order
7. WHEN creating a batch, THE Batch_Creator SHALL set the product_id from the received line item
8. WHEN creating a batch, THE Batch_Creator SHALL convert the received quantity to the product's base unit of measurement
9. WHEN creating a batch, THE Batch_Creator SHALL set the uom_id to the base unit of measurement for the product
10. WHEN creating a batch, THE Batch_Creator SHALL set the purchase_order_batch_id to reference the purchase order
11. WHEN creating a batch, THE Batch_Creator SHALL set the purchase_order_detail_id to reference the specific line item
12. WHEN creating a batch, THE Batch_Creator SHALL set the created_by field to the current user ID
13. WHEN creating a batch, THE Batch_Creator SHALL set the created_at timestamp to the current date and time

### Requirement 4: Update Purchase Order Status

**User Story:** As a procurement officer, I want the purchase order status to automatically update when products are received, so that I can track the fulfillment status.

#### Acceptance Criteria

1. WHEN a user confirms the receipt with valid data, THE PO_Status_Updater SHALL update the general_status of the purchase order to "Recibida"
2. WHEN updating the purchase order status, THE PO_Status_Updater SHALL set the updated_by field to the current user ID
3. WHEN updating the purchase order status, THE PO_Status_Updater SHALL set the updated_at timestamp to the current date and time

### Requirement 5: Calculate and Update Received Totals

**User Story:** As a financial analyst, I want the system to automatically calculate received totals including subtotal, IVA, and IEPS, so that I can reconcile received amounts with invoices.

#### Acceptance Criteria

1. WHEN a user confirms the receipt, THE Total_Calculator SHALL calculate the received subtotal by summing (received_quantity × unit_price) for all received items
2. WHEN a user confirms the receipt, THE Total_Calculator SHALL calculate the received IVA total by summing the IVA amounts for all received items
3. WHEN a user confirms the receipt, THE Total_Calculator SHALL calculate the received IEPS total by summing the IEPS amounts for all received items
4. WHEN a user confirms the receipt, THE Total_Calculator SHALL calculate the received total as (received_subtotal + received_iva_total + received_ieps_total)
5. WHEN a user confirms the receipt, THE Total_Calculator SHALL update the received_subtotal field in the purchase order
6. WHEN a user confirms the receipt, THE Total_Calculator SHALL update the received_iva_total field in the purchase order
7. WHEN a user confirms the receipt, THE Total_Calculator SHALL update the received_ieps_total field in the purchase order
8. WHEN a user confirms the receipt, THE Total_Calculator SHALL update the received_total field in the purchase order

### Requirement 6: Handle Unit Conversions

**User Story:** As a warehouse manager, I want the system to automatically convert received quantities to the product's base unit, so that inventory is consistently tracked.

#### Acceptance Criteria

1. WHEN creating an inventory batch, THE Unit_Converter SHALL retrieve the base unit of measurement for the product
2. WHEN creating an inventory batch, THE Unit_Converter SHALL convert the received quantity from the received unit to the base unit
3. WHEN creating an inventory batch, THE Unit_Converter SHALL store the converted quantity in the batch record
4. WHEN creating an inventory batch, THE Unit_Converter SHALL store the base unit ID in the batch record
5. IF a unit conversion cannot be performed, THEN THE Unit_Converter SHALL return an error indicating the conversion is not supported

### Requirement 7: Store Received Line Item Data

**User Story:** As a procurement auditor, I want the system to preserve the original received data for each line item, so that I can audit what was actually received versus what was ordered.

#### Acceptance Criteria

1. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_product_id from the received item
2. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_uom_id from the received item
3. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_quantity from the received item
4. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_unit_total from the received item
5. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_iva_percentage from the received item
6. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_iva_unit from the received item
7. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_ieps_percentage from the received item
8. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_original_ieps_unit from the received item
9. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_converted_quantity (converted to base unit)
10. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL store the received_converted_uom_id (base unit ID)
11. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL set the updated_by field to the current user ID
12. WHEN a user confirms the receipt, THE Line_Item_Updater SHALL set the updated_at timestamp to the current date and time

### Requirement 8: Ensure Transactional Integrity

**User Story:** As a database administrator, I want all receipt operations to be atomic, so that the system never enters an inconsistent state.

#### Acceptance Criteria

1. WHEN a user confirms the receipt, THE Transaction_Manager SHALL start a database transaction
2. WHEN processing the receipt, THE Transaction_Manager SHALL update all line items, create all batches, and update the purchase order within a single transaction
3. IF any error occurs during receipt processing, THE Transaction_Manager SHALL rollback all changes
4. IF the receipt is successfully processed, THE Transaction_Manager SHALL commit all changes
5. WHEN the transaction completes, THE Transaction_Manager SHALL release the database connection

### Requirement 9: Return Confirmation Response

**User Story:** As a UI developer, I want the system to return the updated purchase order after receipt confirmation, so that I can display the current state to the user.

#### Acceptance Criteria

1. WHEN a user confirms the receipt successfully, THE Receipt_Service SHALL return the updated purchase order with all received totals and status
2. WHEN returning the purchase order, THE Receipt_Service SHALL include all line items with their received data
3. WHEN returning the purchase order, THE Receipt_Service SHALL include the updated general_status as "Recibida"
4. WHEN returning the purchase order, THE Receipt_Service SHALL include the received_subtotal, received_iva_total, received_ieps_total, and received_total

### Requirement 10: Handle Errors Gracefully

**User Story:** As a support specialist, I want the system to provide clear error messages when receipt processing fails, so that users can understand what went wrong.

#### Acceptance Criteria

1. IF a line item is not found during receipt processing, THEN THE Error_Handler SHALL return a NotFoundException with a message indicating which line item was not found
2. IF a database error occurs during receipt processing, THEN THE Error_Handler SHALL rollback the transaction and return an appropriate error message
3. IF validation fails, THEN THE Error_Handler SHALL return a BadRequestException with a descriptive message
4. WHEN an error occurs, THE Error_Handler SHALL log the error with sufficient context for debugging

### Requirement 11: Validate Tenant Isolation

**User Story:** As a security officer, I want the system to ensure that receipt operations only affect the correct tenant's data, so that data from different organizations remains isolated.

#### Acceptance Criteria

1. WHEN processing a receipt, THE Tenant_Validator SHALL verify that the purchase order belongs to the specified tenant
2. IF the purchase order does not belong to the tenant, THEN THE Tenant_Validator SHALL return a NotFoundException
3. WHEN creating inventory batches, THE Tenant_Validator SHALL set the tenant_id to the tenant from the purchase order
4. WHEN creating inventory batches, THE Tenant_Validator SHALL ensure the batch number is unique within the tenant

### Requirement 12: Batch Number Generation with Warehouse Prefix

**User Story:** As a warehouse coordinator, I want batch numbers to include the warehouse prefix, so that I can quickly identify which warehouse received the products.

#### Acceptance Criteria

1. WHEN generating a batch number, THE Batch_Number_Generator SHALL retrieve the warehouse prefix from the warehouse record
2. WHEN generating a batch number, THE Batch_Number_Generator SHALL format the batch number as {warehouse_prefix}-LOTE-{sequential_number}
3. WHEN generating a batch number, THE Batch_Number_Generator SHALL pad the sequential number with leading zeros to 6 digits (e.g., 000001)
4. WHEN generating a batch number, THE Batch_Number_Generator SHALL increment the sequential counter for each new batch in the warehouse
5. WHEN generating a batch number, THE Batch_Number_Generator SHALL ensure the batch number is unique within the tenant

