# Implementation Plan: POS (Point of Sale) System

## Overview

Este plan de implementación cubre la creación completa del módulo de POS para Sinergy ERP, incluyendo cinco entidades principales (POSOrder, POSOrderLine, POSPayment, CashShift, POSTable), DTOs con validación, servicios con lógica de negocio optimizada para ventas rápidas, controlador con guards RBAC, migraciones de base de datos, integración con inventario, y tests comprehensivos.

## Tasks

### Phase 1: Database Entities

- [x] 1. Crear entidades de POS con TypeORM
  - [x] 1.1 Crear entidad POSOrder
    - Crear archivo `src/entities/pos/pos-order.entity.ts`
    - Definir entidad con decoradores TypeORM (UUID, timestamps, relaciones)
    - Configurar relaciones ManyToOne con RBACTenant, Warehouse, User (waiter), User (cashier)
    - Configurar relaciones OneToMany con POSOrderLine y POSPayment
    - Agregar campos: order_number, table_number, zone, status (enum)
    - Agregar campos financieros: subtotal, tax, discount, tip, total
    - Agregar campo paid_at (nullable timestamp)
    - Configurar índices en tenant_id, warehouse_id, order_number, status, waiter_id, created_at
    - _Requirements: 1.1-1.13_

  - [x] 1.2 Crear entidad POSOrderLine
    - Crear archivo `src/entities/pos/pos-order-line.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relación ManyToOne con POSOrder (CASCADE delete)
    - Configurar relaciones ManyToOne con Product, UoM
    - Agregar campos: quantity, unit_price, subtotal
    - Agregar campos de descuento: discount_percentage, discount_amount
    - Agregar campo line_total
    - Agregar campo notes para instrucciones especiales
    - Agregar campo status (enum: pending, preparing, ready, delivered)
    - Configurar índices en pos_order_id, product_id, status
    - _Requirements: 2.1-2.14_

  - [x] 1.3 Crear entidad POSPayment
    - Crear archivo `src/entities/pos/pos-payment.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relación ManyToOne con POSOrder (CASCADE delete)
    - Configurar relaciones ManyToOne con User (cashier), CashShift
    - Agregar campo payment_method (enum: cash, card, transfer, mixed)
    - Agregar campos: amount, received_amount, change_amount
    - Agregar campo reference para autorización de tarjeta
    - Configurar índices en pos_order_id, cashier_id, cash_shift_id, payment_method
    - _Requirements: 3.1-3.12_

  - [x] 1.4 Crear entidad CashShift
    - Crear archivo `src/entities/pos/cash-shift.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relaciones ManyToOne con RBACTenant, Warehouse, User (cashier)
    - Agregar campos: initial_cash, final_cash, expected_cash, difference
    - Agregar campo status (enum: open, closed)
    - Agregar campos: opened_at, closed_at, notes
    - Configurar índices en tenant_id, warehouse_id, cashier_id, status
    - _Requirements: 4.1-4.15_

  - [x] 1.5 Crear entidad POSTable
    - Crear archivo `src/entities/pos/pos-table.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relaciones ManyToOne con RBACTenant, Warehouse
    - Agregar campos: table_number, zone, capacity
    - Agregar campo status (enum: available, occupied, reserved, cleaning)
    - Agregar campo current_order_id (nullable UUID)
    - Configurar índice único en (tenant_id, warehouse_id, table_number)
    - Configurar índices en tenant_id, warehouse_id, status
    - _Requirements: 5.1-5.12_

### Phase 2: DTOs and Validation

- [x] 2. Crear DTOs para POS Orders

### Phase 2: DTOs and Validation

- [ ] 2. Crear DTOs para POS Orders
  - [ ] 2.1 Crear CreatePOSOrderDto
    - Crear archivo `src/api/pos/dto/create-pos-order.dto.ts`
    - Definir campos requeridos: warehouse_id
    - Definir campos opcionales: table_number, zone, notes
    - Agregar decoradores class-validator (@IsUUID, @IsString, @IsOptional)
    - Agregar decoradores Swagger (@ApiProperty, @ApiPropertyOptional)
    - _Requirements: 1.1-1.13_

  - [ ] 2.2 Crear AddLineItemDto
    - Crear archivo `src/api/pos/dto/add-line-item.dto.ts`
    - Definir campos requeridos: product_id, uom_id, quantity
    - Definir campos opcionales: discount_percentage, notes
    - Agregar validadores @Min para quantity y discount_percentage
    - Agregar decoradores Swagger
    - _Requirements: 2.1-2.14_

  - [ ] 2.3 Crear UpdateLineItemDto
    - Crear archivo `src/api/pos/dto/update-line-item.dto.ts`
    - Definir campos opcionales: quantity, discount_percentage, notes
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 2.1-2.14_

  - [ ] 2.4 Crear QueryPOSOrderDto
    - Crear archivo `src/api/pos/dto/query-pos-order.dto.ts`
    - Definir parámetros de paginación: page, limit
    - Definir filtros: warehouse_id, status, waiter_id, date_from, date_to, table_number, zone
    - Agregar decoradores @Type() para transformación
    - Agregar validadores @Min, @Max, @IsEnum
    - _Requirements: 1.1-1.13_

