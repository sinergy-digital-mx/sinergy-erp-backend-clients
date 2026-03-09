# Implementation Plan: Inventory Management Module

## Overview

Este plan de implementación cubre la creación completa del módulo de Inventory Management para Sinergy ERP, incluyendo tres entidades principales (InventoryItem, InventoryMovement, StockReservation), DTOs con validación, servicios con lógica de negocio multi-tenant y valorización, controlador con guards RBAC, migraciones de base de datos, y tests comprehensivos.

## Tasks

### Phase 1: Database Entities

- [ ] 1. Crear entidades de inventario con TypeORM
  - [x] 1.1 Crear entidad InventoryItem
    - Crear archivo `src/entities/inventory/inventory-item.entity.ts`
    - Definir entidad con decoradores TypeORM (UUID, timestamps, relaciones)
    - Configurar relaciones ManyToOne con RBACTenant, Product, Warehouse, UnitOfMeasure
    - Agregar campos de cantidad: quantity_on_hand, quantity_reserved, quantity_available
    - Agregar campos de reorden: reorder_point, reorder_quantity
    - Agregar campos de valorización: valuation_method (enum), unit_cost, total_value, cost_layers (JSON)
    - Agregar campo location para ubicación física
    - Configurar índices en tenant_id, product_id, warehouse_id
    - Configurar índice único en (tenant_id, product_id, warehouse_id, uom_id, location)
    - _Requirements: 1.1-1.20_

  - [x] 1.2 Crear entidad InventoryMovement
    - Crear archivo `src/entities/inventory/inventory-movement.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relaciones ManyToOne con RBACTenant, Product, Warehouse, UnitOfMeasure, RBACUser
    - Agregar campo movement_type (enum: purchase_receipt, sales_shipment, adjustment, transfer_in, transfer_out, initial_balance, return_to_vendor, return_from_customer)
    - Agregar campos de cantidad y costo: quantity, unit_cost, total_cost
    - Agregar campos de referencia: reference_type, reference_id
    - Agregar campos de trazabilidad: lot_number, serial_number, location
    - Agregar campos de auditoría: movement_date, created_by_user_id, notes
    - Configurar índices en tenant_id, product_id, warehouse_id, movement_date, (reference_type, reference_id)
    - _Requirements: 2.1-2.20_

  - [x] 1.3 Crear entidad StockReservation
    - Crear archivo `src/entities/inventory/stock-reservation.entity.ts`
    - Definir entidad con decoradores TypeORM
    - Configurar relaciones ManyToOne con RBACTenant, Product, Warehouse, UnitOfMeasure
    - Agregar campo quantity_reserved
    - Agregar campos de referencia: reference_type, reference_id
    - Agregar campo status (enum: active, fulfilled, cancelled, expired)
    - Agregar campos de timestamp: reserved_at, expires_at, fulfilled_at
    - Configurar índices en tenant_id, product_id, warehouse_id, (reference_type, reference_id), status
    - _Requirements: 3.1-3.15_

### Phase 2: DTOs and Validation

- [ ] 2. Crear DTOs para Inventory Items
  - [x] 2.1 Crear CreateInventoryItemDto
    - Crear archivo `src/api/inventory/dto/create-inventory-item.dto.ts`
    - Definir campos: product_id, warehouse_id, uom_id (required)
    - Definir campos opcionales: quantity_on_hand, reorder_point, reorder_quantity, location, valuation_method, unit_cost
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 4.1-4.11_

  - [x] 2.2 Crear UpdateInventoryItemDto
    - Crear archivo `src/api/inventory/dto/update-inventory-item.dto.ts`
    - Definir campos opcionales: reorder_point, reorder_quantity, location, valuation_method
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 5.1-5.7_

  - [x] 2.3 Crear QueryInventoryItemDto
    - Crear archivo `src/api/inventory/dto/query-inventory-item.dto.ts`
    - Definir parámetros de paginación: page, limit
    - Definir filtros: product_id, warehouse_id, location, search, low_stock
    - Agregar decoradores @Type() para transformación
    - Agregar validadores @Min, @Max
    - _Requirements: 6.1-6.12_

- [ ] 3. Crear DTOs para Inventory Movements
  - [x] 3.1 Crear CreateInventoryMovementDto
    - Crear archivo `src/api/inventory/dto/create-inventory-movement.dto.ts`
    - Definir campos requeridos: product_id, warehouse_id, uom_id, movement_type, quantity, unit_cost
    - Definir campos opcionales: reference_type, reference_id, location, lot_number, serial_number, notes, movement_date
    - Agregar decoradores class-validator con validación de enum
    - Agregar decoradores Swagger
    - _Requirements: 7.1-7.12_

  - [x] 3.2 Crear QueryInventoryMovementDto
    - Crear archivo `src/api/inventory/dto/query-inventory-movement.dto.ts`
    - Definir parámetros de paginación: page, limit
    - Definir filtros: product_id, warehouse_id, movement_type, movement_date_from, movement_date_to, reference_type, reference_id, lot_number, serial_number
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 8.1-8.10_

- [ ] 4. Crear DTOs para Stock Reservations
  - [x] 4.1 Crear CreateStockReservationDto
    - Crear archivo `src/api/inventory/dto/create-stock-reservation.dto.ts`
    - Definir campos requeridos: product_id, warehouse_id, uom_id, quantity_reserved, reference_type, reference_id
    - Definir campo opcional: expires_at
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 9.1-9.9_

  - [x] 4.2 Crear QueryStockReservationDto
    - Crear archivo `src/api/inventory/dto/query-stock-reservation.dto.ts`
    - Definir parámetros de paginación y filtros
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger

- [ ] 5. Crear DTOs adicionales
  - [x] 5.1 Crear TransferInventoryDto
    - Crear archivo `src/api/inventory/dto/transfer-inventory.dto.ts`
    - Definir campos: product_id, source_warehouse_id, destination_warehouse_id, uom_id, quantity, unit_cost, notes
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 12.1-12.8_

  - [x] 5.2 Crear AdjustInventoryDto
    - Crear archivo `src/api/inventory/dto/adjust-inventory.dto.ts`
    - Definir campos: product_id, warehouse_id, uom_id, quantity, unit_cost, notes (required)
    - Agregar decoradores class-validator
    - Agregar decoradores Swagger
    - _Requirements: 13.1-13.7_

### Phase 3: Valuation Service

- [ ] 6. Implementar ValuationService
  - [x] 6.1 Crear estructura base del servicio
    - Crear archivo `src/api/inventory/valuation.service.ts`
    - Agregar decorador @Injectable()
    - _Requirements: 14, 15_

  - [x] 6.2 Implementar métodos FIFO
    - Implementar calculateFIFOCost: calcular costo consumiendo capas más antiguas primero
    - Implementar addFIFOLayer: agregar nueva capa de costo
    - Implementar consumeFIFOLayers: consumir capas en orden FIFO
    - _Requirements: 14.1-14.7_

  - [x] 6.3 Implementar métodos LIFO
    - Implementar calculateLIFOCost: calcular costo consumiendo capas más recientes primero
    - Implementar addLIFOLayer: agregar nueva capa de costo
    - Implementar consumeLIFOLayers: consumir capas en orden LIFO

  - [x] 6.4 Implementar métodos Weighted Average
    - Implementar calculateWeightedAverageCost: calcular promedio ponderado
    - Implementar updateWeightedAverage: actualizar costo promedio con nueva compra
    - _Requirements: 15.1-15.6_

  - [x] 6.5 Implementar métodos generales de valorización
    - Implementar updateInventoryValuation: delegar a método apropiado según valuation_method
    - Implementar recalculateTotalValue: calcular total_value = quantity_on_hand * unit_cost

  - [x] 6.6 Escribir tests unitarios para ValuationService
    - Testear FIFO con múltiples capas
    - Testear LIFO con múltiples capas
    - Testear Weighted Average con compras incrementales
    - Testear casos edge (cantidad cero, capa única, etc.)

### Phase 4: Inventory Service

- [ ] 7. Implementar InventoryService - Inventory Items
  - [x] 7.1 Crear estructura base del servicio
    - Crear archivo `src/api/inventory/inventory.service.ts`
    - Inyectar repositorios: InventoryItem, InventoryMovement, StockReservation
    - Inyectar ValuationService
    - Agregar decorador @Injectable()

  - [x] 7.2 Implementar método createInventoryItem
    - Validar que product_id, warehouse_id, uom_id existen y pertenecen al tenant
    - Validar que uom_id está asignado al producto
    - Validar unicidad de (tenant_id, product_id, warehouse_id, uom_id, location)
    - Crear InventoryItem con quantity_on_hand inicial
    - Inicializar quantity_reserved = 0
    - Calcular quantity_available = quantity_on_hand - quantity_reserved
    - Si quantity_on_hand > 0, crear InventoryMovement tipo 'initial_balance'
    - _Requirements: 4.1-4.11_

  - [x] 7.3 Implementar método updateInventoryItem
    - Validar pertenencia al tenant
    - Permitir actualizar solo: reorder_point, reorder_quantity, location, valuation_method
    - NO permitir actualizar cantidades directamente
    - _Requirements: 5.1-5.7_

  - [x] 7.4 Implementar método findInventoryItems con paginación y filtros
    - Filtrar por tenant_id
    - Aplicar filtros opcionales: product_id, warehouse_id, location, search (product name/SKU)
    - Aplicar filtro low_stock: quantity_available <= reorder_point
    - Incluir relaciones: product, warehouse, uom
    - Ordenar por product name, warehouse name
    - Implementar paginación
    - _Requirements: 6.1-6.12_

  - [x] 7.5 Implementar métodos findInventoryItemById y deleteInventoryItem
    - findInventoryItemById: buscar por id y tenant_id
    - deleteInventoryItem: validar pertenencia y eliminar
    - _Requirements: 6.1-6.12_

- [ ] 8. Implementar InventoryService - Inventory Movements
  - [x] 8.1 Implementar método createInventoryMovement
    - Validar que product_id, warehouse_id, uom_id existen y pertenecen al tenant
    - Validar que quantity != 0
    - Validar signo de quantity según movement_type:
      - Positivo: purchase_receipt, transfer_in, return_from_customer, initial_balance
      - Negativo: sales_shipment, transfer_out, return_to_vendor
      - Cualquiera: adjustment
    - Obtener o crear InventoryItem
    - Validar stock suficiente si quantity es negativo
    - Crear InventoryMovement con created_by_user_id
    - Actualizar quantity_on_hand del InventoryItem
    - Actualizar valorización usando ValuationService
    - Recalcular quantity_available
    - Calcular total_cost = quantity * unit_cost
    - _Requirements: 7.1-7.12_

  - [x] 8.2 Implementar método findInventoryMovements con filtros
    - Filtrar por tenant_id
    - Aplicar filtros opcionales: product_id, warehouse_id, movement_type, date range, reference, lot, serial
    - Incluir relaciones: product, warehouse, uom, created_by_user
    - Ordenar por movement_date DESC
    - Implementar paginación
    - _Requirements: 8.1-8.10_

  - [x] 8.3 Implementar método findInventoryMovementById
    - Buscar por id y tenant_id
    - Incluir relaciones
    - _Requirements: 8.1-8.10_

- [ ] 9. Implementar InventoryService - Stock Reservations
  - [x] 9.1 Implementar método createStockReservation
    - Validar que product_id, warehouse_id, uom_id existen y pertenecen al tenant
    - Obtener InventoryItem
    - Validar que quantity_available >= quantity_reserved
    - Crear StockReservation con status 'active'
    - Actualizar quantity_reserved del InventoryItem
    - Recalcular quantity_available
    - Registrar reserved_at timestamp
    - _Requirements: 9.1-9.9_

  - [x] 9.2 Implementar método fulfillStockReservation
    - Obtener StockReservation y validar status = 'active'
    - Crear InventoryMovement tipo 'sales_shipment' con quantity negativo
    - Actualizar quantity_on_hand (decrease)
    - Actualizar quantity_reserved (decrease)
    - Actualizar StockReservation.status = 'fulfilled'
    - Registrar fulfilled_at timestamp
    - _Requirements: 10.1-10.8_

  - [x] 9.3 Implementar método cancelStockReservation
    - Obtener StockReservation y validar status = 'active'
    - Actualizar quantity_reserved del InventoryItem (decrease)
    - Recalcular quantity_available (increase)
    - Actualizar StockReservation.status = 'cancelled'
    - NO crear InventoryMovement
    - _Requirements: 11.1-11.6_

  - [x] 9.4 Implementar método findStockReservations con filtros
    - Filtrar por tenant_id
    - Aplicar filtros opcionales
    - Incluir relaciones
    - Implementar paginación

- [ ] 10. Implementar InventoryService - Transfers y Adjustments
  - [x] 10.1 Implementar método transferInventory
    - Validar que source_warehouse_id != destination_warehouse_id
    - Validar stock suficiente en almacén origen
    - Generar reference_id único para vincular ambos movimientos
    - Crear InventoryMovement tipo 'transfer_out' en almacén origen (quantity negativo)
    - Actualizar InventoryItem del almacén origen (decrease)
    - Crear InventoryMovement tipo 'transfer_in' en almacén destino (quantity positivo)
    - Actualizar InventoryItem del almacén destino (increase)
    - Preservar unit_cost del almacén origen
    - Retornar ambos movimientos
    - _Requirements: 12.1-12.8_

  - [x] 10.2 Implementar método adjustInventory
    - Validar que notes no esté vacío (requerido para auditoría)
    - Crear InventoryMovement tipo 'adjustment'
    - Permitir quantity positivo o negativo
    - Si negativo, validar stock suficiente
    - Actualizar quantity_on_hand
    - Actualizar valorización si valuation_method = Weighted_Average
    - Registrar created_by_user_id
    - _Requirements: 13.1-13.7_

- [ ] 11. Implementar InventoryService - Reporting
  - [x] 11.1 Implementar método getLowStockItems
    - Filtrar por tenant_id
    - Filtrar donde quantity_available <= reorder_point
    - Incluir relaciones: product, warehouse
    - Retornar lista de InventoryItems
    - _Requirements: 16.1-16.5_

  - [x] 11.2 Implementar método getInventoryValuationReport
    - Filtrar por tenant_id
    - Filtrar opcionalmente por warehouse_id
    - Calcular total_value para cada InventoryItem
    - Agrupar por warehouse
    - Calcular grand total
    - Retornar reporte con: product, SKU, warehouse, quantity, unit_cost, total_value
    - _Requirements: 17.1-17.7_

  - [x] 11.3 Implementar métodos getStockByProduct y getStockByWarehouse
    - getStockByProduct: listar inventario de un producto en todos los almacenes
    - getStockByWarehouse: listar todo el inventario de un almacén
    - Incluir relaciones apropiadas
    - _Requirements: 6.1-6.12_

- [x] 12. Checkpoint - Verificar servicios y tests
  - Ejecutar todos los tests unitarios
  - Verificar cobertura de código
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Controller and API

- [ ] 13. Implementar InventoryController - Inventory Items
  - [x] 13.1 Crear estructura base del controlador
    - Crear archivo `src/api/inventory/inventory.controller.ts`
    - Inyectar InventoryService
    - Agregar decoradores: @Controller('tenant/inventory'), @ApiTags('Inventory'), @ApiBearerAuth()
    - Agregar guards: @UseGuards(JwtAuthGuard, PermissionGuard)

  - [x] 13.2 Implementar endpoints CRUD para Inventory Items
    - POST /tenant/inventory/items - Crear inventory item
    - GET /tenant/inventory/items - Listar con paginación y filtros
    - GET /tenant/inventory/items/:id - Obtener por ID
    - PUT /tenant/inventory/items/:id - Actualizar configuración
    - DELETE /tenant/inventory/items/:id - Eliminar
    - Agregar @RequirePermissions({ entityType: 'inventory', action: '...' })
    - Agregar documentación Swagger completa
    - _Requirements: 21.1-21.7_

- [ ] 14. Implementar InventoryController - Inventory Movements
  - [x] 14.1 Implementar endpoints para Inventory Movements
    - POST /tenant/inventory/movements - Crear movimiento
    - GET /tenant/inventory/movements - Listar con filtros
    - GET /tenant/inventory/movements/:id - Obtener por ID
    - Agregar @RequirePermissions apropiados
    - Agregar documentación Swagger
    - _Requirements: 21.1-21.7_

- [ ] 15. Implementar InventoryController - Stock Reservations
  - [x] 15.1 Implementar endpoints para Stock Reservations
    - POST /tenant/inventory/reservations - Crear reserva
    - POST /tenant/inventory/reservations/:id/fulfill - Cumplir reserva
    - POST /tenant/inventory/reservations/:id/cancel - Cancelar reserva
    - GET /tenant/inventory/reservations - Listar reservas
    - Agregar @RequirePermissions apropiados
    - Agregar documentación Swagger
    - _Requirements: 21.1-21.7_

- [ ] 16. Implementar InventoryController - Transfers y Adjustments
  - [x] 16.1 Implementar endpoints especiales
    - POST /tenant/inventory/transfers - Transferir entre almacenes
    - POST /tenant/inventory/adjustments - Ajustar inventario
    - Agregar @RequirePermissions apropiados
    - Agregar documentación Swagger
    - _Requirements: 21.1-21.7_

- [ ] 17. Implementar InventoryController - Reports
  - [x] 17.1 Implementar endpoints de reportes
    - GET /tenant/inventory/reports/low-stock - Items con bajo stock
    - GET /tenant/inventory/reports/valuation - Reporte de valorización
    - GET /tenant/inventory/reports/by-product/:productId - Stock por producto
    - GET /tenant/inventory/reports/by-warehouse/:warehouseId - Stock por almacén
    - Agregar @RequirePermissions({ entityType: 'inventory', action: 'Read' })
    - Agregar documentación Swagger
    - _Requirements: 21.1-21.7_

- [x] 18. Escribir tests unitarios para el controlador
  - Mockear InventoryService
  - Testear extracción correcta de tenantId y userId
  - Testear llamadas correctas a métodos del servicio
  - Testear respuestas HTTP apropiadas

### Phase 6: Module Configuration

- [x] 19. Configurar InventoryModule
  - Crear archivo `src/api/inventory/inventory.module.ts`
  - Importar TypeOrmModule.forFeature([InventoryItem, InventoryMovement, StockReservation])
  - Importar RBACModule, ProductsModule, WarehousesModule
  - Declarar InventoryService y ValuationService en providers
  - Declarar InventoryController en controllers
  - Exportar InventoryService y ValuationService

- [x] 20. Integrar módulo en app.module.ts
  - Importar InventoryModule en el array imports de AppModule
  - Verificar que el módulo se registre correctamente

### Phase 7: Database Migrations

- [ ] 21. Crear migraciones de base de datos
  - [x] 21.1 Crear migración para inventory_items
    - Crear archivo `src/database/migrations/{timestamp}-create-inventory-items-table.ts`
    - Implementar método up:
      - Crear enum inventory_valuation_method (FIFO, LIFO, Weighted_Average)
      - Crear tabla inventory_items con todas las columnas
      - Crear índices: tenant_id, product_id, warehouse_id
      - Crear índice único: (tenant_id, product_id, warehouse_id, uom_id, location)
      - Crear foreign keys con CASCADE delete
    - Implementar método down
    - _Requirements: 22.1, 22.5, 22.6, 22.7_

  - [x] 21.2 Crear migración para inventory_movements
    - Crear archivo `src/database/migrations/{timestamp}-create-inventory-movements-table.ts`
    - Implementar método up:
      - Crear enum inventory_movement_type con todos los valores
      - Crear tabla inventory_movements con todas las columnas
      - Crear índices: tenant_id, product_id, warehouse_id, movement_date, (reference_type, reference_id)
      - Crear foreign keys con CASCADE delete
    - Implementar método down
    - _Requirements: 22.2, 22.5, 22.6, 22.7_

  - [x] 21.3 Crear migración para stock_reservations
    - Crear archivo `src/database/migrations/{timestamp}-create-stock-reservations-table.ts`
    - Implementar método up:
      - Crear enum stock_reservation_status (active, fulfilled, cancelled, expired)
      - Crear tabla stock_reservations con todas las columnas
      - Crear índices: tenant_id, product_id, warehouse_id, (reference_type, reference_id), status
      - Crear foreign keys con CASCADE delete
    - Implementar método down
    - _Requirements: 22.3, 22.5, 22.6, 22.7_

- [x] 22. Ejecutar y verificar migraciones
  - Ejecutar migraciones en base de datos de desarrollo
  - Verificar que todas las tablas se crean correctamente
  - Verificar que todos los índices existen
  - Verificar que las foreign keys funcionan correctamente
  - Testear rollback (down) de migraciones

### Phase 8: Integration and Testing

- [ ] 23. Integración con Sales Orders Module
  - [~] 23.1 Implementar hook en SalesOrderService
    - Cuando sales order status cambia a 'confirmed', crear stock reservations
    - Cuando sales order status cambia a 'completed', fulfill stock reservations
    - Cuando sales order status cambia a 'cancelled', cancel stock reservations
    - Inyectar InventoryService en SalesOrderService

  - [~] 23.2 Escribir tests de integración
    - Testear flujo completo: crear orden → confirmar → reservar stock
    - Testear flujo completo: confirmar orden → enviar → cumplir reserva → crear movimiento
    - Testear flujo completo: confirmar orden → cancelar → liberar reserva

- [ ] 24. Integración con Purchase Orders Module
  - [~] 24.1 Implementar hook en PurchaseOrderService
    - Cuando purchase order es recibida, crear purchase_receipt movements
    - Cuando productos son devueltos, crear return_to_vendor movements
    - Inyectar InventoryService en PurchaseOrderService

  - [~] 24.2 Escribir tests de integración
    - Testear flujo completo: recibir orden → crear movimiento → actualizar stock

- [ ] 25. Tests end-to-end
  - [~] 25.1 Escribir tests E2E para flujos principales
    - Test: Crear producto → Crear inventory item → Verificar stock inicial
    - Test: Crear movimiento de entrada → Verificar aumento de stock
    - Test: Crear movimiento de salida → Verificar disminución de stock
    - Test: Crear reserva → Verificar stock disponible reducido
    - Test: Cumplir reserva → Verificar stock físico reducido
    - Test: Transferir entre almacenes → Verificar stock en ambos almacenes
    - Test: Ajustar inventario → Verificar cambio de stock
    - Test: Reporte de bajo stock → Verificar items correctos
    - Test: Reporte de valorización → Verificar cálculos correctos

  - [~] 25.2 Escribir tests E2E para métodos de valorización
    - Test FIFO: Comprar en 3 lotes diferentes → Vender → Verificar costo FIFO
    - Test LIFO: Comprar en 3 lotes diferentes → Vender → Verificar costo LIFO
    - Test Weighted Average: Comprar en 3 lotes → Verificar promedio ponderado

- [~] 26. Checkpoint final - Verificar integración completa
  - Ejecutar todos los tests (unitarios, integración, E2E)
  - Verificar cobertura de código (objetivo: >80%)
  - Verificar documentación Swagger completa
  - Verificar que todos los endpoints funcionan correctamente
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Documentation and Deployment

- [ ] 27. Documentación adicional
  - [~] 27.1 Crear guía de uso del módulo
    - Documentar flujos principales
    - Documentar métodos de valorización
    - Documentar integración con otros módulos
    - Incluir ejemplos de uso

  - [~] 27.2 Crear guía de troubleshooting
    - Documentar errores comunes
    - Documentar soluciones
    - Documentar mejores prácticas

- [ ] 28. Preparar para producción
  - [~] 28.1 Configurar permisos RBAC
    - Crear permisos: inventory:Create, inventory:Read, inventory:Update, inventory:Delete
    - Asignar permisos a roles apropiados
    - Documentar matriz de permisos

  - [~] 28.2 Configurar monitoreo
    - Agregar logs para operaciones críticas
    - Configurar alertas para errores
    - Configurar métricas de performance

  - [~] 28.3 Optimización de performance
    - Revisar índices de base de datos
    - Configurar caching si es necesario
    - Optimizar queries N+1
    - Considerar paginación para reportes grandes

## Notes

- Este módulo es más complejo que otros debido a múltiples entidades y lógica de valorización
- La implementación debe hacerse en fases para facilitar testing incremental
- Los métodos de valorización (FIFO, LIFO, Weighted Average) requieren atención especial
- La integración con Sales Orders y Purchase Orders es crítica para el flujo completo
- Todos los movimientos de inventario deben ser auditables (created_by_user_id)
- Las reservas de stock previenen sobreventa y son esenciales para el negocio
- Los tests de integración son críticos para validar flujos completos
- La performance es importante debido al volumen potencial de movimientos
- El módulo sigue los estándares establecidos en MODULE_STANDARD.md
- TypeScript es el lenguaje de implementación según el diseño
- Todos los tests deben ejecutarse con mínimo 100 iteraciones para property-based tests
