# Requirements Document: POS (Point of Sale) System

## Introduction

Este documento define los requisitos para el módulo de POS (Point of Sale / Punto de Venta) del sistema Sinergy ERP. El módulo permite gestionar ventas directas en tiempo real, con flujo optimizado para restaurantes, retail y comercios que requieren operaciones rápidas de venta, cobro y control de caja.

## Glossary

- **POS_Module**: El módulo completo de punto de venta
- **POS_Order**: Una orden de venta creada en el punto de venta
- **POS_Order_Line**: Línea de producto dentro de una orden POS
- **POS_Payment**: Registro de pago asociado a una orden POS
- **Cash_Shift**: Turno de caja de un cajero
- **POS_Table**: Mesa o zona de servicio (para restaurantes)
- **Waiter**: Empleado que toma la orden (mesero/vendedor)
- **Cashier**: Empleado que procesa el pago (cajero)
- **Order_Number**: Número secuencial de orden por día
- **Kitchen_Command**: Comanda enviada a cocina
- **Split_Payment**: Pago dividido en múltiples métodos
- **Tip**: Propina agregada a la orden
- **Discount**: Descuento aplicado a la orden o línea
- **Change**: Cambio devuelto al cliente en pago efectivo

## Requirements

### Requirement 1: POS Order Structure

**User Story:** Como administrador del sistema, quiero una estructura de orden POS optimizada para ventas rápidas, para que las operaciones sean eficientes.

#### Acceptance Criteria

1. THE POS_Order SHALL use UUID as primary key type
2. THE POS_Order SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE POS_Order SHALL include an order_number column with daily sequential numbering
4. THE POS_Order SHALL include a warehouse_id column identifying the POS location
5. THE POS_Order SHALL include a waiter_id column with foreign key to rbac_users table
6. THE POS_Order SHALL include a cashier_id column (nullable) with foreign key to rbac_users table
7. THE POS_Order SHALL include status enum (pending, in_progress, ready, paid, cancelled)
8. THE POS_Order SHALL include financial fields: subtotal, tax, discount, tip, total
9. THE POS_Order SHALL include optional table_number and zone for restaurant operations
10. THE POS_Order SHALL include paid_at timestamp (nullable)
11. THE POS_Order SHALL include created_at and updated_at timestamps
12. THE POS_Order SHALL have indexes on tenant_id, warehouse_id, order_number, status, waiter_id
13. WHEN a tenant is deleted, THE POS_Order SHALL be deleted automatically via CASCADE

### Requirement 2: POS Order Line Structure

**User Story:** Como desarrollador, quiero líneas de orden con información completa de productos, para que pueda calcular totales y gestionar inventario.

#### Acceptance Criteria

1. THE POS_Order_Line SHALL use UUID as primary key type
2. THE POS_Order_Line SHALL include a pos_order_id column with foreign key to pos_orders table
3. THE POS_Order_Line SHALL include a product_id column with foreign key to products table
4. THE POS_Order_Line SHALL include a uom_id column with foreign key to uoms table
5. THE POS_Order_Line SHALL include quantity as decimal field
6. THE POS_Order_Line SHALL include unit_price as decimal field
7. THE POS_Order_Line SHALL include subtotal (quantity * unit_price) as decimal field
8. THE POS_Order_Line SHALL include discount_percentage and discount_amount as decimal fields
9. THE POS_Order_Line SHALL include line_total (subtotal - discount) as decimal field
10. THE POS_Order_Line SHALL include optional notes field for special instructions
11. THE POS_Order_Line SHALL include status enum (pending, preparing, ready, delivered)
12. THE POS_Order_Line SHALL include created_at and updated_at timestamps
13. THE POS_Order_Line SHALL have indexes on pos_order_id, product_id, status
14. WHEN a POS_Order is deleted, THE POS_Order_Line SHALL be deleted automatically via CASCADE

### Requirement 3: POS Payment Structure

**User Story:** Como cajero, quiero registrar pagos con múltiples métodos, para que pueda procesar ventas con efectivo, tarjeta o combinaciones.

#### Acceptance Criteria