- [ ] 3. Crear DTOs para Payments
  - [ ] 3.1 Crear ProcessPaymentDto
    - Crear archivo `src/api/pos/dto/process-payment.dto.ts`
    - Definir campos requeridos: payment_method, amount
    - Definir campos opcionales: received_amount, reference, tip
    - Agregar validador @IsEnum para payment_method
    - Agregar validador @Min(0) para amounts
    - Agregar decoradores Swagger
    - _Requirements: 3.1-3.12_

  - [ ] 3.2 Crear SplitPaymentDto
    - Crear archivo `src/api/pos/dto/split-payment.dto.ts`
    - Definir campo payments: array de ProcessPaymentDto
    - Agregar validador @IsArray() y @ValidateNested()
    - Agregar decoradores Swagger
    - _Requirements: 3.1-3.12_

- [ ] 4. Crear DTOs para Cash Shifts
  - [ ] 4.1 Crear OpenCashShiftDto
    - Crear archivo `src/api/pos/dto/open-cash-shift.dto.ts`
    - Definir campos requeridos: warehouse_id, initial_cash
    - Definir campo opcional: notes
    - Agregar validador @Min(0) para initial_cash
    - Agregar decoradores Swagger
    - _Requirements: 4.1-4.15_

  - [ ] 4.2 Crear CloseCashShiftDto
    - Crear archivo `src/api/pos/dto/close-cash-shift.dto.ts`
    - Definir campo requerido: final_cash
    - Definir campo opcional: notes
    - Agregar validador @Min(0) para final_cash
    - Agregar decoradores Swagger
    - _Requirements: 4.1-4.15_

  - [ ] 4.3 Crear QueryCashShiftDto
    - Crear archivo `src/api/pos/dto/query-cash-shift.dto.ts`
    - Definir parámetros de paginación: page, limit
    - Definir filtros: warehouse_id, cashier_id, status, date_from, date_to
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 4.1-4.15_

- [ ] 5. Crear DTOs adicionales
  - [ ] 5.1 Crear UpdateLineStatusDto
    - Crear archivo `src/api/pos/dto/update-line-status.dto.ts`
    - Definir campo requerido: status (enum: pending, preparing, ready, delivered)
    - Agregar validador @IsEnum
    - Agregar decoradores Swagger
    - _Requirements: 2.1-2.14_

  - [ ] 5.2 Crear CancelOrderDto
    - Crear archivo `src/api/pos/dto/cancel-order.dto.ts`
    - Definir campo requerido: reason
    - Agregar validador @IsString, @IsNotEmpty
    - Agregar decoradores Swagger
    - _Requirements: 1.1-1.13_

  - [ ] 5.3 Crear DTOs para reportes
    - Crear archivo `src/api/pos/dto/daily-sales-query.dto.ts`
    - Crear archivo `src/api/pos/dto/waiter-performance-query.dto.ts`
    - Crear archivo `src/api/pos/dto/top-products-query.dto.ts`
    - Definir parámetros de fecha y filtros apropiados
    - Agregar decoradores class-validator y Swagger
    - _Requirements: 6.1-6.15_

### Phase 3: Services Implementation

- [ ] 6. Implementar POSService - Order Management
  - [ ] 6.1 Crear estructura base del servicio
    - Crear archivo `src/api/pos/pos.service.ts`
    - Inyectar repositorios: POSOrder, POSOrderLine, POSPayment, POSTable
    - Inyectar servicios: InventoryService, ProductService, CashShiftService
    - Inyectar DataSource para transacciones
    - Agregar decorador @Injectable()
    - _Requirements: 1.1-1.13_

  - [ ] 6.2 Implementar método createOrder
    - Validar que warehouse_id existe y pertenece al tenant
    - Generar order_number secuencial (formato: POS-YYYYMMDD-XXXX)
    - Crear POSOrder con status 'pending'
    - Asignar waiter_id del usuario autenticado
    - Si table_number proporcionado, validar disponibilidad y asignar
    - Inicializar totales en 0
    - Retornar orden creada
    - _Requirements: 1.1-1.13_

  - [ ] 6.3 Implementar método findOrder
    - Buscar por id y tenant_id
    - Incluir relaciones: lines (con product, uom), payments, waiter, cashier
    - Lanzar NotFoundException si no existe
    - _Requirements: 1.1-1.13_

  - [ ] 6.4 Implementar método findOrders con paginación
    - Filtrar por tenant_id
    - Aplicar filtros opcionales: warehouse_id, status, waiter_id, date range, table_number, zone
    - Incluir relaciones: waiter, cashier, warehouse
    - Ordenar por created_at DESC
    - Implementar paginación
    - _Requirements: 1.1-1.13_

  - [ ] 6.5 Implementar método cancelOrder
    - Validar que orden existe y pertenece al tenant
    - Validar que orden no está pagada (status != 'paid')
    - Actualizar status = 'cancelled'
    - Registrar reason en notes
    - Si hay reservas de stock, cancelarlas
    - Si hay mesa asignada, liberarla
    - Retornar orden actualizada
    - _Requirements: 1.1-1.13_

