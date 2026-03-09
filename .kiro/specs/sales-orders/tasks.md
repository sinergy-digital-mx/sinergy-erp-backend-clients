# Implementation Plan: Sales Orders Module

## Overview

Este plan de implementación cubre la creación completa del módulo de Sales Orders para Sinergy ERP, incluyendo entidad TypeORM, DTOs con validación, servicio con lógica de negocio multi-tenant, controlador con guards RBAC, migración de base de datos, y tests comprehensivos (unitarios y property-based).

## Tasks

- [x] 1. Crear la entidad SalesOrder con TypeORM
  - Crear archivo `src/entities/sales-orders/sales-order.entity.ts`
  - Definir entidad con decoradores TypeORM (UUID, timestamps, relaciones)
  - Configurar relación ManyToOne con RBACTenant con CASCADE delete
  - Agregar índices en tenant_id y status
  - Definir enum para status con valores: draft, confirmed, processing, completed, cancelled
  - Incluir campo metadata tipo JSON para extensibilidad
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2. Crear DTOs con validación
  - [x] 2.1 Crear CreateSalesOrderDto
    - Crear archivo `src/api/sales-orders/dto/create-sales-order.dto.ts`
    - Definir campos: name (required), description (optional), status (optional), metadata (optional)
    - Agregar decoradores class-validator (@IsString, @IsOptional, @IsEnum, @IsObject)
    - Agregar decoradores Swagger (@ApiProperty, @ApiPropertyOptional)
    - _Requirements: 10.1, 10.2_

  - [x] 2.2 Crear UpdateSalesOrderDto
    - Crear archivo `src/api/sales-orders/dto/update-sales-order.dto.ts`
    - Definir todos los campos como opcionales
    - Agregar decoradores class-validator para validación
    - Agregar decoradores Swagger para documentación
    - _Requirements: 10.3, 10.4_

  - [x] 2.3 Crear QuerySalesOrderDto
    - Crear archivo `src/api/sales-orders/dto/query-sales-order.dto.ts`
    - Definir parámetros de paginación: page (default 1, min 1), limit (default 20, min 1, max 100)
    - Definir parámetros de filtrado: search (optional), status (optional)
    - Agregar decoradores @Type(() => Number) para transformación
    - Agregar validadores @Min y @Max para límites
    - _Requirements: 10.5, 10.6, 10.7, 10.8_

  - [x] 2.4 Crear PaginatedSalesOrderDto
    - Crear archivo `src/api/sales-orders/dto/paginated-sales-order.dto.ts`
    - Definir interface con campos: data, total, page, limit, totalPages, hasNext, hasPrev
    - _Requirements: 6.6_

