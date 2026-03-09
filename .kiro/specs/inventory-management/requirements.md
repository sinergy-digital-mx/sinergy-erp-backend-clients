# Requirements Document: Inventory Management System

## Introduction

Este documento define los requisitos para el módulo de Inventory Management (Gestión de Inventario) del sistema Sinergy ERP. El módulo permite rastrear cantidades de productos en tiempo real, gestionar movimientos de inventario (entradas, salidas, ajustes, transferencias), controlar stock por almacén y ubicación, implementar métodos de valorización (FIFO, LIFO, Promedio Ponderado), y prevenir sobreventa mediante reservas de stock.

## Glossary

- **Inventory_Module**: El módulo completo de gestión de inventario
- **Inventory_Item**: Registro que representa la cantidad disponible de un producto en un almacén específico
- **Inventory_Movement**: Transacción que registra cambios en el inventario (entrada, salida, ajuste, transferencia)
- **Movement_Type**: Tipo de movimiento (purchase_receipt, sales_shipment, adjustment, transfer_in, transfer_out, initial_balance)
- **Stock_Reservation**: Reserva de inventario para órdenes de venta pendientes
- **Valuation_Method**: Método de valorización del inventario (FIFO, LIFO, Weighted_Average)
- **Stock_Level**: Nivel de inventario (cantidad disponible, reservada, en tránsito)
- **Reorder_Point**: Nivel mínimo de inventario que dispara una alerta de reorden
- **Lot_Number**: Número de lote para trazabilidad de productos
- **Serial_Number**: Número de serie único para productos individuales
- **Location**: Ubicación física dentro de un almacén (pasillo, rack, nivel)
- **Available_Stock**: Stock disponible = Stock físico - Stock reservado
- **Physical_Stock**: Cantidad física total en el almacén
- **Reserved_Stock**: Cantidad reservada para órdenes pendientes
- **In_Transit_Stock**: Cantidad en tránsito entre almacenes

## Requirements

### Requirement 1: Inventory Item Structure

**User Story:** Como administrador de inventario, quiero registrar productos en almacenes específicos con sus cantidades, para que pueda rastrear el stock disponible por ubicación.

#### Acceptance Criteria

1. THE Inventory_Item SHALL use UUID as primary key type
2. THE Inventory_Item SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE Inventory_Item SHALL include a product_id column with foreign key to products table
4. THE Inventory_Item SHALL include a warehouse_id column with foreign key to warehouses table
5. THE Inventory_Item SHALL include a uom_id column with foreign key to units_of_measure table
6. THE Inventory_Item SHALL include quantity_on_hand (physical stock) as decimal field
7. THE Inventory_Item SHALL include quantity_reserved (reserved stock) as decimal field
8. THE Inventory_Item SHALL include quantity_available (calculated: on_hand - reserved) as decimal field
9. THE Inventory_Item SHALL include reorder_point as optional decimal field
10. THE Inventory_Item SHALL include reorder_quantity as optional decimal field
11. THE Inventory_Item SHALL include location (physical location within warehouse) as optional string field
12. THE Inventory_Item SHALL include valuation_method enum (FIFO, LIFO, Weighted_Average)
13. THE Inventory_Item SHALL include unit_cost as decimal field for current average cost
14. THE Inventory_Item SHALL include total_value (calculated: quantity_on_hand * unit_cost) as decimal field
15. THE Inventory_Item SHALL include created_at and updated_at timestamps
16. THE Inventory_Item SHALL have a unique constraint on (tenant_id, product_id, warehouse_id, uom_id, location)
17. THE Inventory_Item SHALL have indexes on tenant_id, product_id, warehouse_id
18. WHEN a tenant is deleted, THE Inventory_Item SHALL be deleted automatically via CASCADE
19. WHEN a product is deleted, THE Inventory_Item SHALL be deleted automatically via CASCADE
20. WHEN a warehouse is deleted, THE Inventory_Item SHALL be deleted automatically via CASCADE

### Requirement 2: Inventory Movement Structure

**User Story:** Como administrador de inventario, quiero registrar todos los movimientos de inventario con su tipo, cantidad y referencia, para que pueda auditar cambios en el stock.

#### Acceptance Criteria