- [ ] 7. Implementar POSService - Line Item Management
  - [ ] 7.1 Implementar método addLineItem
    - Validar que orden existe, pertenece al tenant y no está pagada
    - Validar que product_id existe y pertenece al tenant
    - Validar que uom_id está asignado al producto
    - Obtener precio del producto (unit_price)
    - Calcular subtotal = quantity * unit_price
    - Calcular discount_amount = subtotal * (discount_percentage / 100)
    - Calcular line_total = subtotal - discount_amount
    - Crear POSOrderLine con status 'pending'
    - Recalcular totales de la orden
    - Retornar línea creada
    - _Requirements: 2.1-2.14_

  - [ ] 7.2 Implementar método updateLineItem
    - Validar que línea existe y pertenece al tenant
    - Validar que orden no está pagada
    - Actualizar campos permitidos: quantity, discount_percentage, notes
    - Recalcular subtotal, discount_amount, line_total
    - Recalcular totales de la orden
    - Retornar línea actualizada
    - _Requirements: 2.1-2.14_

  - [ ] 7.3 Implementar método removeLineItem
    - Validar que línea existe y pertenece al tenant
    - Validar que orden no está pagada
    - Eliminar línea
    - Recalcular totales de la orden
    - _Requirements: 2.1-2.14_

  - [ ] 7.4 Implementar método calculateOrderTotals (privado)
    - Obtener todas las líneas de la orden
    - Calcular subtotal = suma de line_total de todas las líneas
    - Calcular tax (si aplica, según configuración)
    - Calcular total = subtotal + tax - discount + tip
    - Actualizar campos de la orden
    - Guardar orden
    - _Requirements: 1.1-1.13_

- [ ] 8. Implementar POSService - Payment Processing
  - [ ] 8.1 Implementar método processPayment
    - Validar que orden existe, pertenece al tenant y no está pagada
    - Validar que amount >= orden.total
    - Obtener cash shift activo del cajero
    - Validar que cash shift existe y está abierto
    - Si payment_method = 'cash', calcular change_amount = received_amount - amount
    - Crear POSPayment con cashier_id y cash_shift_id
    - Actualizar orden: status = 'paid', paid_at = now(), cashier_id
    - Crear movimientos de inventario (sales_shipment) para todas las líneas
    - Si hay mesa asignada, liberarla
    - Retornar payment creado
    - _Requirements: 3.1-3.12_

  - [ ] 8.2 Implementar método processSplitPayment
    - Validar que orden existe, pertenece al tenant y no está pagada
    - Validar que suma de amounts = orden.total
    - Obtener cash shift activo del cajero
    - Usar transacción de base de datos
    - Crear múltiples POSPayment records
    - Actualizar orden: status = 'paid', paid_at = now(), cashier_id
    - Crear movimientos de inventario
    - Si hay mesa asignada, liberarla
    - Retornar array de payments creados
    - _Requirements: 3.1-3.12_

  - [ ] 8.3 Implementar método validateOrderNotPaid (privado)
    - Verificar que orden.status != 'paid'
    - Lanzar BadRequestException si ya está pagada
    - _Requirements: 1.1-1.13_

  - [ ] 8.4 Implementar método createInventoryMovements (privado)
    - Para cada línea de la orden:
      - Crear InventoryMovement tipo 'sales_shipment'
      - Usar quantity negativo
      - Referenciar: reference_type = 'pos_order', reference_id = order.id
      - Usar warehouse_id de la orden
      - Usar unit_cost del producto
    - Usar InventoryService.createInventoryMovement
    - _Requirements: 7.1-7.8_

- [ ] 9. Implementar POSService - Table Management
  - [ ] 9.1 Implementar método assignTable
    - Validar que orden existe, pertenece al tenant y no está pagada
    - Buscar POSTable por table_number, warehouse_id, tenant_id
    - Validar que mesa existe
    - Validar que mesa está disponible (status = 'available')
    - Actualizar orden: table_number, zone
    - Actualizar mesa: status = 'occupied', current_order_id = order.id
    - Retornar orden actualizada
    - _Requirements: 5.1-5.12_

  - [ ] 9.2 Implementar método releaseTable
    - Buscar POSTable por table_number, warehouse_id, tenant_id
    - Si mesa existe y está ocupada:
      - Actualizar mesa: status = 'available', current_order_id = null
    - _Requirements: 5.1-5.12_

- [ ] 10. Implementar POSService - Kitchen Integration
  - [ ] 10.1 Implementar método updateLineStatus
    - Validar que línea existe y pertenece al tenant
    - Validar que status es válido (pending, preparing, ready, delivered)
    - Actualizar línea.status
    - Si todas las líneas están 'ready', actualizar orden.status = 'ready'
    - Retornar línea actualizada
    - _Requirements: 2.1-2.14_

  - [ ] 10.2 Implementar método getKitchenOrders
    - Filtrar por tenant_id y warehouse_id
    - Filtrar por status IN ('pending', 'in_progress', 'ready')
    - Incluir relaciones: lines (con product), waiter
    - Ordenar por created_at ASC (más antiguas primero)
    - Retornar órdenes para display de cocina
    - _Requirements: 1.1-1.13_

- [ ] 11. Implementar POSService - Helper Methods
  - [ ] 11.1 Implementar método generateOrderNumber (privado)
    - Formato: POS-YYYYMMDD-XXXX
    - Obtener fecha actual
    - Contar órdenes del día para el tenant y warehouse
    - Generar número secuencial con padding de 4 dígitos
    - Retornar order_number único
    - _Requirements: 1.1-1.13_

