# Warehouse Module - Implementation Summary

## Overview

Se ha creado un módulo completo de **Warehouse Management** siguiendo el MODULE_STANDARD.md. Este módulo permite gestionar almacenes/centros de distribución dentro de cada tenant con información de facturación mexicana.

## Estructura de Archivos Creados

```
src/
├── entities/
│   └── warehouse/
│       └── warehouse.entity.ts          # Entidad Warehouse
├── api/
│   └── warehouse/
│       ├── dto/
│       │   ├── create-warehouse.dto.ts  # DTO para crear
│       │   ├── update-warehouse.dto.ts  # DTO para actualizar
│       │   └── query-warehouse.dto.ts   # DTO para búsqueda/paginación
│       ├── warehouse.controller.ts      # Controlador REST
│       ├── warehouse.service.ts         # Lógica de negocio
│       └── warehouse.module.ts          # Módulo NestJS
└── database/
    └── migrations/
        └── 1700000000001-CreateWarehousesTable.ts  # Migración
```

## Características Principales

### 1. Entity (Warehouse)
- **UUID Primary Key** - Identificador único
- **Tenant Isolation** - Cada almacén pertenece a un tenant
- **Información Básica** - nombre, código, descripción
- **Dirección Completa** - calle, ciudad, estado, código postal, país
- **Facturación Mexicana** - RFC (validado), Razón Social, Tipo de Persona
- **Contacto** - teléfono, email, persona de contacto
- **Status** - active/inactive
- **Metadata** - JSON para extensibilidad
- **Timestamps** - created_at, updated_at automáticos
- **Indexes** - tenant_id, status, code para performance

### 2. DTOs

#### CreateWarehouseDto
- Validación de RFC con regex mexicano
- Email validado
- Enum para persona_type y status
- Todos los campos requeridos excepto opcionales

#### UpdateWarehouseDto
- Todos los campos opcionales
- Mismas validaciones que Create

#### QueryWarehouseDto
- Paginación (page, limit)
- Búsqueda por nombre o código
- Filtros por status, state, country, code

### 3. Service (WarehouseService)
- **create()** - Crear almacén con tenant_id automático
- **findAll()** - Listar con paginación y filtros
- **findOne()** - Obtener por ID con validación de tenant
- **update()** - Actualizar preservando timestamps
- **remove()** - Eliminar almacén

**Características:**
- Filtrado automático por tenant_id
- Paginación validada (1-100 items)
- Búsqueda en nombre y código
- Filtros por status, state, country, code
- Manejo de errores con NotFoundException

### 4. Controller (WarehouseController)
- **POST /tenant/warehouses** - Crear (permisos: warehouses:Create)
- **GET /tenant/warehouses** - Listar (permisos: warehouses:Read)
- **GET /tenant/warehouses/:id** - Obtener (permisos: warehouses:Read)
- **PUT /tenant/warehouses/:id** - Actualizar (permisos: warehouses:Update)
- **DELETE /tenant/warehouses/:id** - Eliminar (permisos: warehouses:Delete)

**Características:**
- Guards: JwtAuthGuard, PermissionGuard
- Decoradores @RequirePermissions para RBAC
- Documentación Swagger completa
- Extrae tenant_id de req.user.tenantId

### 5. Module (WarehouseModule)
- Importa TypeOrmModule con Warehouse entity
- Importa RBACModule para permisos
- Exporta WarehouseService para otros módulos

### 6. Migration
- Crea tabla `warehouses` con todas las columnas
- Foreign key a `rbac_tenants` con CASCADE delete
- Indexes en tenant_id, status, code
- Enums para persona_type y status

## Validaciones

### RFC
- Patrón: `^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$`
- Ejemplo válido: `ALM123456ABC`

### Email
- Validación de email si se proporciona

### Código
- Único por tenant (no global)

### Status
- Solo: `active` o `inactive`
- Default: `active`

### Persona Type
- `Persona Física` - Persona individual
- `Persona Moral` - Empresa

## Aislamiento por Tenant

✅ **Completamente implementado:**
- Cada almacén tiene `tenant_id`
- Todas las queries filtran por `tenant_id`
- findOne() valida que el almacén pertenezca al tenant
- update() y remove() validan tenant ownership
- Cascade delete cuando se elimina el tenant

## RBAC Integration

✅ **Completamente integrado:**
- Decorador `@RequirePermissions` en todos los endpoints
- Permisos: warehouses:Create, warehouses:Read, warehouses:Update, warehouses:Delete
- Guards: JwtAuthGuard, PermissionGuard
- Tenant context extraído de req.user.tenantId

## Próximos Pasos

### 1. Registrar el módulo en AppModule
```typescript
// src/app.module.ts
import { WarehouseModule } from './api/warehouse/warehouse.module';

@Module({
  imports: [
    // ... otros módulos
    WarehouseModule,
  ],
})
export class AppModule {}
```

### 2. Ejecutar la migración
```bash
npm run typeorm migration:run
```

### 3. Crear permisos en la base de datos
Los permisos deben ser creados en la tabla `rbac_permissions`:
- warehouses:Create
- warehouses:Read
- warehouses:Update
- warehouses:Delete

### 4. Asignar permisos a roles
Asignar los permisos a los roles que necesiten acceso (ej: Admin role)

### 5. Probar endpoints
```bash
# Crear almacén
curl -X POST http://localhost:3000/tenant/warehouses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Listar almacenes
curl -X GET http://localhost:3000/tenant/warehouses \
  -H "Authorization: Bearer {token}"
```

## Campos de la Entidad

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | ✅ | Identificador único |
| tenant_id | UUID | ✅ | Tenant propietario |
| name | string | ✅ | Nombre del almacén |
| code | string | ✅ | Código único por tenant |
| description | string | ❌ | Descripción |
| street | string | ✅ | Calle |
| city | string | ✅ | Ciudad |
| state | string | ✅ | Estado |
| zip_code | string | ✅ | Código postal |
| country | string | ✅ | País |
| razon_social | string | ✅ | Razón social |
| rfc | string | ✅ | RFC (validado) |
| persona_type | enum | ✅ | Física o Moral |
| phone | string | ❌ | Teléfono |
| email | string | ❌ | Email |
| contact_person | string | ❌ | Persona de contacto |
| status | enum | ✅ | active/inactive |
| metadata | JSON | ❌ | Datos adicionales |
| created_at | timestamp | ✅ | Fecha de creación |
| updated_at | timestamp | ✅ | Fecha de actualización |

## Comparación con Vendor Module

| Aspecto | Vendor | Warehouse |
|--------|--------|-----------|
| Propósito | Proveedores/Suppliers | Almacenes/Distribution Centers |
| Scope | Global (múltiples tenants) | Por tenant |
| Información | Básica + Facturación | Básica + Facturación + Contacto |
| Uso | Compras, Pagos | Inventario, Ventas, Movimientos |
| Relaciones | Independiente | Referenciado por Lots, Transactions |

## Notas Importantes

1. **Código Único**: El código es único por tenant, no globalmente
2. **Facturación**: RFC y Razón Social son para facturación de movimientos desde ese almacén
3. **Metadata**: Usa este campo para datos específicos del negocio
4. **Timestamps**: Se actualizan automáticamente
5. **Cascade Delete**: Al eliminar un tenant, se eliminan todos sus almacenes

## Documentación

Ver `WAREHOUSE_MANAGEMENT_GUIDE.md` para:
- Ejemplos de uso de endpoints
- Casos de uso comunes
- Integración con otros módulos
- Errores y validaciones