1. THE POS_Payment SHALL use UUID as primary key type
2. THE POS_Payment SHALL include a pos_order_id column with foreign key to pos_orders table
3. THE POS_Payment SHALL include payment_method enum (cash, card, transfer, mixed)
4. THE POS_Payment SHALL include amount as decimal field
5. THE POS_Payment SHALL include received_amount as optional decimal field (for cash)
6. THE POS_Payment SHALL include change_amount as optional decimal field (for cash)
7. THE POS_Payment SHALL include optional reference field for card authorization
8. THE POS_Payment SHALL include cashier_id column with foreign key to rbac_users table
9. THE POS_Payment SHALL include cash_shift_id column with foreign key to cash_shifts table
10. THE POS_Payment SHALL include created_at timestamp
11. THE POS_Payment SHALL have indexes on pos_order_id, cashier_id, cash_shift_id, payment_method
12. WHEN a POS_Order is deleted, THE POS_Payment SHALL be deleted automatically via CASCADE

### Requirement 4: Cash Shift Structure

**User Story:** Como cajero, quiero gestionar turnos de caja con apertura y cierre, para que pueda controlar el efectivo bajo mi responsabilidad.

#### Acceptance Criteria

1. THE Cash_Shift SHALL use UUID as primary key type
2. THE Cash_Shift SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE Cash_Shift SHALL include a warehouse_id column identifying the POS location
4. THE Cash_Shift SHALL include a cashier_id column with foreign key to rbac_users table
5. THE Cash_Shift SHALL include initial_cash as decimal field
6. THE Cash_Shift SHALL include final_cash as optional decimal field
7. THE Cash_Shift SHALL include expected_cash as optional decimal field (calculated)
8. THE Cash_Shift SHALL include difference as optional decimal field (final - expected)
9. THE Cash_Shift SHALL include status enum (open, closed)
10. THE Cash_Shift SHALL include opened_at timestamp
11. THE Cash_Shift SHALL include closed_at as optional timestamp
12. THE Cash_Shift SHALL include notes as optional text field
13. THE Cash_Shift SHALL have indexes on tenant_id, warehouse_id, cashier_id, status
14. THE Cash_Shift SHALL enforce only one open shift per cashier per warehouse at a time
15. WHEN a tenant is deleted, THE Cash_Shift SHALL be deleted automatically via CASCADE

### Requirement 5: POS Table Structure (Optional for Restaurants)

**User Story:** Como gerente de restaurante, quiero gestionar mesas y zonas, para que pueda organizar el servicio eficientemente.

#### Acceptance Criteria

1. THE POS_Table SHALL use UUID as primary key type
2. THE POS_Table SHALL include a tenant_id column with foreign key to rbac_tenants table
3. THE POS_Table SHALL include a warehouse_id column identifying the restaurant location
4. THE POS_Table SHALL include table_number as string field
5. THE POS_Table SHALL include zone as optional string field (e.g., "Terraza", "Salón")
6. THE POS_Table SHALL include capacity as integer field
7. THE POS_Table SHALL include status enum (available, occupied, reserved, cleaning)
8. THE POS_Table SHALL include current_order_id as optional UUID field
9. THE POS_Table SHALL include created_at and updated_at timestamps
10. THE POS_Table SHALL have a unique constraint on (tenant_id, warehouse_id, table_number)
11. THE POS_Table SHALL have indexes on tenant_id, warehouse_id, status
12. WHEN a tenant is deleted, THE POS_Table SHALL be deleted automatically via CASCADE

### Requirement 6: Create POS Order

**User Story:** Como mesero/vendedor, quiero crear órdenes rápidamente, para que pueda atender clientes eficientemente.

#### Acceptance Criteria

1. WHEN a user with pos:Create permission submits valid data, THE POS_Service SHALL create a new POS_Order
2. WHEN creating a POS_Order, THE POS_Service SHALL automatically assign the tenant_id from the authenticated user
3. WHEN creating a POS_Order, THE POS_Service SHALL generate a sequential order_number for the current day
4. WHEN creating a POS_Order, THE POS_Service SHALL set waiter_id to the authenticated user
5. WHEN creating a POS_Order, THE POS_Service SHALL initialize status to 'pending'
6. WHEN creating a POS_Order, THE POS_Service SHALL initialize financial fields to 0
7. WHEN creating a POS_Order with table_number, THE POS_Service SHALL validate the table exists and is available
8. WHEN creating a POS_Order with table_number, THE POS_Service SHALL update the table status to 'occupied'
9. WHEN a user without pos:Create permission attempts creation, THE RBAC_System SHALL return a 403 Forbidden response