1. THE Inventory_Movement SHALL use UUID as primary key type
2. THE Inventory_Movement SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE Inventory_Movement SHALL include a product_id column with foreign key to products table
4. THE Inventory_Movement SHALL include a warehouse_id column with foreign key to warehouses table
5. THE Inventory_Movement SHALL include a uom_id column with foreign key to units_of_measure table
6. THE Inventory_Movement SHALL include movement_type enum (purchase_receipt, sales_shipment, adjustment, transfer_in, transfer_out, initial_balance, return_to_vendor, return_from_customer)
7. THE Inventory_Movement SHALL include quantity as decimal field (positive for increases, negative for decreases)
8. THE Inventory_Movement SHALL include unit_cost as decimal field for the cost at time of movement
9. THE Inventory_Movement SHALL include total_cost (calculated: quantity * unit_cost) as decimal field
10. THE Inventory_Movement SHALL include reference_type as optional string field (e.g., 'sales_order', 'purchase_order')
11. THE Inventory_Movement SHALL include reference_id as optional UUID field
12. THE Inventory_Movement SHALL include location as optional string field
13. THE Inventory_Movement SHALL include lot_number as optional string field for batch tracking
14. THE Inventory_Movement SHALL include serial_number as optional string field for individual item tracking
15. THE Inventory_Movement SHALL include notes as optional text field
16. THE Inventory_Movement SHALL include movement_date as timestamp field
17. THE Inventory_Movement SHALL include created_by_user_id as UUID field
18. THE Inventory_Movement SHALL include created_at timestamp
19. THE Inventory_Movement SHALL have indexes on tenant_id, product_id, warehouse_id, movement_date, reference_type, reference_id
20. WHEN a tenant is deleted, THE Inventory_Movement SHALL be deleted automatically via CASCADE

### Requirement 3: Stock Reservation Structure

**User Story:** Como gerente de ventas, quiero reservar inventario para órdenes de venta confirmadas, para que pueda garantizar disponibilidad y prevenir sobreventa.

#### Acceptance Criteria

1. THE Stock_Reservation SHALL use UUID as primary key type
2. THE Stock_Reservation SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE Stock_Reservation SHALL include a product_id column with foreign key to products table
4. THE Stock_Reservation SHALL include a warehouse_id column with foreign key to warehouses table
5. THE Stock_Reservation SHALL include a uom_id column with foreign key to units_of_measure table
6. THE Stock_Reservation SHALL include quantity_reserved as decimal field
7. THE Stock_Reservation SHALL include reference_type as string field (e.g., 'sales_order')
8. THE Stock_Reservation SHALL include reference_id as UUID field
9. THE Stock_Reservation SHALL include status enum (active, fulfilled, cancelled, expired)
10. THE Stock_Reservation SHALL include reserved_at timestamp field
11. THE Stock_Reservation SHALL include expires_at as optional timestamp field
12. THE Stock_Reservation SHALL include fulfilled_at as optional timestamp field
13. THE Stock_Reservation SHALL include created_at and updated_at timestamps
14. THE Stock_Reservation SHALL have indexes on tenant_id, product_id, warehouse_id, reference_type, reference_id, status
15. WHEN a tenant is deleted, THE Stock_Reservation SHALL be deleted automatically via CASCADE

### Requirement 4: Create Inventory Item

**User Story:** Como administrador de inventario, quiero crear registros de inventario para productos en almacenes específicos, para que pueda inicializar el sistema de inventario.

#### Acceptance Criteria

1. WHEN a user with inventory:Create permission submits valid data, THE Inventory_Service SHALL create a new Inventory_Item
2. WHEN creating an Inventory_Item, THE Inventory_Service SHALL automatically assign the tenant_id from the authenticated user
3. WHEN creating an Inventory_Item, THE Inventory_Service SHALL validate that product_id exists and belongs to the tenant
4. WHEN creating an Inventory_Item, THE Inventory_Service SHALL validate that warehouse_id exists and belongs to the tenant
5. WHEN creating an Inventory_Item, THE Inventory_Service SHALL validate that uom_id exists and is assigned to the product
6. WHEN creating an Inventory_Item, THE Inventory_Service SHALL validate that the combination (tenant_id, product_id, warehouse_id, uom_id, location) is unique
7. WHEN creating an Inventory_Item, THE Inventory_Service SHALL initialize quantity_on_hand to 0 if not provided
8. WHEN creating an Inventory_Item, THE Inventory_Service SHALL initialize quantity_reserved to 0
9. WHEN creating an Inventory_Item, THE Inventory_Service SHALL calculate quantity_available as (quantity_on_hand - quantity_reserved)
10. WHEN creating an Inventory_Item with initial quantity > 0, THE Inventory_Service SHALL create an Inventory_Movement of type 'initial_balance'
11. WHEN a user without inventory:Create permission attempts creation, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 5: Update Inventory Item