- [ ] 12. Implementar CashShiftService
  - [ ] 12.1 Crear estructura base del servicio
    - Crear archivo `src/api/pos/cash-shift.service.ts`
    - Inyectar repositorios: CashShift, POSPayment
    - Agregar decorador @Injectable()
    - _Requirements: 4.1-4.15_

  - [ ] 12.2 Implementar método openShift
    - Validar que no hay turno abierto para el cajero en el warehouse
    - Crear CashShift con status 'open'
    - Registrar: cashier_id, warehouse_id, tenant_id, initial_cash, opened_at = now()
    - Retornar shift creado
    - _Requirements: 4.1-4.15_

  - [ ] 12.3 Implementar método closeShift
    - Validar que shift existe, pertenece al tenant y está abierto
    - Calcular expected_cash = initial_cash + suma de pagos en efectivo del turno
    - Registrar final_cash del DTO
    - Calcular difference = final_cash - expected_cash
    - Actualizar: status = 'closed', closed_at = now()
    - Retornar shift actualizado
    - _Requirements: 4.1-4.15_

  - [ ] 12.4 Implementar método getCurrentShift
    - Buscar CashShift por cashier_id, warehouse_id, tenant_id, status = 'open'
    - Retornar shift activo o null
    - _Requirements: 4.1-4.15_

  - [ ] 12.5 Implementar método getShiftReport
    - Obtener shift por id y tenant_id
    - Obtener todos los pagos del turno (cash_shift_id)
    - Agrupar pagos por payment_method
    - Calcular totales por método de pago
    - Calcular número de órdenes procesadas
    - Calcular ticket promedio
    - Retornar reporte completo
    - _Requirements: 6.1-6.15_

  - [ ] 12.6 Implementar método validateNoOpenShift (privado)
    - Buscar shift abierto para cashier y warehouse
    - Lanzar BadRequestException si existe
    - _Requirements: 4.1-4.15_

  - [ ] 12.7 Implementar método calculateExpectedCash (privado)
    - Obtener shift
    - Sumar initial_cash + pagos en efectivo del turno
    - Retornar expected_cash
    - _Requirements: 4.1-4.15_

- [ ] 13. Implementar POSReportService
  - [ ] 13.1 Crear estructura base del servicio
    - Crear archivo `src/api/pos/pos-report.service.ts`
    - Inyectar repositorios: POSOrder, POSPayment, POSOrderLine
    - Agregar decorador @Injectable()
    - _Requirements: 6.1-6.15_

  - [ ] 13.2 Implementar método getDailySalesReport
    - Filtrar órdenes por tenant_id, warehouse_id, fecha específica
    - Filtrar por status = 'paid'
    - Calcular: total_sales, total_orders, average_ticket
    - Agrupar ventas por hora del día
    - Agrupar ventas por método de pago
    - Calcular total de propinas
    - Calcular total de descuentos
    - Retornar reporte completo
    - _Requirements: 6.1-6.15_

  - [ ] 13.3 Implementar método getWaiterPerformance
    - Filtrar órdenes por tenant_id, waiter_id, rango de fechas
    - Filtrar por status = 'paid'
    - Calcular: total_sales, total_orders, average_ticket
    - Calcular total de propinas recibidas
    - Calcular tiempo promedio de atención
    - Retornar reporte de desempeño
    - _Requirements: 6.1-6.15_

  - [ ] 13.4 Implementar método getTopProducts
    - Filtrar líneas de órdenes por tenant_id, warehouse_id, rango de fechas
    - Filtrar órdenes con status = 'paid'
    - Agrupar por product_id
    - Calcular: quantity_sold, total_revenue
    - Ordenar por quantity_sold DESC
    - Limitar a top N productos (configurable)
    - Incluir información del producto
    - Retornar lista de productos más vendidos
    - _Requirements: 6.1-6.15_

  - [ ] 13.5 Implementar método getSalesByHour
    - Filtrar órdenes por tenant_id, warehouse_id, fecha específica
    - Filtrar por status = 'paid'
    - Agrupar por hora del día (extraer hora de paid_at)
    - Calcular total_sales y order_count por hora
    - Retornar array de 24 elementos (una por hora)
    - _Requirements: 6.1-6.15_

  - [ ] 13.6 Implementar método getSalesByPaymentMethod
    - Filtrar pagos por tenant_id, warehouse_id, rango de fechas
    - Agrupar por payment_method
    - Calcular: total_amount, payment_count
    - Calcular porcentaje de cada método
    - Retornar reporte por método de pago
    - _Requirements: 6.1-6.15_

- [ ] 14. Checkpoint - Verificar servicios
  - Revisar que todos los métodos están implementados
  - Verificar manejo de errores apropiado
  - Verificar validaciones de tenant_id en todos los métodos
  - Verificar uso correcto de transacciones donde sea necesario

### Phase 4: Controller Implementation