### Requirement 7: Add Line Items to POS Order

**User Story:** Como mesero/vendedor, quiero agregar productos a una orden, para que pueda registrar lo que el cliente desea comprar.

#### Acceptance Criteria

1. WHEN a user adds a line item, THE POS_Service SHALL validate that product_id exists and belongs to the tenant
2. WHEN a user adds a line item, THE POS_Service SHALL validate that uom_id is assigned to the product
3. WHEN a user adds a line item, THE POS_Service SHALL validate that the order status is 'pending' or 'in_progress'
4. WHEN a user adds a line item, THE POS_Service SHALL fetch the current product price
5. WHEN a user adds a line item, THE POS_Service SHALL calculate subtotal as (quantity * unit_price)
6. WHEN a user adds a line item, THE POS_Service SHALL apply discount if provided
7. WHEN a user adds a line item, THE POS_Service SHALL calculate line_total as (subtotal - discount)
8. WHEN a user adds a line item, THE POS_Service SHALL recalculate order totals
9. WHEN a user adds a line item, THE POS_Service SHALL set line status to 'pending'

### Requirement 8: Update Line Item

**User Story:** Como mesero/vendedor, quiero modificar líneas de orden, para que pueda corregir cantidades o agregar notas.

#### Acceptance Criteria

1. WHEN a user updates a line item, THE POS_Service SHALL validate the order is not paid
2. WHEN a user updates quantity, THE POS_Service SHALL recalculate subtotal and line_total
3. WHEN a user updates discount, THE POS_Service SHALL recalculate line_total
4. WHEN a user updates notes, THE POS_Service SHALL preserve the notes for kitchen/preparation
5. WHEN a user updates a line item, THE POS_Service SHALL recalculate order totals
6. WHEN a line item is updated, THE POS_Service SHALL update the order's updated_at timestamp

### Requirement 9: Remove Line Item

**User Story:** Como mesero/vendedor, quiero eliminar líneas de orden, para que pueda corregir errores.

#### Acceptance Criteria

1. WHEN a user removes a line item, THE POS_Service SHALL validate the order is not paid
2. WHEN a user removes a line item, THE POS_Service SHALL delete the line from the database
3. WHEN a user removes a line item, THE POS_Service SHALL recalculate order totals
4. WHEN the last line item is removed, THE POS_Service SHALL allow the order to remain with zero total

### Requirement 10: Calculate Order Totals

**User Story:** Como sistema, quiero calcular totales automáticamente, para que los montos sean precisos.

#### Acceptance Criteria

1. WHEN order totals are calculated, THE POS_Service SHALL sum all line_total values to get subtotal
2. WHEN order totals are calculated, THE POS_Service SHALL calculate tax based on configured tax rate
3. WHEN order totals are calculated, THE POS_Service SHALL apply order-level discount if provided
4. WHEN order totals are calculated, THE POS_Service SHALL add tip if provided
5. WHEN order totals are calculated, THE POS_Service SHALL calculate total as (subtotal + tax - discount + tip)
6. WHEN order totals are calculated, THE POS_Service SHALL update the order record with new totals

### Requirement 11: Process Payment

**User Story:** Como cajero, quiero procesar pagos, para que pueda completar la venta y actualizar inventario.

#### Acceptance Criteria

1. WHEN a user processes payment, THE POS_Service SHALL validate the order exists and is not already paid
2. WHEN a user processes payment, THE POS_Service SHALL validate the user has an open cash shift
3. WHEN a user processes payment with cash, THE POS_Service SHALL calculate change if received_amount > total
4. WHEN a user processes payment, THE POS_Service SHALL create a POS_Payment record
5. WHEN a user processes payment, THE POS_Service SHALL update order status to 'paid'
6. WHEN a user processes payment, THE POS_Service SHALL set paid_at timestamp
7. WHEN a user processes payment, THE POS_Service SHALL set cashier_id to the authenticated user
8. WHEN a user processes payment, THE POS_Service SHALL create inventory movements for all line items
9. WHEN a user processes payment, THE POS_Service SHALL update table status to 'available' if applicable
10. WHEN payment processing fails, THE POS_Service SHALL rollback all changes