**User Story:** Como administrador de inventario, quiero actualizar configuraciones de inventario (reorder point, location, valuation method), para que pueda ajustar parámetros sin afectar cantidades.

#### Acceptance Criteria

1. WHEN a user with inventory:Update permission submits valid update data, THE Inventory_Service SHALL update the specified Inventory_Item
2. WHEN updating an Inventory_Item, THE Inventory_Service SHALL verify the item belongs to the user's tenant
3. WHEN updating an Inventory_Item, THE Inventory_Service SHALL allow updating reorder_point, reorder_quantity, location, valuation_method
4. WHEN updating an Inventory_Item, THE Inventory_Service SHALL NOT allow direct updates to quantity_on_hand, quantity_reserved, or quantity_available
5. WHEN updating an Inventory_Item, THE Inventory_Service SHALL recalculate quantity_available if quantity_reserved changes through reservations
6. WHEN an Inventory_Item is not found for the given tenant, THE Inventory_Service SHALL throw a 404 Not Found error
7. WHEN a user without inventory:Update permission attempts update, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 6: Query Inventory Items

**User Story:** Como administrador de inventario, quiero consultar inventario con filtros y paginación, para que pueda ver stock disponible por producto, almacén o ubicación.

#### Acceptance Criteria

1. WHEN a user with inventory:Read permission requests inventory list, THE Inventory_Service SHALL return paginated Inventory_Items for their tenant
2. THE Pagination_System SHALL default to page 1 with limit 20 items per page
3. THE Pagination_System SHALL enforce a maximum limit value of 100
4. THE Inventory_Service SHALL support filtering by product_id
5. THE Inventory_Service SHALL support filtering by warehouse_id
6. THE Inventory_Service SHALL support filtering by location
7. THE Inventory_Service SHALL support filtering by low_stock (quantity_available <= reorder_point)
8. THE Inventory_Service SHALL support search by product name or SKU
9. THE Inventory_Service SHALL return inventory items with related product, warehouse, and UoM information
10. THE Inventory_Service SHALL calculate and return quantity_available for each item
11. THE Inventory_Service SHALL order results by product name and warehouse name
12. WHEN a user without inventory:Read permission attempts listing, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 7: Create Inventory Movement

**User Story:** Como administrador de inventario, quiero registrar movimientos de inventario (entradas, salidas, ajustes), para que pueda actualizar cantidades y mantener historial de transacciones.

#### Acceptance Criteria

1. WHEN a user with inventory:Create permission submits valid movement data, THE Inventory_Service SHALL create a new Inventory_Movement
2. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL validate that product_id, warehouse_id, and uom_id exist and belong to the tenant
3. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL validate that quantity is not zero
4. WHEN creating an Inventory_Movement of type 'purchase_receipt', 'transfer_in', 'return_from_customer', or 'initial_balance', THE Inventory_Service SHALL require quantity to be positive
5. WHEN creating an Inventory_Movement of type 'sales_shipment', 'transfer_out', or 'return_to_vendor', THE Inventory_Service SHALL require quantity to be negative
6. WHEN creating an Inventory_Movement of type 'adjustment', THE Inventory_Service SHALL allow positive or negative quantity
7. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL update the corresponding Inventory_Item quantity_on_hand
8. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL recalculate unit_cost based on valuation_method (FIFO, LIFO, Weighted_Average)
9. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL create the Inventory_Item if it doesn't exist
10. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL record created_by_user_id from authenticated user
11. WHEN creating an Inventory_Movement with insufficient stock for negative quantity, THE Inventory_Service SHALL throw an error
12. WHEN a user without inventory:Create permission attempts creation, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 8: Query Inventory Movements

**User Story:** Como auditor de inventario, quiero consultar historial de movimientos con filtros, para que pueda rastrear cambios en el inventario y verificar transacciones.

#### Acceptance Criteria