- [ ] 15. Implementar POSController - Orders
  - [ ] 15.1 Crear estructura base del controlador
    - Crear archivo `src/api/pos/pos.controller.ts`
    - Inyectar servicios: POSService, CashShiftService, POSReportService
    - Agregar decoradores: @Controller('tenant/pos'), @ApiTags('POS'), @ApiBearerAuth()
    - Agregar guards: @UseGuards(JwtAuthGuard, PermissionGuard)
    - _Requirements: 8.1-8.7_

  - [ ] 15.2 Implementar endpoints CRUD para Orders
    - POST /tenant/pos/orders - Crear orden
      - @RequirePermissions({ entityType: 'pos', action: 'Create' })
      - Extraer tenantId y userId (waiter) del request
      - Llamar posService.createOrder
      - Retornar 201 Created
    - GET /tenant/pos/orders - Listar órdenes con filtros
      - @RequirePermissions({ entityType: 'pos', action: 'Read' })
      - Extraer tenantId del request
      - Llamar posService.findOrders con query params
      - Retornar 200 OK con paginación
    - GET /tenant/pos/orders/:id - Obtener orden específica
      - @RequirePermissions({ entityType: 'pos', action: 'Read' })
      - Extraer tenantId del request
      - Llamar posService.findOrder
      - Retornar 200 OK
    - POST /tenant/pos/orders/:id/cancel - Cancelar orden
      - @RequirePermissions({ entityType: 'pos', action: 'Delete' })
      - Extraer tenantId del request
      - Llamar posService.cancelOrder
      - Retornar 200 OK
    - Agregar documentación Swagger completa para cada endpoint
    - _Requirements: 8.1-8.7_

- [ ] 16. Implementar POSController - Line Items
  - [ ] 16.1 Implementar endpoints para Line Items
    - POST /tenant/pos/orders/:id/lines - Agregar línea
      - @RequirePermissions({ entityType: 'pos', action: 'Update' })
      - Extraer tenantId del request
      - Llamar posService.addLineItem
      - Retornar 201 Created
    - PUT /tenant/pos/lines/:id - Actualizar línea
      - @RequirePermissions({ entityType: 'pos', action: 'Update' })
      - Extraer tenantId del request
      - Llamar posService.updateLineItem
      - Retornar 200 OK
    - DELETE /tenant/pos/lines/:id - Eliminar línea
      - @RequirePermissions({ entityType: 'pos', action: 'Update' })
      - Extraer tenantId del request
      - Llamar posService.removeLineItem
      - Retornar 204 No Content
    - Agregar documentación Swagger
    - _Requirements: 8.1-8.7_

- [ ] 17. Implementar POSController - Payments
  - [ ] 17.1 Implementar endpoints para Payments
    - POST /tenant/pos/orders/:id/payment - Procesar pago
      - @RequirePermissions({ entityType: 'pos', action: 'Payment' })
      - Extraer tenantId y userId (cashier) del request
      - Llamar posService.processPayment
      - Retornar 201 Created con payment details
    - POST /tenant/pos/orders/:id/split-payment - Procesar pago dividido
      - @RequirePermissions({ entityType: 'pos', action: 'Payment' })
      - Extraer tenantId y userId (cashier) del request
      - Llamar posService.processSplitPayment
      - Retornar 201 Created con array de payments
    - Agregar documentación Swagger
    - _Requirements: 8.1-8.7_

- [ ] 18. Implementar POSController - Cash Shifts
  - [ ] 18.1 Implementar endpoints para Cash Shifts
    - POST /tenant/pos/cash-shifts/open - Abrir turno
      - @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
      - Extraer tenantId y userId (cashier) del request
      - Llamar cashShiftService.openShift
      - Retornar 201 Created
    - POST /tenant/pos/cash-shifts/:id/close - Cerrar turno
      - @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
      - Extraer tenantId del request
      - Llamar cashShiftService.closeShift
      - Retornar 200 OK
    - GET /tenant/pos/cash-shifts/current - Obtener turno actual
      - @RequirePermissions({ entityType: 'pos', action: 'CashShift' })
      - Extraer tenantId y userId (cashier) del request
      - Extraer warehouse_id de query params
      - Llamar cashShiftService.getCurrentShift
      - Retornar 200 OK
    - GET /tenant/pos/cash-shifts/:id/report - Obtener reporte de turno
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Llamar cashShiftService.getShiftReport
      - Retornar 200 OK
    - Agregar documentación Swagger
    - _Requirements: 8.1-8.7_

- [ ] 19. Implementar POSController - Kitchen
  - [ ] 19.1 Implementar endpoints para Kitchen Display
    - GET /tenant/pos/kitchen/orders - Obtener órdenes para cocina
      - @RequirePermissions({ entityType: 'pos', action: 'Read' })
      - Extraer tenantId del request
      - Extraer warehouse_id de query params
      - Llamar posService.getKitchenOrders
      - Retornar 200 OK
    - PUT /tenant/pos/kitchen/lines/:id/status - Actualizar estado de línea
      - @RequirePermissions({ entityType: 'pos', action: 'Update' })
      - Extraer tenantId del request
      - Llamar posService.updateLineStatus
      - Retornar 200 OK
    - Agregar documentación Swagger
    - _Requirements: 8.1-8.7_