### Requirement 12: Split Payment

**User Story:** Como cajero, quiero dividir pagos en múltiples métodos, para que pueda aceptar combinaciones de efectivo y tarjeta.

#### Acceptance Criteria

1. WHEN a user creates a split payment, THE POS_Service SHALL allow multiple POS_Payment records for one order
2. WHEN a user creates a split payment, THE POS_Service SHALL validate that sum of payments equals order total
3. WHEN a user creates a split payment, THE POS_Service SHALL mark order as paid only when total is covered
4. WHEN a user creates a split payment, THE POS_Service SHALL allow partial payments
5. WHEN a user creates a split payment, THE POS_Service SHALL track remaining balance

### Requirement 13: Open Cash Shift

**User Story:** Como cajero, quiero abrir mi turno de caja, para que pueda comenzar a procesar ventas.

#### Acceptance Criteria

1. WHEN a user opens a cash shift, THE POS_Service SHALL validate the user has pos:CashShift permission
2. WHEN a user opens a cash shift, THE POS_Service SHALL validate no other shift is open for that user and warehouse
3. WHEN a user opens a cash shift, THE POS_Service SHALL create a Cash_Shift record with status 'open'
4. WHEN a user opens a cash shift, THE POS_Service SHALL record initial_cash amount
5. WHEN a user opens a cash shift, THE POS_Service SHALL set opened_at to current timestamp
6. WHEN a user opens a cash shift, THE POS_Service SHALL set cashier_id to the authenticated user

### Requirement 14: Close Cash Shift

**User Story:** Como cajero, quiero cerrar mi turno de caja, para que pueda hacer el corte y entregar el efectivo.

#### Acceptance Criteria

1. WHEN a user closes a cash shift, THE POS_Service SHALL validate the shift is open
2. WHEN a user closes a cash shift, THE POS_Service SHALL calculate expected_cash from all cash payments
3. WHEN a user closes a cash shift, THE POS_Service SHALL record final_cash amount provided by user
4. WHEN a user closes a cash shift, THE POS_Service SHALL calculate difference as (final_cash - expected_cash)
5. WHEN a user closes a cash shift, THE POS_Service SHALL update status to 'closed'
6. WHEN a user closes a cash shift, THE POS_Service SHALL set closed_at to current timestamp
7. WHEN a user closes a cash shift, THE POS_Service SHALL generate a shift report with all transactions

### Requirement 15: Cancel POS Order

**User Story:** Como mesero/cajero, quiero cancelar órdenes, para que pueda manejar situaciones donde el cliente no completa la compra.

#### Acceptance Criteria

1. WHEN a user cancels an order, THE POS_Service SHALL validate the order is not paid
2. WHEN a user cancels an order, THE POS_Service SHALL update status to 'cancelled'
3. WHEN a user cancels an order, THE POS_Service SHALL update table status to 'available' if applicable
4. WHEN a user cancels an order, THE POS_Service SHALL NOT create inventory movements
5. WHEN a user cancels an order, THE POS_Service SHALL record cancellation reason in notes

### Requirement 16: Query POS Orders

**User Story:** Como gerente, quiero consultar órdenes con filtros, para que pueda monitorear operaciones y generar reportes.

#### Acceptance Criteria

1. WHEN a user queries orders, THE POS_Service SHALL return paginated results for their tenant
2. THE POS_Service SHALL support filtering by status
3. THE POS_Service SHALL support filtering by date range
4. THE POS_Service SHALL support filtering by waiter_id
5. THE POS_Service SHALL support filtering by cashier_id
6. THE POS_Service SHALL support filtering by table_number
7. THE POS_Service SHALL support filtering by order_number
8. THE POS_Service SHALL include related data: lines, payments, waiter, cashier
9. THE POS_Service SHALL order results by created_at descending (newest first)
10. THE POS_Service SHALL implement pagination with default 20 items per page, max 100

### Requirement 17: Kitchen Display Integration

**User Story:** Como cocinero, quiero ver órdenes pendientes en pantalla, para que pueda preparar los platillos.