1. WHEN a user with inventory:Read permission requests movement list, THE Inventory_Service SHALL return paginated Inventory_Movements for their tenant
2. THE Inventory_Service SHALL support filtering by product_id
3. THE Inventory_Service SHALL support filtering by warehouse_id
4. THE Inventory_Service SHALL support filtering by movement_type
5. THE Inventory_Service SHALL support filtering by date range (movement_date_from, movement_date_to)
6. THE Inventory_Service SHALL support filtering by reference_type and reference_id
7. THE Inventory_Service SHALL support filtering by lot_number or serial_number
8. THE Inventory_Service SHALL return movements with related product, warehouse, and UoM information
9. THE Inventory_Service SHALL order results by movement_date descending (newest first)
10. WHEN a user without inventory:Read permission attempts listing, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 9: Create Stock Reservation

**User Story:** Como sistema de ventas, quiero reservar inventario automáticamente cuando se confirma una orden de venta, para que pueda garantizar disponibilidad y prevenir sobreventa.

#### Acceptance Criteria

1. WHEN a sales order is confirmed, THE Inventory_Service SHALL create Stock_Reservations for each line item
2. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL validate that sufficient available stock exists
3. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL update the Inventory_Item quantity_reserved
4. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL recalculate quantity_available
5. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL set status to 'active'
6. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL record reserved_at timestamp
7. WHEN creating a Stock_Reservation with expires_at, THE Inventory_Service SHALL allow automatic expiration
8. WHEN insufficient stock is available, THE Inventory_Service SHALL throw an error with available quantity information
9. WHEN a Stock_Reservation is created, THE Inventory_Service SHALL prevent quantity_available from becoming negative

### Requirement 10: Fulfill Stock Reservation

**User Story:** Como sistema de almacén, quiero cumplir reservas de inventario cuando se envía una orden, para que pueda liberar stock reservado y actualizar cantidades físicas.

#### Acceptance Criteria

1. WHEN a sales order is shipped, THE Inventory_Service SHALL fulfill corresponding Stock_Reservations
2. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL update status to 'fulfilled'
3. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL record fulfilled_at timestamp
4. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL create an Inventory_Movement of type 'sales_shipment'
5. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL decrease quantity_on_hand
6. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL decrease quantity_reserved
7. WHEN fulfilling a Stock_Reservation, THE Inventory_Service SHALL maintain quantity_available unchanged (since it was already reduced by reservation)
8. WHEN a Stock_Reservation is already fulfilled or cancelled, THE Inventory_Service SHALL throw an error

### Requirement 11: Cancel Stock Reservation

**User Story:** Como gerente de ventas, quiero cancelar reservas de inventario cuando se cancela una orden, para que pueda liberar stock reservado y hacerlo disponible nuevamente.

#### Acceptance Criteria

1. WHEN a sales order is cancelled, THE Inventory_Service SHALL cancel corresponding Stock_Reservations
2. WHEN cancelling a Stock_Reservation, THE Inventory_Service SHALL update status to 'cancelled'
3. WHEN cancelling a Stock_Reservation, THE Inventory_Service SHALL decrease quantity_reserved in Inventory_Item
4. WHEN cancelling a Stock_Reservation, THE Inventory_Service SHALL increase quantity_available
5. WHEN cancelling a Stock_Reservation, THE Inventory_Service SHALL NOT create an Inventory_Movement
6. WHEN a Stock_Reservation is already fulfilled, THE Inventory_Service SHALL throw an error preventing cancellation

### Requirement 12: Inventory Transfer Between Warehouses

**User Story:** Como administrador de inventario, quiero transferir inventario entre almacenes, para que pueda redistribuir stock según demanda.

#### Acceptance Criteria

1. WHEN a user initiates an inventory transfer, THE Inventory_Service SHALL create two Inventory_Movements
2. WHEN creating a transfer, THE Inventory_Service SHALL create a 'transfer_out' movement in the source warehouse with negative quantity
3. WHEN creating a transfer, THE Inventory_Service SHALL create a 'transfer_in' movement in the destination warehouse with positive quantity
4. WHEN creating a transfer, THE Inventory_Service SHALL validate sufficient stock in source warehouse
5. WHEN creating a transfer, THE Inventory_Service SHALL link both movements with the same reference_id
6. WHEN creating a transfer, THE Inventory_Service SHALL update quantity_on_hand in both warehouses
7. WHEN creating a transfer, THE Inventory_Service SHALL preserve unit_cost from source warehouse
8. WHEN creating a transfer, THE Inventory_Service SHALL validate that source and destination warehouses are different

### Requirement 13: Inventory Adjustment