- [ ] 20. Implementar POSController - Reports
  - [ ] 20.1 Implementar endpoints de reportes
    - GET /tenant/pos/reports/daily-sales - Reporte de ventas diarias
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Extraer query params: warehouse_id, date
      - Llamar posReportService.getDailySalesReport
      - Retornar 200 OK
    - GET /tenant/pos/reports/waiter-performance - Desempeño de meseros
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Extraer query params: waiter_id, date_from, date_to
      - Llamar posReportService.getWaiterPerformance
      - Retornar 200 OK
    - GET /tenant/pos/reports/top-products - Productos más vendidos
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Extraer query params: warehouse_id, date_from, date_to, limit
      - Llamar posReportService.getTopProducts
      - Retornar 200 OK
    - GET /tenant/pos/reports/sales-by-hour - Ventas por hora
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Extraer query params: warehouse_id, date
      - Llamar posReportService.getSalesByHour
      - Retornar 200 OK
    - GET /tenant/pos/reports/payment-methods - Ventas por método de pago
      - @RequirePermissions({ entityType: 'pos', action: 'Reports' })
      - Extraer tenantId del request
      - Extraer query params: warehouse_id, date_from, date_to
      - Llamar posReportService.getSalesByPaymentMethod
      - Retornar 200 OK
    - Agregar documentación Swagger completa
    - _Requirements: 8.1-8.7_

- [ ] 21. Checkpoint - Verificar controlador
  - Revisar que todos los endpoints están implementados
  - Verificar guards y permisos correctos
  - Verificar documentación Swagger completa
  - Verificar manejo de errores HTTP apropiado

### Phase 5: Module Configuration

- [ ] 22. Configurar POSModule
  - [ ] 22.1 Crear archivo de módulo
    - Crear archivo `src/api/pos/pos.module.ts`
    - Importar TypeOrmModule.forFeature([POSOrder, POSOrderLine, POSPayment, CashShift, POSTable])
    - Importar RBACModule para autenticación y autorización
    - Importar forwardRef(() => InventoryModule) para evitar dependencias circulares
    - Importar ProductsModule para catálogo de productos
    - Importar WarehouseModule para validación de almacenes
    - Declarar providers: POSService, CashShiftService, POSReportService
    - Declarar controllers: POSController
    - Exportar: POSService, CashShiftService, POSReportService
    - _Requirements: 9.1-9.8_

- [ ] 23. Integrar módulo en app.module.ts
  - Importar POSModule en el array imports de AppModule
  - Verificar que el módulo se registre correctamente
  - Verificar que no hay conflictos de dependencias
  - _Requirements: 9.1-9.8_

### Phase 6: Database Migrations

- [ ] 24. Crear migraciones de base de datos
  - [ ] 24.1 Crear migración para pos_orders
    - Crear archivo `src/database/migrations/{timestamp}-create-pos-orders-table.ts`
    - Implementar método up:
      - Crear enum pos_order_status (pending, in_progress, ready, paid, cancelled)
      - Crear tabla pos_orders con todas las columnas
      - Crear índices: tenant_id, warehouse_id, order_number, status, waiter_id, created_at
      - Crear foreign keys con CASCADE delete para tenant, RESTRICT para warehouse, waiter, cashier
    - Implementar método down
    - _Requirements: 10.1, 10.5, 10.6, 10.7_

  - [ ] 24.2 Crear migración para pos_order_lines
    - Crear archivo `src/database/migrations/{timestamp}-create-pos-order-lines-table.ts`
    - Implementar método up:
      - Crear enum pos_line_status (pending, preparing, ready, delivered)
      - Crear tabla pos_order_lines con todas las columnas
      - Crear índices: pos_order_id, product_id, status
      - Crear foreign keys con CASCADE delete para pos_order, RESTRICT para product, uom
    - Implementar método down
    - _Requirements: 10.2, 10.5, 10.6, 10.7_

  - [ ] 24.3 Crear migración para pos_payments
    - Crear archivo `src/database/migrations/{timestamp}-create-pos-payments-table.ts`
    - Implementar método up:
      - Crear enum pos_payment_method (cash, card, transfer, mixed)
      - Crear tabla pos_payments con todas las columnas
      - Crear índices: pos_order_id, cashier_id, cash_shift_id, payment_method
      - Crear foreign keys con CASCADE delete para pos_order, RESTRICT para cashier, cash_shift
    - Implementar método down
    - _Requirements: 10.3, 10.5, 10.6, 10.7_

  - [ ] 24.4 Crear migración para cash_shifts
    - Crear archivo `src/database/migrations/{timestamp}-create-cash-shifts-table.ts`
    - Implementar método up:
      - Crear enum cash_shift_status (open, closed)
      - Crear tabla cash_shifts con todas las columnas
      - Crear índices: tenant_id, warehouse_id, cashier_id, status
      - Crear foreign keys con CASCADE delete para tenant, RESTRICT para warehouse, cashier
    - Implementar método down
    - _Requirements: 10.4, 10.5, 10.6, 10.7_

  - [ ] 24.5 Crear migración para pos_tables
    - Crear archivo `src/database/migrations/{timestamp}-create-pos-tables-table.ts`
    - Implementar método up:
      - Crear enum pos_table_status (available, occupied, reserved, cleaning)
      - Crear tabla pos_tables con todas las columnas
      - Crear índice único: (tenant_id, warehouse_id, table_number)
      - Crear índices: tenant_id, warehouse_id, status
      - Crear foreign keys con CASCADE delete para tenant, RESTRICT para warehouse
    - Implementar método down
    - _Requirements: 10.5, 10.6, 10.7_

- [ ] 25. Ejecutar y verificar migraciones
  - Ejecutar migraciones en base de datos de desarrollo
  - Verificar que todas las tablas se crean correctamente
  - Verificar que todos los índices existen
  - Verificar que las foreign keys funcionan correctamente
  - Testear rollback (down) de migraciones
  - _Requirements: 10.1-10.7_

### Phase 7: Integration with Inventory