- [ ] 3. Implementar SalesOrderService con lógica de negocio
  - [x] 3.1 Crear estructura base del servicio
    - Crear archivo `src/api/sales-orders/sales-order.service.ts`
    - Inyectar Repository<SalesOrder> con @InjectRepository
    - Agregar decorador @Injectable()
    - _Requirements: 11.3_

  - [x] 3.2 Implementar método create
    - Aceptar CreateSalesOrderDto y tenantId como parámetros
    - Asignar automáticamente tenant_id del usuario autenticado
    - Crear y guardar la entidad usando repository.create y repository.save
    - Retornar la entidad creada con timestamps automáticos
    - _Requirements: 2.1, 2.2, 2.6_

  - [ ] 3.3 Escribir property test para método create
    - **Property 1: Automatic Timestamp Creation**
    - **Property 2: Automatic Tenant Assignment**
    - **Validates: Requirements 1.3, 1.4, 2.2, 2.6, 8.5, 12.3**

  - [x] 3.4 Implementar método findAll con paginación
    - Aceptar tenantId y QuerySalesOrderDto como parámetros
    - Normalizar parámetros de paginación (page >= 1, 1 <= limit <= 100)
    - Usar QueryBuilder para filtrar por tenant_id
    - Aplicar filtro de búsqueda case-insensitive en campo name si se proporciona
    - Aplicar filtro de status exacto si se proporciona
    - Ordenar por created_at DESC
    - Calcular skip y take para paginación
    - Ejecutar getCount() y getMany()
    - Retornar PaginatedSalesOrderDto con metadata completa
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 12.1_

  - [ ]* 3.5 Escribir property tests para método findAll
    - **Property 3: Tenant Isolation**
    - **Property 10: Pagination Defaults**
    - **Property 11: Pagination Bounds Enforcement**
    - **Property 12: Pagination Metadata Completeness**
    - **Property 13: Result Ordering**
    - **Property 14: Search Filter Behavior**
    - **Property 15: Status Filter Behavior**
    - **Property 16: Combined Filter Logic**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 12.1, 12.2, 12.4, 12.5**

  - [x] 3.6 Implementar método findOne
    - Aceptar id y tenantId como parámetros
    - Usar repository.findOneOrFail con where: { id, tenant_id: tenantId }
    - Retornar la entidad completa con todos los campos
    - Lanzar automáticamente 404 si no se encuentra
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 3.7 Escribir property tests para método findOne
    - **Property 4: Not Found Error for Invalid IDs**
    - **Property 9: Complete Field Retrieval**
    - **Validates: Requirements 3.4, 4.3, 5.2, 5.3, 5.5, 13.1**

  - [x] 3.8 Implementar método update
    - Aceptar id, UpdateSalesOrderDto y tenantId como parámetros
    - Llamar a findOne para verificar existencia y pertenencia al tenant
    - Usar Object.assign para aplicar cambios parciales
    - Guardar con repository.save (actualiza updated_at automáticamente)
    - Retornar la entidad actualizada
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [ ]* 3.9 Escribir property tests para método update
    - **Property 5: Successful CRUD Operations (update)**
    - **Property 7: Updated Timestamp Modification**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.6**

  - [x] 3.10 Implementar método remove
    - Aceptar id y tenantId como parámetros
    - Llamar a findOne para verificar existencia y pertenencia al tenant
    - Usar repository.remove para hard delete
    - Retornar void
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 3.11 Escribir property tests para método remove
    - **Property 5: Successful CRUD Operations (delete)**
    - **Property 8: Hard Delete Behavior**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 4. Checkpoint - Verificar servicio y tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implementar SalesOrderController con guards y Swagger
  - [x] 5.1 Crear estructura base del controlador
    - Crear archivo `src/api/sales-orders/sales-order.controller.ts`
    - Inyectar SalesOrderService en constructor
    - Agregar decoradores: @Controller('tenant/sales-orders'), @ApiTags('Sales Orders'), @ApiBearerAuth()
    - Agregar guards globales: @UseGuards(JwtAuthGuard, PermissionGuard)
    - _Requirements: 8.1, 8.2, 9.1, 9.7, 11.4_

  - [x] 5.2 Implementar endpoint POST /tenant/sales-orders
    - Agregar decorador @Post()
    - Agregar @RequirePermissions({ entityType: 'sales_orders', action: 'Create' })
    - Agregar decoradores Swagger: @ApiOperation, @ApiBody, @ApiResponse (201, 400, 401, 403)
    - Extraer tenantId de req.user.tenantId
    - Llamar a service.create(dto, tenantId)
    - _Requirements: 2.1, 2.4, 8.3, 8.4, 8.5, 9.2, 9.3, 9.6_

  - [x] 5.3 Implementar endpoint GET /tenant/sales-orders
    - Agregar decorador @Get()
    - Agregar @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
    - Agregar decoradores Swagger: @ApiOperation, @ApiQuery (page, limit, search, status), @ApiResponse (200, 401, 403)
    - Extraer tenantId de req.user.tenantId
    - Llamar a service.findAll(tenantId, query)
    - _Requirements: 6.1, 6.8, 8.3, 8.4, 9.2, 9.3, 9.5_

  - [x] 5.4 Implementar endpoint GET /tenant/sales-orders/:id
    - Agregar decorador @Get(':id')
    - Agregar @RequirePermissions({ entityType: 'sales_orders', action: 'Read' })
    - Agregar decoradores Swagger: @ApiOperation, @ApiParam, @ApiResponse (200, 401, 403, 404)
    - Extraer tenantId de req.user.tenantId
    - Llamar a service.findOne(id, tenantId)
    - _Requirements: 5.1, 5.4, 8.3, 8.4, 9.2, 9.3, 9.4_

  - [x] 5.5 Implementar endpoint PUT /tenant/sales-orders/:id
    - Agregar decorador @Put(':id')
    - Agregar @RequirePermissions({ entityType: 'sales_orders', action: 'Update' })
    - Agregar decoradores Swagger: @ApiOperation, @ApiParam, @ApiBody, @ApiResponse (200, 400, 401, 403, 404)
    - Extraer tenantId de req.user.tenantId
    - Llamar a service.update(id, dto, tenantId)
    - _Requirements: 3.1, 3.5, 8.3, 8.4, 9.2, 9.3, 9.4, 9.6_

  - [x] 5.6 Implementar endpoint DELETE /tenant/sales-orders/:id
    - Agregar decorador @Delete(':id')
    - Agregar @RequirePermissions({ entityType: 'sales_orders', action: 'Delete' })
    - Agregar decoradores Swagger: @ApiOperation, @ApiParam, @ApiResponse (200, 401, 403, 404)
    - Extraer tenantId de req.user.tenantId
    - Llamar a service.remove(id, tenantId)
    - _Requirements: 4.1, 4.4, 8.3, 8.4, 9.2, 9.3, 9.4_

  - [ ]* 5.7 Escribir tests unitarios para el controlador
    - Mockear SalesOrderService
    - Testear extracción correcta de tenantId de req.user
    - Testear llamadas correctas a métodos del servicio
    - Testear respuestas HTTP apropiadas