**User Story:** Como administrador de inventario, quiero realizar ajustes de inventario para corregir discrepancias, para que pueda mantener cantidades precisas después de conteos físicos.

#### Acceptance Criteria

1. WHEN a user creates an adjustment, THE Inventory_Service SHALL create an Inventory_Movement of type 'adjustment'
2. WHEN creating an adjustment, THE Inventory_Service SHALL allow positive quantity (increase) or negative quantity (decrease)
3. WHEN creating an adjustment, THE Inventory_Service SHALL require notes field explaining the reason
4. WHEN creating an adjustment, THE Inventory_Service SHALL update quantity_on_hand
5. WHEN creating an adjustment, THE Inventory_Service SHALL recalculate unit_cost if valuation_method is Weighted_Average
6. WHEN creating an adjustment with negative quantity, THE Inventory_Service SHALL validate sufficient stock exists
7. WHEN creating an adjustment, THE Inventory_Service SHALL record created_by_user_id for audit trail

### Requirement 14: Valuation Method - FIFO (First In, First Out)

**User Story:** Como contador, quiero usar el método FIFO para valorizar inventario, para que el costo refleje que los primeros productos en entrar son los primeros en salir.

#### Acceptance Criteria

1. WHEN an Inventory_Item uses FIFO valuation_method, THE Inventory_Service SHALL track cost layers (batches) with their quantities and costs
2. WHEN a purchase receipt is recorded, THE Inventory_Service SHALL create a new cost layer with quantity and unit_cost
3. WHEN a sales shipment is recorded, THE Inventory_Service SHALL consume from the oldest cost layer first
4. WHEN a cost layer is fully consumed, THE Inventory_Service SHALL remove it and move to the next oldest layer
5. WHEN calculating unit_cost for FIFO, THE Inventory_Service SHALL use the weighted average of remaining cost layers
6. WHEN an adjustment increases inventory, THE Inventory_Service SHALL create a new cost layer
7. WHEN an adjustment decreases inventory, THE Inventory_Service SHALL consume from oldest layers first

### Requirement 15: Valuation Method - Weighted Average

**User Story:** Como contador, quiero usar el método de Promedio Ponderado para valorizar inventario, para que el costo refleje un promedio de todas las compras.

#### Acceptance Criteria

1. WHEN an Inventory_Item uses Weighted_Average valuation_method, THE Inventory_Service SHALL maintain a single unit_cost
2. WHEN a purchase receipt is recorded, THE Inventory_Service SHALL recalculate unit_cost as: (current_value + new_value) / (current_quantity + new_quantity)
3. WHEN a sales shipment is recorded, THE Inventory_Service SHALL use the current unit_cost without recalculation
4. WHEN an adjustment increases inventory, THE Inventory_Service SHALL recalculate unit_cost if unit_cost is provided
5. WHEN an adjustment decreases inventory, THE Inventory_Service SHALL use the current unit_cost without recalculation
6. WHEN quantity_on_hand reaches zero, THE Inventory_Service SHALL reset unit_cost to zero

### Requirement 16: Low Stock Alerts

**User Story:** Como gerente de compras, quiero recibir alertas cuando el inventario está bajo, para que pueda crear órdenes de compra oportunamente.

#### Acceptance Criteria

1. WHEN quantity_available falls below or equals reorder_point, THE Inventory_Service SHALL flag the item as low_stock
2. WHEN querying inventory with low_stock filter, THE Inventory_Service SHALL return only items where quantity_available <= reorder_point
3. WHEN an Inventory_Item has reorder_quantity defined, THE Inventory_Service SHALL suggest reorder_quantity in low stock alerts
4. WHEN an Inventory_Item reaches low stock, THE Inventory_Service SHALL include product, warehouse, current quantity, and reorder point in the alert
5. THE Inventory_Service SHALL provide an endpoint to list all low stock items across all warehouses

### Requirement 17: Inventory Valuation Report

**User Story:** Como contador, quiero generar reportes de valorización de inventario, para que pueda calcular el valor total del inventario para estados financieros.

#### Acceptance Criteria

1. WHEN a user requests an inventory valuation report, THE Inventory_Service SHALL calculate total_value for each Inventory_Item
2. THE Inventory_Service SHALL calculate total_value as (quantity_on_hand * unit_cost)
3. THE Inventory_Service SHALL support filtering by warehouse_id
4. THE Inventory_Service SHALL support filtering by product category or product group
5. THE Inventory_Service SHALL return summary totals by warehouse
6. THE Inventory_Service SHALL return grand total for all inventory
7. THE Inventory_Service SHALL include product name, SKU, warehouse, quantity, unit_cost, and total_value in the report