- [ ] 26. Integración con Inventory Module
  - [ ] 26.1 Configurar integración automática
    - Verificar que POSModule importa InventoryModule con forwardRef
    - Verificar que POSService inyecta InventoryService
    - _Requirements: 7.1-7.8_

  - [ ] 26.2 Implementar creación de movimientos de inventario
    - En POSService.processPayment, después de marcar orden como pagada:
      - Llamar createInventoryMovements para todas las líneas
      - Crear movimientos tipo 'sales_shipment' con quantity negativo
      - Referenciar: reference_type = 'pos_order', reference_id = order.id
      - Usar warehouse_id de la orden
    - Manejar errores de stock insuficiente apropiadamente
    - _Requirements: 7.1-7.8_

  - [ ] 26.3 Escribir tests de integración
    - Test: Crear orden → Agregar líneas → Procesar pago → Verificar movimientos de inventario creados
    - Test: Procesar pago con stock insuficiente → Verificar error apropiado
    - Test: Cancelar orden antes de pagar → Verificar que no se crean movimientos
    - _Requirements: 7.1-7.8_

### Phase 8: Testing

- [ ] 27. Tests unitarios para POSService
  - [ ] 27.1 Escribir tests para Order Management
    - Mockear repositorios y servicios
    - Test createOrder: verificar generación de order_number, asignación de waiter
    - Test findOrder: verificar carga de relaciones
    - Test findOrders: verificar filtros y paginación
    - Test cancelOrder: verificar validaciones y actualización de status
    - _Requirements: 1.1-1.13_

  - [ ] 27.2 Escribir tests para Line Item Management
    - Test addLineItem: verificar cálculos de totales
    - Test updateLineItem: verificar recálculo de totales
    - Test removeLineItem: verificar eliminación y recálculo
    - Test calculateOrderTotals: verificar cálculos correctos
    - _Requirements: 2.1-2.14_

  - [ ] 27.3 Escribir tests para Payment Processing
    - Test processPayment: verificar creación de payment, actualización de orden
    - Test processSplitPayment: verificar múltiples payments, suma correcta
    - Test processPayment con cash: verificar cálculo de cambio
    - Test validaciones: orden ya pagada, cash shift no abierto
    - _Requirements: 3.1-3.12_

  - [ ] 27.4 Escribir tests para Table Management
    - Test assignTable: verificar asignación y actualización de mesa
    - Test releaseTable: verificar liberación de mesa
    - Test validaciones: mesa no disponible, mesa no existe
    - _Requirements: 5.1-5.12_

  - [ ] 27.5 Escribir tests para Kitchen Integration
    - Test updateLineStatus: verificar actualización de status
    - Test getKitchenOrders: verificar filtros y ordenamiento
    - Test actualización de orden cuando todas las líneas están ready
    - _Requirements: 2.1-2.14_

- [ ] 28. Tests unitarios para CashShiftService
  - [ ] 28.1 Escribir tests para Cash Shift Management
    - Test openShift: verificar creación de shift
    - Test closeShift: verificar cálculos de expected_cash y difference
    - Test getCurrentShift: verificar búsqueda de shift activo
    - Test getShiftReport: verificar cálculos de reporte
    - Test validaciones: turno ya abierto, turno no existe
    - _Requirements: 4.1-4.15_

- [ ] 29. Tests unitarios para POSReportService
  - [ ] 29.1 Escribir tests para Reports
    - Test getDailySalesReport: verificar cálculos y agrupaciones
    - Test getWaiterPerformance: verificar métricas de desempeño
    - Test getTopProducts: verificar ordenamiento y límite
    - Test getSalesByHour: verificar agrupación por hora
    - Test getSalesByPaymentMethod: verificar agrupación por método
    - _Requirements: 6.1-6.15_

- [ ] 30. Tests unitarios para POSController
  - [ ] 30.1 Escribir tests para todos los endpoints
    - Mockear servicios
    - Testear extracción correcta de tenantId y userId
    - Testear llamadas correctas a métodos de servicios
    - Testear respuestas HTTP apropiadas (200, 201, 204, 404, etc.)
    - Testear manejo de errores
    - _Requirements: 8.1-8.7_

- [ ] 31. Tests end-to-end
  - [ ] 31.1 Escribir tests E2E para flujos principales
    - Test: Abrir turno → Crear orden → Agregar líneas → Procesar pago → Cerrar turno
    - Test: Crear orden con mesa → Asignar mesa → Pagar → Verificar mesa liberada
    - Test: Crear orden → Agregar líneas → Actualizar líneas → Eliminar líneas
    - Test: Procesar pago dividido → Verificar múltiples payments
    - Test: Cancelar orden → Verificar status y liberación de recursos
    - Test: Kitchen flow → Crear orden → Actualizar status de líneas → Verificar orden ready
    - Test: Reportes → Crear múltiples órdenes → Verificar reportes correctos
    - _Requirements: 1.1-6.15_

- [ ] 32. Checkpoint final - Verificar tests completos
  - Ejecutar todos los tests (unitarios, integración, E2E)
  - Verificar cobertura de código (objetivo: >80%)
  - Verificar que todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Documentation and Deployment

