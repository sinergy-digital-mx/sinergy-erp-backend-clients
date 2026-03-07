# Warehouse Management - Quick Start Guide

## 🚀 Inicio Rápido

### Paso 1: Registrar el módulo en AppModule

Abre `src/app.module.ts` y agrega:

```typescript
import { WarehouseModule } from './api/warehouse/warehouse.module';

@Module({
  imports: [
    // ... otros módulos existentes
    WarehouseModule,  // ← Agregar esta línea
  ],
})
export class AppModule {}
```

### Paso 2: Ejecutar la migración

```bash
npm run typeorm migration:run
```

Esto creará la tabla `warehouses` en la base de datos.

### Paso 3: Crear permisos en la base de datos

Ejecuta este SQL en tu base de datos:

```sql
-- Primero, obtén el ID de la entidad 'Warehouse' del entity_registry
-- Si no existe, créalo:
INSERT INTO entity_registry (code, name) 
VALUES ('Warehouse', 'Warehouse Management')
ON CONFLICT DO NOTHING;

-- Luego, crea los permisos
INSERT INTO rbac_permissions (id, entity_registry_id, action, description, is_system_permission, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM entity_registry WHERE code = 'Warehouse'),
  action,
  description,
  true,
  NOW(),
  NOW()
FROM (
  VALUES
    ('Create', 'Create new warehouses'),
    ('Read', 'View warehouse information'),
    ('Update', 'Edit warehouse information'),
    ('Delete', 'Delete warehouses')
) AS perms(action, description)
ON CONFLICT DO NOTHING;
```

### Paso 4: Asignar permisos al rol Admin

```sql
-- Obtén el ID del rol Admin para tu tenant
-- Luego asigna los permisos:
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT 
  gen_random_uuid(),
  'ADMIN_ROLE_ID_AQUI',  -- Reemplaza con el ID real
  p.id,
  NOW()
FROM rbac_permissions p
JOIN entity_registry er ON p.entity_registry_id = er.id
WHERE er.code = 'Warehouse'
ON CONFLICT DO NOTHING;
```

### Paso 5: Probar los endpoints

#### Crear un almacén
```bash
curl -X POST http://localhost:3000/tenant/warehouses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Almacén Central",
    "code": "ALM-001",
    "description": "Almacén principal",
    "street": "Calle Principal 123",
    "city": "México",
    "state": "CDMX",
    "zip_code": "06500",
    "country": "México",
    "razon_social": "ALMACENES MEXICO SA DE CV",
    "rfc": "ALM123456ABC",
    "persona_type": "Persona Moral",
    "phone": "+52 55 1234 5678",
    "email": "almacen@empresa.com",
    "contact_person": "Juan Pérez"
  }'
```

#### Listar almacenes
```bash
curl -X GET "http://localhost:3000/tenant/warehouses?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Obtener un almacén
```bash
curl -X GET http://localhost:3000/tenant/warehouses/WAREHOUSE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Actualizar un almacén
```bash
curl -X PUT http://localhost:3000/tenant/warehouses/WAREHOUSE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

#### Eliminar un almacén
```bash
curl -X DELETE http://localhost:3000/tenant/warehouses/WAREHOUSE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 Estructura de Datos

### Crear Almacén (Campos Requeridos)
```json
{
  "name": "string",                    // Nombre del almacén
  "code": "string",                    // Código único por tenant
  "street": "string",                  // Calle
  "city": "string",                    // Ciudad
  "state": "string",                   // Estado
  "zip_code": "string",                // Código postal
  "country": "string",                 // País
  "razon_social": "string",            // Razón social
  "rfc": "string",                     // RFC (formato: 13 caracteres)
  "persona_type": "Persona Física|Persona Moral"
}
```

### Campos Opcionales
```json
{
  "description": "string",             // Descripción
  "phone": "string",                   // Teléfono
  "email": "string",                   // Email
  "contact_person": "string",          // Persona de contacto
  "status": "active|inactive",         // Estado (default: active)
  "metadata": {}                       // Datos adicionales
}
```

## 🔍 Búsqueda y Filtrado

### Buscar por nombre o código
```bash
GET /tenant/warehouses?search=Central
```

### Filtrar por estado
```bash
GET /tenant/warehouses?status=active
```

### Filtrar por ubicación
```bash
GET /tenant/warehouses?state=CDMX&country=México
```