- [x] 6. Configurar SalesOrdersModule
  - Crear archivo `src/api/sales-orders/sales-orders.module.ts`
  - Importar TypeOrmModule.forFeature([SalesOrder])
  - Importar RBACModule para guards y permisos
  - Declarar SalesOrderService en providers
  - Declarar SalesOrderController en controllers
  - Exportar SalesOrderService para uso por otros módulos
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 7. Crear migración de base de datos
  - Crear archivo `src/database/migrations/{timestamp}-create-sales-orders-table.ts`
  - Implementar método up:
    - Crear enum type sales_order_status con valores: draft, confirmed, processing, completed, cancelled
    - Crear tabla sales_orders con columnas: id (uuid, PK), tenant_id (uuid, FK), name (varchar), description (varchar nullable), status (enum, default 'draft'), metadata (json nullable), created_at (timestamp), updated_at (timestamp)
    - Crear índice sales_orders_tenant_idx en tenant_id
    - Crear índice sales_orders_status_idx en status
    - Crear foreign key fk_sales_orders_tenant: tenant_id → rbac_tenants(id) ON DELETE CASCADE
  - Implementar método down:
    - Eliminar foreign key
    - Eliminar índices
    - Eliminar tabla sales_orders
    - Eliminar enum type sales_order_status
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 8. Integrar módulo en app.module.ts
  - Importar SalesOrdersModule en el array imports de AppModule
  - Verificar que el módulo se registre correctamente en el sistema
  - _Requirements: 11.1_

- [x] 9. Checkpoint final - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan ejemplos específicos y casos edge
- El módulo sigue los estándares establecidos en MODULE_STANDARD.md
- TypeScript es el lenguaje de implementación según el diseño
- Se usa fast-check como librería de property-based testing
- Todos los tests deben ejecutarse con mínimo 100 iteraciones