- [ ] 33. Documentación adicional
  - [ ] 33.1 Crear guía de uso del módulo
    - Crear archivo `POS_SYSTEM_GUIDE.md`
    - Documentar flujo completo de uso:
      - Apertura de turno de caja
      - Creación de órdenes
      - Gestión de mesas (restaurantes)
      - Procesamiento de pagos
      - Cierre de turno
    - Documentar integración con inventario
    - Documentar display de cocina
    - Incluir ejemplos de requests/responses
    - _Requirements: 1.1-9.8_

  - [ ] 33.2 Crear guía de reportes
    - Documentar todos los reportes disponibles
    - Explicar métricas y cálculos
    - Incluir ejemplos de uso
    - Documentar casos de uso comunes
    - _Requirements: 6.1-6.15_

  - [ ] 33.3 Crear guía de troubleshooting
    - Documentar errores comunes y soluciones
    - Documentar validaciones y restricciones
    - Documentar mejores prácticas
    - Incluir FAQ
    - _Requirements: 1.1-9.8_

- [ ] 34. Preparar para producción
  - [ ] 34.1 Configurar permisos RBAC
    - Crear permisos en sistema RBAC:
      - pos:Create - Crear órdenes
      - pos:Read - Ver órdenes y reportes
      - pos:Update - Modificar órdenes y líneas
      - pos:Delete - Cancelar órdenes
      - pos:Payment - Procesar pagos
      - pos:CashShift - Gestionar turnos de caja
      - pos:Reports - Acceder a reportes
    - Asignar permisos a roles apropiados:
      - Mesero: Create, Read, Update
      - Cajero: Read, Payment, CashShift
      - Gerente: Todos los permisos
    - Documentar matriz de permisos
    - _Requirements: 8.1-8.7_

  - [ ] 34.2 Configurar monitoreo y logging
    - Agregar logs para operaciones críticas:
      - Apertura/cierre de turnos
      - Procesamiento de pagos
      - Cancelación de órdenes
      - Errores de inventario
    - Configurar alertas para:
      - Diferencias en cierre de caja
      - Errores de stock insuficiente
      - Órdenes sin pagar por mucho tiempo
    - Configurar métricas de performance:
      - Tiempo de creación de órdenes
      - Tiempo de procesamiento de pagos
      - Throughput de órdenes por hora
    - _Requirements: 1.1-9.8_

  - [ ] 34.3 Optimización de performance
    - Revisar y optimizar índices de base de datos
    - Configurar eager loading apropiado para relaciones frecuentes
    - Implementar caching para:
      - Precios de productos
      - Configuración de POS
      - Turnos activos
    - Optimizar queries de reportes con agregaciones
    - Considerar paginación para listas grandes
    - Implementar rate limiting en endpoints críticos
    - _Requirements: 1.1-9.8_

  - [ ] 34.4 Configuración de tablas (opcional para restaurantes)
    - Crear script de seed para tablas iniciales
    - Documentar proceso de configuración de mesas
    - Implementar endpoint para gestión de mesas (CRUD)
    - Agregar validaciones de capacidad
    - _Requirements: 5.1-5.12_

  - [ ] 34.5 Validación final pre-producción
    - Ejecutar todos los tests en ambiente de staging
    - Verificar migraciones en base de datos de staging
    - Realizar pruebas de carga:
      - Múltiples órdenes simultáneas
      - Múltiples cajeros activos
      - Reportes con grandes volúmenes de datos
    - Verificar documentación Swagger completa y correcta
    - Verificar logs y monitoreo funcionando
    - Realizar pruebas de seguridad:
      - Validar aislamiento de tenants
      - Validar permisos RBAC
      - Validar validación de inputs
    - _Requirements: 1.1-10.7_

## Notes

- Este módulo es crítico para operaciones en tiempo real, la performance es esencial
- La integración con inventario debe ser robusta para evitar sobreventa
- Los turnos de caja son fundamentales para control financiero y auditoría
- El sistema debe soportar alta concurrencia (múltiples meseros/cajeros simultáneos)
- La gestión de mesas es opcional pero importante para restaurantes
- Los reportes deben ser rápidos incluso con grandes volúmenes de datos
- Todos los movimientos financieros deben ser auditables (cashier_id, timestamps)
- El módulo sigue los estándares establecidos en MODULE_STANDARD.md
- TypeScript es el lenguaje de implementación según el diseño
- Considerar implementación de WebSockets para actualizaciones en tiempo real (kitchen display)
- La validación de stock debe ser transaccional para evitar race conditions
- Los pagos divididos requieren validación estricta de suma de amounts
- El order_number debe ser único por tenant y warehouse
- Considerar implementación de impresión de tickets (futuro)
- Considerar integración con sistemas de pago externos (futuro)

## Acceptance Criteria

Para considerar el módulo completo, se deben cumplir los siguientes criterios:

1. Todas las entidades creadas y migraciones ejecutadas exitosamente
2. Todos los DTOs implementados con validación completa
3. Todos los servicios implementados con lógica de negocio correcta
4. Todos los endpoints del controlador funcionando correctamente
5. Integración con inventario funcionando automáticamente
6. Todos los tests (unitarios, integración, E2E) pasando con >80% cobertura
7. Documentación completa (Swagger + guías de uso)
8. Permisos RBAC configurados correctamente
9. Monitoreo y logging implementados
10. Performance optimizada para operaciones en tiempo real
11. Validación de seguridad y aislamiento de tenants completada
12. Pruebas de carga exitosas en staging