### Filtrar por código exacto
```bash
GET /tenant/warehouses?code=ALM-001
```

### Combinaciones
```bash
GET /tenant/warehouses?page=1&limit=20&search=Central&status=active&state=CDMX
```

## ✅ Validaciones

### RFC
- Formato: 3-4 letras + 6 dígitos + 3 alfanuméricos
- Ejemplo válido: `ALM123456ABC`
- Ejemplo inválido: `ALM12345ABC` (solo 12 caracteres)

### Email
- Debe ser un email válido si se proporciona
- Ejemplo: `almacen@empresa.com`

### Código
- Debe ser único dentro del tenant
- No puede haber dos almacenes con el mismo código en el mismo tenant

### Status
- Solo: `active` o `inactive`
- Default: `active`

### Persona Type
- `Persona Física` - Persona individual
- `Persona Moral` - Empresa/Sociedad

## 🔐 Permisos Requeridos

Para usar cada endpoint, el usuario debe tener:

| Endpoint | Permiso Requerido |
|----------|------------------|
| POST /tenant/warehouses | warehouses:Create |
| GET /tenant/warehouses | warehouses:Read |
| GET /tenant/warehouses/:id | warehouses:Read |
| PUT /tenant/warehouses/:id | warehouses:Update |
| DELETE /tenant/warehouses/:id | warehouses:Delete |

## 🐛 Errores Comunes

### 400 Bad Request
- RFC inválido
- Email inválido
- Código duplicado en el tenant
- Campos requeridos faltantes

### 401 Unauthorized
- Token JWT expirado o inválido
- Token no proporcionado

### 403 Forbidden
- Usuario sin permisos para la operación
- Intento de acceder a almacén de otro tenant

### 404 Not Found
- Almacén no existe
- ID inválido

## 📚 Documentación Completa

Para más detalles, consulta:
- `WAREHOUSE_MANAGEMENT_GUIDE.md` - Guía completa
- `WAREHOUSE_IMPLEMENTATION_SUMMARY.md` - Detalles técnicos
- `.kiro/specs/warehouse-management/design.md` - Diseño del sistema

## 🎯 Casos de Uso Comunes

### 1. Crear almacén para nuevo tenant
```bash
POST /tenant/warehouses
{
  "name": "Almacén Zona Norte",
  "code": "ALM-ZN-001",
  "street": "Av. Paseo de la Reforma 505",
  "city": "México",
  "state": "CDMX",
  "zip_code": "06500",
  "country": "México",
  "razon_social": "MADERIA ZONA NORTE SA DE CV",
  "rfc": "MZN123456ABC",
  "persona_type": "Persona Moral"
}
```

### 2. Listar todos los almacenes activos
```bash
GET /tenant/warehouses?status=active
```

### 3. Buscar almacén por código
```bash
GET /tenant/warehouses?code=ALM-001
```

### 4. Cambiar estado de almacén
```bash
PUT /tenant/warehouses/{id}
{
  "status": "inactive"
}
```

### 5. Actualizar información de contacto
```bash
PUT /tenant/warehouses/{id}
{
  "phone": "+52 55 9876 5432",
  "email": "nuevo@empresa.com",
  "contact_person": "María García"
}
```

## 🚦 Verificación

Para verificar que todo está funcionando:

1. ✅ Tabla `warehouses` creada en la base de datos
2. ✅ Permisos `warehouses:Create`, `warehouses:Read`, `warehouses:Update`, `warehouses:Delete` creados
3. ✅ Permisos asignados al rol Admin
4. ✅ Módulo registrado en AppModule
5. ✅ Endpoints responden correctamente
6. ✅ Búsqueda y filtrado funcionan
7. ✅ Aislamiento por tenant funciona

## 💡 Tips

- Usa `code` para identificar almacenes de forma legible (ej: ALM-001, ALM-ZN-001)
- Almacena información de contacto para comunicación directa
- Usa `metadata` para datos específicos del negocio
- Los timestamps se actualizan automáticamente
- El status default es `active`

## 🆘 Soporte

Si encuentras problemas:

1. Verifica que el módulo esté registrado en AppModule
2. Verifica que la migración se ejecutó correctamente
3. Verifica que los permisos estén creados y asignados
4. Verifica que el token JWT sea válido
5. Verifica que el usuario tenga los permisos requeridos

---

**¡Listo para usar!** 🎉