#### Acceptance Criteria

1. WHEN an order status changes to 'in_progress', THE POS_Service SHALL emit an event for kitchen display
2. WHEN a line item status changes to 'preparing', THE POS_Service SHALL update the kitchen display
3. WHEN a line item status changes to 'ready', THE POS_Service SHALL notify the waiter
4. THE POS_Service SHALL provide an endpoint to query pending kitchen items
5. THE POS_Service SHALL group kitchen items by preparation area if configured

### Requirement 18: Daily Sales Report

**User Story:** Como gerente, quiero ver reportes de ventas diarias, para que pueda analizar el desempeño del negocio.

#### Acceptance Criteria

1. THE POS_Service SHALL provide a daily sales report endpoint
2. THE report SHALL include total sales amount
3. THE report SHALL include number of orders
4. THE report SHALL include average ticket size
5. THE report SHALL include sales by payment method
6. THE report SHALL include sales by waiter
7. THE report SHALL include sales by hour
8. THE report SHALL include top selling products
9. THE report SHALL filter by warehouse_id and date range

### Requirement 19: Inventory Integration

**User Story:** Como sistema, quiero actualizar inventario automáticamente al pagar, para que el stock esté sincronizado.

#### Acceptance Criteria

1. WHEN a payment is processed, THE POS_Service SHALL create inventory movements for each line item
2. WHEN creating inventory movements, THE POS_Service SHALL use movement_type 'sales_shipment'
3. WHEN creating inventory movements, THE POS_Service SHALL set reference_type to 'pos_order'
4. WHEN creating inventory movements, THE POS_Service SHALL set reference_id to the order ID
5. WHEN creating inventory movements, THE POS_Service SHALL use negative quantity to reduce stock
6. WHEN inventory movement fails, THE POS_Service SHALL rollback the payment

### Requirement 20: Permissions and Security

**User Story:** Como administrador, quiero controlar permisos de POS, para que solo usuarios autorizados puedan operar el sistema.

#### Acceptance Criteria

1. THE POS_Controller SHALL require pos:Create permission for creating orders
2. THE POS_Controller SHALL require pos:Read permission for querying orders
3. THE POS_Controller SHALL require pos:Update permission for modifying orders
4. THE POS_Controller SHALL require pos:Delete permission for cancelling orders
5. THE POS_Controller SHALL require pos:Payment permission for processing payments
6. THE POS_Controller SHALL require pos:CashShift permission for managing cash shifts
7. THE POS_Controller SHALL require pos:Reports permission for accessing reports
8. THE POS_Controller SHALL use JwtAuthGuard and PermissionGuard on all endpoints
9. THE POS_Controller SHALL enforce tenant isolation on all operations

### Requirement 21: API Documentation

**User Story:** Como desarrollador frontend, quiero documentación Swagger completa, para que pueda integrar la interfaz de usuario.

#### Acceptance Criteria

1. THE POS_Controller SHALL include ApiTags decorator with "POS" tag
2. THE POS_Controller SHALL include ApiOperation decorator for each endpoint
3. THE POS_Controller SHALL include ApiResponse decorators for all status codes
4. THE POS_Controller SHALL include ApiParam decorators for path parameters
5. THE POS_Controller SHALL include ApiQuery decorators for query parameters
6. THE POS_Controller SHALL include ApiBody decorators for request bodies
7. THE POS_Controller SHALL include ApiBearerAuth decorator for authentication

### Requirement 22: Database Migrations

**User Story:** Como administrador de base de datos, quiero migraciones para crear las tablas de POS, para que la estructura esté correctamente definida.

#### Acceptance Criteria

1. THE Migration SHALL create a pos_orders table with all required columns
2. THE Migration SHALL create a pos_order_lines table with all required columns
3. THE Migration SHALL create a pos_payments table with all required columns
4. THE Migration SHALL create a cash_shifts table with all required columns
5. THE Migration SHALL create a pos_tables table with all required columns
6. THE Migration SHALL create indexes on all foreign keys and frequently queried columns
7. THE Migration SHALL create enum types for status, payment_method, and table_status
8. THE Migration SHALL create foreign keys with appropriate CASCADE rules
9. THE Migration SHALL include down methods to rollback all changes