### Requirement 18: Lot and Serial Number Tracking

**User Story:** Como gerente de calidad, quiero rastrear números de lote y serie, para que pueda identificar productos específicos en caso de recalls o garantías.

#### Acceptance Criteria

1. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL allow optional lot_number
2. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL allow optional serial_number
3. WHEN a product requires lot tracking, THE Inventory_Service SHALL enforce lot_number on all movements
4. WHEN a product requires serial tracking, THE Inventory_Service SHALL enforce serial_number on all movements
5. WHEN a product requires serial tracking, THE Inventory_Service SHALL validate that serial_number is unique within the tenant
6. THE Inventory_Service SHALL support querying movements by lot_number
7. THE Inventory_Service SHALL support querying movements by serial_number
8. THE Inventory_Service SHALL provide traceability reports showing all movements for a specific lot or serial number

### Requirement 19: Multi-UoM Inventory Management

**User Story:** Como administrador de inventario, quiero gestionar inventario en diferentes unidades de medida, para que pueda recibir en cajas y vender en piezas.

#### Acceptance Criteria

1. WHEN creating an Inventory_Item, THE Inventory_Service SHALL validate that uom_id is assigned to the product
2. WHEN creating an Inventory_Movement, THE Inventory_Service SHALL validate that uom_id is assigned to the product
3. WHEN creating an Inventory_Movement with different UoM than Inventory_Item, THE Inventory_Service SHALL convert quantity using product UoM relationships
4. WHEN querying inventory, THE Inventory_Service SHALL display quantities in the base UoM of the Inventory_Item
5. WHEN creating a Stock_Reservation, THE Inventory_Service SHALL convert quantity to the Inventory_Item's UoM if different
6. THE Inventory_Service SHALL maintain consistency by storing all quantities in the UoM specified in the Inventory_Item

### Requirement 20: Tenant Data Isolation

**User Story:** Como administrador del sistema, quiero aislamiento completo de datos entre tenants, para que cada organización solo acceda a su propio inventario.

#### Acceptance Criteria

1. THE Inventory_Service SHALL filter all queries by tenant_id
2. THE Inventory_Service SHALL prevent access to inventory from other tenants
3. WHEN creating inventory records, THE Inventory_Service SHALL use the authenticated user's tenant_id
4. WHEN updating or deleting inventory records, THE Inventory_Service SHALL verify tenant ownership
5. THE Inventory_Service SHALL validate that all referenced entities (product, warehouse, UoM) belong to the same tenant

### Requirement 21: API Documentation

**User Story:** Como desarrollador que consume la API, quiero documentación Swagger completa, para que pueda entender y usar los endpoints correctamente.

#### Acceptance Criteria

1. THE Inventory_Controller SHALL include ApiTags decorator with "Inventory" tag
2. THE Inventory_Controller SHALL include ApiOperation decorator for each endpoint with descriptive summary
3. THE Inventory_Controller SHALL include ApiResponse decorators documenting all possible HTTP status codes
4. THE Inventory_Controller SHALL include ApiParam decorators for path parameters
5. THE Inventory_Controller SHALL include ApiQuery decorators for query parameters
6. THE Inventory_Controller SHALL include ApiBody decorators for request bodies
7. THE Inventory_Controller SHALL include ApiBearerAuth decorator for authentication documentation

### Requirement 22: Database Migrations

**User Story:** Como administrador de base de datos, quiero migraciones para crear las tablas de inventario, para que la estructura de base de datos esté correctamente definida.

#### Acceptance Criteria

1. THE Migration SHALL create an inventory_items table with all required columns
2. THE Migration SHALL create an inventory_movements table with all required columns
3. THE Migration SHALL create a stock_reservations table with all required columns
4. THE Migration SHALL create a cost_layers table for FIFO valuation (optional, can be JSON in inventory_items)
5. THE Migration SHALL create indexes on tenant_id, product_id, warehouse_id for all tables
6. THE Migration SHALL create foreign keys with CASCADE delete for tenant_id
7. THE Migration SHALL create enum types for movement_type, valuation_method, and reservation_status
8. THE Migration SHALL include down methods to rollback all table creations
