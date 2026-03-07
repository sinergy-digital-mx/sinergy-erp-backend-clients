# Warehouse Management System - Guía Completa

## Descripción

El módulo **Warehouse** (Almacén) permite gestionar múltiples almacenes/centros de distribución dentro de cada tenant. Cada almacén tiene:

- Información básica (nombre, código, descripción)
- Dirección completa
- Información de facturación mexicana (RFC, Razón Social)
- Información de contacto
- Estado (activo/inactivo)

## Endpoints

### 1. Crear Almacén
**POST** `/tenant/warehouses`

**Permisos requeridos:** `warehouses:Create`

**Body:**
```json
{
  "name": "Almacén Central",
  "code": "ALM-001",
  "description": "Almacén principal de distribución",
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
  "contact_person": "Juan Pérez",
  "status": "active"
}
```

**Response (201):**
```json
{
  "id": "uuid-aqui",
  "tenant_id": "tenant-uuid",
  "name": "Almacén Central",
  "code": "ALM-001",
  "description": "Almacén principal de distribución",
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
  "contact_person": "Juan Pérez",
  "status": "active",
  "metadata": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 2. Listar Almacenes
**GET** `/tenant/warehouses`

**Permisos requeridos:** `warehouses:Read`

**Query Parameters:**
- `page` (default: 1) - número de página
- `limit` (default: 20, max: 100) - items por página
- `search` - buscar por nombre o código
- `status` - filtrar por 'active' o 'inactive'
- `state` - filtrar por estado
- `country` - filtrar por país
- `code` - filtrar por código exacto

**Ejemplo:**
```
GET /tenant/warehouses?page=1&limit=20&search=Central&status=active&state=CDMX
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid-aqui",
      "name": "Almacén Central",
      "code": "ALM-001",
      "status": "active",
      ...
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

---

### 3. Obtener Almacén por ID
**GET** `/tenant/warehouses/:id`

**Permisos requeridos:** `warehouses:Read`

**Response (200):**
```json
{
  "id": "uuid-aqui",
  "name": "Almacén Central",
  "code": "ALM-001",
  ...
}
```

---

### 4. Actualizar Almacén
**PUT** `/tenant/warehouses/:id`

**Permisos requeridos:** `warehouses:Update`

**Body (todos los campos opcionales):**
```json
{
  "name": "Almacén Central Actualizado",
  "status": "inactive",
  "phone": "+52 55 9876 5432"
}
```

**Response (200):** Almacén actualizado

---

### 5. Eliminar Almacén
**DELETE** `/tenant/warehouses/:id`

**Permisos requeridos:** `warehouses:Delete`

**Response (200):**
```json
{}
```

---

## Validaciones

### RFC
- Formato mexicano: 13 caracteres
- Patrón: 3-4 letras + 6 dígitos + 3 alfanuméricos
- Ejemplo: `ALM123456ABC`

### Código
- Único por tenant
- Recomendado: formato `ALM-XXX` o similar

### Status
- Solo: `active` o `inactive`
- Default: `active`

### Persona Type
- `Persona Física` - Persona individual
- `Persona Moral` - Empresa/Sociedad

### Email
- Debe ser válido si se proporciona

---

## Estructura de Datos

```typescript
Warehouse {
  id: UUID                          // Identificador único
  tenant_id: UUID                   // Tenant propietario
  
  // Información Básica
  name: string                      // Nombre del almacén
  code: string                      // Código único por tenant
  description?: string              // Descripción opcional
  
  // Dirección
  street: string                    // Calle
  city: string                      // Ciudad
  state: string                     // Estado/Provincia
  zip_code: string                  // Código postal
  country: string                   // País
  
  // Facturación Mexicana
  razon_social: string              // Razón social
  rfc: string                       // RFC (validado)
  persona_type: enum                // Física o Moral
  
  // Contacto
  phone?: string                    // Teléfono
  email?: string                    // Email (validado)
  contact_person?: string           // Persona de contacto
  
  // Estado
  status: enum                      // active | inactive
  
  // Extensibilidad
  metadata?: JSON                   // Datos adicionales
  
  // Timestamps
  created_at: timestamp             // Fecha de creación
  updated_at: timestamp             // Fecha de actualización
}
```

---

## Errores Comunes

| Código | Descripción |
|--------|-------------|
| 400 | RFC inválido, código duplicado, email inválido |
| 401 | Token expirado o inválido |
| 403 | Sin permisos para la operación |
| 404 | Almacén no encontrado |

---

## Aislamiento por Tenant

- Cada almacén pertenece a un tenant específico
- Los usuarios solo ven almacenes de su tenant
- Las operaciones se filtran automáticamente por `tenant_id`
- Al eliminar un tenant, se eliminan todos sus almacenes (cascade delete)

---

## Permisos RBAC

Para usar este módulo, el usuario debe tener los siguientes permisos:

- `warehouses:Create` - Crear almacenes
- `warehouses:Read` - Ver almacenes
- `warehouses:Update` - Actualizar almacenes
- `warehouses:Delete` - Eliminar almacenes

---

## Casos de Uso

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

---

## Integración con Otros Módulos

El módulo Warehouse puede ser referenciado por:

- **Lots** - Cada lote pertenece a un almacén
- **Transactions** - Las transacciones pueden estar asociadas a almacenes
- **Inventory** - Control de inventario por almacén
- **Sales** - Las ventas se registran desde un almacén específico

---

## Notas Importantes

1. **Código Único**: El código del almacén es único por tenant, no globalmente
2. **Facturación**: La información de RFC y Razón Social es para facturación de movimientos desde ese almacén
3. **Contacto**: Los datos de contacto son opcionales pero recomendados
4. **Metadata**: Usa el campo `metadata` para almacenar información adicional específica del negocio
5. **Timestamps**: Los timestamps se actualizan automáticamente

---

## Próximos Pasos

1. Ejecutar la migración: `npm run typeorm migration:run`
2. Registrar el módulo en `app.module.ts`
3. Crear permisos en la base de datos
4. Asignar permisos a roles
5. Probar endpoints con Postman o similar

