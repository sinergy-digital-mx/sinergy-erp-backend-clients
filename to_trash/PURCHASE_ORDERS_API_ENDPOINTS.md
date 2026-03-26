# Purchase Orders API - Endpoints y Respuestas

## Base URL
```
/tenant/purchase-orders
```

## Autenticación
- Header: `Authorization: Bearer {jwt_token}`
- El token incluye: `tenantId` y `userId`

---

## 1. Crear Orden de Compra

**Endpoint:** `POST /tenant/purchase-orders`

**Request Body:**
```json
{
  "vendor_id": "uuid-string",
  "purpose": "Compra de materiales para proyecto X",
  "warehouse_id": "uuid-string",
  "tentative_receipt_date": "2026-03-15",
  "status": "En Proceso"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "vendor_id": "vendor-uuid",
  "creator_id": "user-uuid",
  "purpose": "Compra de materiales para proyecto X",
  "warehouse_id": "warehouse-uuid",
  "tentative_receipt_date": "2026-03-15",
  "status": "En Proceso",
  "cancellation_date": null,
  "cancellation_reason": null,
  "payment_status": "No pagado",
  "payment_date": null,
  "payment_amount": null,
  "payment_method": null,
  "remaining_amount": 0,
  "total_subtotal": 0,
  "total_iva": 0,
  "total_ieps": 0,
  "grand_total": 0,
  "line_items": [],
  "payments": [],
  "documents": [],
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-08T20:30:00.000Z"
}
```

---

## 2. Listar Órdenes de Compra

**Endpoint:** `GET /tenant/purchase-orders`

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `vendor_id`: string (UUID, opcional)
- `status`: "En Proceso" | "Recibida" | "Cancelada" (opcional)
- `start_date`: string (YYYY-MM-DD, opcional)
- `end_date`: string (YYYY-MM-DD, opcional)

**Ejemplo:** `GET /tenant/purchase-orders?page=1&limit=20&status=En Proceso&vendor_id=vendor-uuid`

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "tenant-uuid",
      "vendor_id": "vendor-uuid",
      "creator_id": "user-uuid",
      "purpose": "Compra de materiales",
      "warehouse_id": "warehouse-uuid",
      "tentative_receipt_date": "2026-03-15",
      "status": "En Proceso",
      "payment_status": "No pagado",
      "total_subtotal": 10000.00,
      "total_iva": 1600.00,
      "total_ieps": 0.00,
      "grand_total": 11600.00,
      "remaining_amount": 11600.00,
      "line_items": [
        {
          "id": "line-item-uuid",
          "product_id": "product-uuid",
          "uom_id": "uom-uuid",
          "quantity": 10,
          "unit_price": 1000.00,
          "subtotal": 10000.00,
          "iva_percentage": 16,
          "iva_amount": 1600.00,
          "ieps_percentage": 0,
          "ieps_amount": 0.00,
          "line_total": 11600.00,
          "product": {
            "id": "product-uuid",
            "name": "Producto A",
            "sku": "PROD-001"
          },
          "uom": {
            "id": "uom-uuid",
            "name": "Pieza",
            "abbreviation": "pz"
          }
        }
      ],
      "payments": [],
      "warehouse": {
        "id": "warehouse-uuid",
        "name": "Almacén Principal"
      },
      "created_at": "2026-03-08T20:30:00.000Z",
      "updated_at": "2026-03-08T20:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## 3. Obtener Orden de Compra por ID

**Endpoint:** `GET /tenant/purchase-orders/:id`

**Ejemplo:** `GET /tenant/purchase-orders/550e8400-e29b-41d4-a716-446655440000`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "vendor_id": "vendor-uuid",
  "creator_id": "user-uuid",
  "purpose": "Compra de materiales para proyecto X",
  "warehouse_id": "warehouse-uuid",
  "tentative_receipt_date": "2026-03-15",
  "status": "En Proceso",
  "cancellation_date": null,
  "cancellation_reason": null,
  "payment_status": "Parcial",
  "payment_date": "2026-03-10",
  "payment_amount": 5000.00,
  "payment_method": "Transferencia",
  "remaining_amount": 6600.00,
  "total_subtotal": 10000.00,
  "total_iva": 1600.00,
  "total_ieps": 0.00,
  "grand_total": 11600.00,
  "line_items": [
    {
      "id": "line-item-uuid-1",
      "purchase_order_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "product-uuid-1",
      "uom_id": "uom-uuid-1",
      "quantity": 10,
      "unit_price": 800.00,
      "subtotal": 8000.00,
      "iva_percentage": 16,
      "iva_amount": 1280.00,
      "ieps_percentage": 0,
      "ieps_amount": 0.00,
      "line_total": 9280.00,
      "product": {
        "id": "product-uuid-1",
        "name": "Producto A",
        "sku": "PROD-001",
        "description": "Descripción del producto A"
      },
      "uom": {
        "id": "uom-uuid-1",
        "name": "Pieza",
        "abbreviation": "pz"
      },
      "created_at": "2026-03-08T20:30:00.000Z",
      "updated_at": "2026-03-08T20:30:00.000Z"
    },
    {
      "id": "line-item-uuid-2",
      "purchase_order_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "product-uuid-2",
      "uom_id": "uom-uuid-2",
      "quantity": 5,
      "unit_price": 400.00,
      "subtotal": 2000.00,
      "iva_percentage": 16,
      "iva_amount": 320.00,
      "ieps_percentage": 0,
      "ieps_amount": 0.00,
      "line_total": 2320.00,
      "product": {
        "id": "product-uuid-2",
        "name": "Producto B",
        "sku": "PROD-002"
      },
      "uom": {
        "id": "uom-uuid-2",
        "name": "Caja",
        "abbreviation": "cja"
      },
      "created_at": "2026-03-08T20:35:00.000Z",
      "updated_at": "2026-03-08T20:35:00.000Z"
    }
  ],
  "payments": [
    {
      "id": "payment-uuid-1",
      "purchase_order_id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 5000.00,
      "payment_date": "2026-03-10",
      "payment_method": "Transferencia",
      "reference": "TRANS-12345",
      "notes": "Pago parcial",
      "created_at": "2026-03-10T10:00:00.000Z",
      "updated_at": "2026-03-10T10:00:00.000Z"
    }
  ],
  "documents": [],
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal",
    "address": "Calle Principal 123"
  },
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-10T10:00:00.000Z"
}
```

---

## 4. Actualizar Orden de Compra

**Endpoint:** `PUT /tenant/purchase-orders/:id`

**Request Body:** (todos los campos son opcionales)
```json
{
  "vendor_id": "new-vendor-uuid",
  "purpose": "Propósito actualizado",
  "warehouse_id": "new-warehouse-uuid",
  "tentative_receipt_date": "2026-03-20",
  "status": "En Proceso"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "vendor_id": "new-vendor-uuid",
  "purpose": "Propósito actualizado",
  "warehouse_id": "new-warehouse-uuid",
  "tentative_receipt_date": "2026-03-20",
  "status": "En Proceso",
  "total_subtotal": 10000.00,
  "total_iva": 1600.00,
  "total_ieps": 0.00,
  "grand_total": 11600.00,
  "line_items": [...],
  "payments": [...],
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-08T21:00:00.000Z"
}
```

---

## 5. Actualizar Estado de Orden

**Endpoint:** `PUT /tenant/purchase-orders/:id/status`

**Request Body:**
```json
{
  "status": "Recibida"
}
```

**Valores permitidos:** "En Proceso" | "Recibida" | "Cancelada"

**Nota importante:** Cuando el status cambia a "Recibida", el backend automáticamente crea movimientos de inventario tipo `purchase_receipt` para todas las líneas de la orden.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Recibida",
  "total_subtotal": 10000.00,
  "total_iva": 1600.00,
  "total_ieps": 0.00,
  "grand_total": 11600.00,
  "line_items": [...],
  "updated_at": "2026-03-15T14:30:00.000Z"
}
```

---

## 6. Cancelar Orden de Compra

**Endpoint:** `POST /tenant/purchase-orders/:id/cancel`

**Request Body:**
```json
{
  "reason": "Proveedor no puede cumplir con la entrega"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Cancelada",
  "cancellation_date": "2026-03-08",
  "cancellation_reason": "Proveedor no puede cumplir con la entrega",
  "total_subtotal": 10000.00,
  "total_iva": 1600.00,
  "total_ieps": 0.00,
  "grand_total": 11600.00,
  "updated_at": "2026-03-08T22:00:00.000Z"
}
```

---

## 7. Eliminar Orden de Compra

**Endpoint:** `DELETE /tenant/purchase-orders/:id`

**Response (200):**
```json
{
  "message": "Purchase order deleted successfully"
}
```

---

## Códigos de Estado HTTP

- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos de entrada inválidos
- **401**: Unauthorized - Token inválido o faltante
- **403**: Forbidden - Sin permisos suficientes
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Conflicto (ej: orden ya cancelada)
- **500**: Internal Server Error - Error del servidor

---

## Modelos de Datos

### PurchaseOrder
```typescript
{
  id: string;
  tenant_id: string;
  vendor_id: string;
  creator_id: string;
  purpose: string;
  warehouse_id: string;
  tentative_receipt_date: string;
  status: "En Proceso" | "Recibida" | "Cancelada";
  cancellation_date?: string;
  cancellation_reason?: string;
  payment_status: "Pagada" | "Parcial" | "No pagado";
  payment_date?: string;
  payment_amount?: number;
  payment_method?: string;
  remaining_amount: number;
  total_subtotal: number;
  total_iva: number;
  total_ieps: number;
  grand_total: number;
  line_items: LineItem[];
  payments: Payment[];
  documents?: Document[];
  warehouse?: Warehouse;
  created_at: string;
  updated_at: string;
}
```

### LineItem
```typescript
{
  id: string;
  purchase_order_id: string;
  product_id: string;
  uom_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  iva_percentage: number;
  iva_amount: number;
  ieps_percentage: number;
  ieps_amount: number;
  line_total: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  uom?: {
    id: string;
    name: string;
    abbreviation: string;
  };
  created_at: string;
  updated_at: string;
}
```

### Payment
```typescript
{
  id: string;
  purchase_order_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Integración con Inventario

Cuando una orden de compra cambia su estado a **"Recibida"**, el backend automáticamente:

1. Crea movimientos de inventario tipo `purchase_receipt` para cada línea de la orden
2. Actualiza el stock en el almacén especificado
3. Registra el costo unitario de cada producto
4. Actualiza la valorización del inventario según el método configurado (FIFO, LIFO, Weighted Average)

**No se requiere ninguna acción adicional desde el frontend para la integración con inventario.**



---

## Módulos y Servicios Complementarios

Para que el módulo de Purchase Orders funcione completamente, necesitas integrar los siguientes módulos y servicios:

### 1. Módulo de Vendors (Proveedores)

**Endpoint:** `GET /tenant/vendors`

**Propósito:** Obtener lista de proveedores para seleccionar en el formulario de orden de compra.

**Query Parameters:**
- `page`: number (opcional)
- `limit`: number (opcional)
- `search`: string (opcional) - Buscar por nombre o código

**Response:**
```json
{
  "data": [
    {
      "id": "vendor-uuid",
      "name": "Proveedor ABC S.A. de C.V.",
      "code": "PROV-001",
      "email": "contacto@proveedorabc.com",
      "phone": "+52 55 1234 5678",
      "address": "Calle Principal 123, CDMX",
      "rfc": "PABC123456ABC",
      "payment_terms": "30 días",
      "status": "active"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

**Uso en Purchase Orders:**
- Dropdown/Autocomplete para seleccionar proveedor al crear/editar orden
- Mostrar información del proveedor en vista de detalle

---

### 2. Módulo de Products (Productos)

**Endpoint:** `GET /tenant/products`

**Propósito:** Obtener lista de productos para agregar como líneas en la orden de compra.

**Query Parameters:**
- `page`: number (opcional)
- `limit`: number (opcional)
- `search`: string (opcional) - Buscar por nombre o SKU
- `category_id`: string (opcional) - Filtrar por categoría

**Response:**
```json
{
  "data": [
    {
      "id": "product-uuid",
      "name": "Producto A",
      "sku": "PROD-001",
      "description": "Descripción del producto",
      "category_id": "category-uuid",
      "base_price": 1000.00,
      "cost": 800.00,
      "stock": 50,
      "base_uom_id": "uom-uuid",
      "uoms": [
        {
          "id": "uom-uuid-1",
          "name": "Pieza",
          "abbreviation": "pz",
          "conversion_factor": 1
        },
        {
          "id": "uom-uuid-2",
          "name": "Caja",
          "abbreviation": "cja",
          "conversion_factor": 12
        }
      ],
      "status": "active"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 20
}
```

**Uso en Purchase Orders:**
- Autocomplete para buscar y seleccionar productos al agregar líneas
- Obtener precio de costo sugerido (campo `cost`)
- Obtener unidades de medida disponibles para el producto
- Validar que el producto existe antes de crear la línea

---

### 3. Módulo de UoM (Unidades de Medida)

**Endpoint:** `GET /tenant/products/:productId/uoms`

**Propósito:** Obtener unidades de medida disponibles para un producto específico.

**Response:**
```json
[
  {
    "id": "uom-uuid-1",
    "name": "Pieza",
    "abbreviation": "pz",
    "conversion_factor": 1,
    "is_base": true
  },
  {
    "id": "uom-uuid-2",
    "name": "Caja",
    "abbreviation": "cja",
    "conversion_factor": 12,
    "is_base": false
  },
  {
    "id": "uom-uuid-3",
    "name": "Pallet",
    "abbreviation": "plt",
    "conversion_factor": 144,
    "is_base": false
  }
]
```

**Uso en Purchase Orders:**
- Dropdown para seleccionar unidad de medida al agregar línea
- Mostrar conversiones (ej: "1 Caja = 12 Piezas")
- Calcular cantidades en unidad base para inventario

---

### 4. Módulo de Warehouses (Almacenes)

**Endpoint:** `GET /tenant/warehouses`

**Propósito:** Obtener lista de almacenes donde se recibirá la mercancía.

**Response:**
```json
{
  "data": [
    {
      "id": "warehouse-uuid",
      "name": "Almacén Principal",
      "code": "ALM-001",
      "address": "Calle Industrial 456, CDMX",
      "type": "main",
      "status": "active",
      "manager_id": "user-uuid",
      "capacity": 10000
    },
    {
      "id": "warehouse-uuid-2",
      "name": "Almacén Sucursal Norte",
      "code": "ALM-002",
      "address": "Av. Norte 789, Monterrey",
      "type": "branch",
      "status": "active"
    }
  ],
  "total": 5
}
```

**Uso en Purchase Orders:**
- Dropdown para seleccionar almacén de destino
- Validar que el almacén existe y está activo
- Mostrar información del almacén en vista de detalle

---

### 5. Módulo de Inventory (Inventario)

**Endpoint:** `GET /tenant/inventory/items`

**Propósito:** Consultar stock actual de productos (opcional, para referencia).

**Query Parameters:**
- `product_id`: string (UUID)
- `warehouse_id`: string (UUID)

**Response:**
```json
{
  "data": [
    {
      "id": "inventory-item-uuid",
      "product_id": "product-uuid",
      "warehouse_id": "warehouse-uuid",
      "uom_id": "uom-uuid",
      "quantity_on_hand": 100,
      "quantity_reserved": 20,
      "quantity_available": 80,
      "reorder_point": 50,
      "unit_cost": 800.00,
      "total_value": 80000.00,
      "product": {
        "name": "Producto A",
        "sku": "PROD-001"
      }
    }
  ]
}
```

**Uso en Purchase Orders:**
- Mostrar stock actual al seleccionar producto (opcional)
- Alertar si el stock está bajo el punto de reorden
- Sugerir cantidad de compra basada en reorder_quantity

**Integración Automática:**
- Cuando la orden cambia a estado "Recibida", el backend automáticamente crea movimientos de inventario
- No se requiere llamada manual al API de inventario

---

### 6. Módulo de Users (Usuarios)

**Endpoint:** `GET /tenant/users/me`

**Propósito:** Obtener información del usuario actual (creador de la orden).

**Response:**
```json
{
  "id": "user-uuid",
  "email": "usuario@empresa.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+52 55 9876 5432",
  "tenant_id": "tenant-uuid",
  "roles": ["comprador", "gerente"],
  "permissions": [
    "purchase_orders:Create",
    "purchase_orders:Read",
    "purchase_orders:Update",
    "purchase_orders:Delete"
  ]
}
```

**Uso en Purchase Orders:**
- Obtener `creator_id` automáticamente del token JWT
- Mostrar nombre del creador en vista de detalle
- Validar permisos antes de mostrar acciones

---

### 7. Módulo de RBAC (Permisos)

**Permisos Requeridos:**

| Permiso | Descripción | Acciones Permitidas |
|---------|-------------|---------------------|
| `purchase_orders:Create` | Crear órdenes de compra | POST /tenant/purchase-orders |
| `purchase_orders:Read` | Ver órdenes de compra | GET /tenant/purchase-orders, GET /tenant/purchase-orders/:id |
| `purchase_orders:Update` | Actualizar órdenes | PUT /tenant/purchase-orders/:id, PUT /tenant/purchase-orders/:id/status, POST /tenant/purchase-orders/:id/cancel |
| `purchase_orders:Delete` | Eliminar órdenes | DELETE /tenant/purchase-orders/:id |

**Validación de Permisos:**
- El backend valida permisos automáticamente en cada endpoint
- El frontend debe ocultar/deshabilitar botones según permisos del usuario
- Respuesta 403 si el usuario no tiene permisos suficientes

---

### 8. Módulo de Documents (Documentos) - Opcional

**Endpoint:** `POST /tenant/purchase-orders/:id/documents`

**Propósito:** Subir documentos adjuntos a la orden (facturas, cotizaciones, etc.).

**Request:** Multipart/form-data
```
file: [archivo]
document_type: "invoice" | "quote" | "contract" | "other"
description: "Factura del proveedor"
```

**Response:**
```json
{
  "id": "document-uuid",
  "purchase_order_id": "order-uuid",
  "file_name": "factura-001.pdf",
  "file_url": "https://storage.example.com/documents/factura-001.pdf",
  "document_type": "invoice",
  "description": "Factura del proveedor",
  "uploaded_by": "user-uuid",
  "created_at": "2026-03-08T20:30:00.000Z"
}
```

**Endpoint para Listar:** `GET /tenant/purchase-orders/:id/documents`

**Endpoint para Descargar:** `GET /tenant/documents/:id/download`

---

### 9. Módulo de Payments (Pagos) - Opcional

**Endpoint:** `POST /tenant/purchase-orders/:id/payments`

**Propósito:** Registrar pagos realizados a la orden de compra.

**Request Body:**
```json
{
  "amount": 5000.00,
  "payment_date": "2026-03-10",
  "payment_method": "Transferencia",
  "reference": "TRANS-12345",
  "notes": "Pago parcial"
}
```

**Response:**
```json
{
  "id": "payment-uuid",
  "purchase_order_id": "order-uuid",
  "amount": 5000.00,
  "payment_date": "2026-03-10",
  "payment_method": "Transferencia",
  "reference": "TRANS-12345",
  "notes": "Pago parcial",
  "created_at": "2026-03-10T10:00:00.000Z"
}
```

**Actualización Automática:**
- El backend actualiza automáticamente `payment_status` de la orden
- Calcula `remaining_amount` = `grand_total` - suma de pagos
- Estados: "No pagado", "Parcial", "Pagada"

---

## Flujo de Integración Completo

### Crear Orden de Compra:
1. **GET** `/tenant/vendors` → Seleccionar proveedor
2. **GET** `/tenant/warehouses` → Seleccionar almacén
3. **GET** `/tenant/products?search=...` → Buscar productos
4. **GET** `/tenant/products/:id/uoms` → Obtener UoMs del producto
5. **POST** `/tenant/purchase-orders` → Crear orden con líneas

### Recibir Mercancía:
1. **PUT** `/tenant/purchase-orders/:id/status` con `status: "Recibida"`
2. Backend automáticamente:
   - Crea movimientos de inventario (`purchase_receipt`)
   - Actualiza stock en el almacén
   - Actualiza costos de productos

### Registrar Pagos:
1. **POST** `/tenant/purchase-orders/:id/payments` → Registrar pago
2. Backend actualiza automáticamente `payment_status` y `remaining_amount`

---

## Resumen de Dependencias

| Módulo | Requerido | Propósito |
|--------|-----------|-----------|
| Vendors | ✅ Sí | Seleccionar proveedor |
| Products | ✅ Sí | Agregar líneas de productos |
| UoM | ✅ Sí | Unidades de medida |
| Warehouses | ✅ Sí | Almacén de destino |
| Inventory | ⚠️ Automático | Integración automática al recibir |
| Users | ✅ Sí | Creador y permisos |
| RBAC | ✅ Sí | Control de acceso |
| Documents | ❌ Opcional | Adjuntar archivos |
| Payments | ❌ Opcional | Registrar pagos |



---

## API de Permisos RBAC por Tenant

El sistema incluye un módulo completo de RBAC (Role-Based Access Control) que gestiona roles y permisos por tenant.

### Obtener Permisos Disponibles para el Tenant

**Endpoint:** `GET /tenant/roles/permissions/available`

**Propósito:** Obtener todos los permisos disponibles para el tenant actual, agrupados por módulo.

**Response:**
```json
{
  "modules": [
    {
      "id": "module-uuid",
      "name": "Purchase Orders Module",
      "code": "purchase_orders",
      "permissions": [
        {
          "id": "permission-uuid-1",
          "entity": "purchase_orders",
          "action": "Create",
          "description": "Create purchase orders"
        },
        {
          "id": "permission-uuid-2",
          "entity": "purchase_orders",
          "action": "Read",
          "description": "Read purchase orders"
        },
        {
          "id": "permission-uuid-3",
          "entity": "purchase_orders",
          "action": "Update",
          "description": "Update purchase orders"
        },
        {
          "id": "permission-uuid-4",
          "entity": "purchase_orders",
          "action": "Delete",
          "description": "Delete purchase orders"
        }
      ]
    },
    {
      "id": "module-uuid-2",
      "name": "Inventory Module",
      "code": "inventory",
      "permissions": [
        {
          "id": "permission-uuid-5",
          "entity": "inventory",
          "action": "Create",
          "description": "Create inventory items"
        },
        {
          "id": "permission-uuid-6",
          "entity": "inventory",
          "action": "Read",
          "description": "Read inventory"
        }
      ]
    }
  ]
}
```

**Uso:**
- Mostrar lista de permisos disponibles al crear/editar roles
- Validar que los permisos existen antes de asignarlos
- Filtrar permisos por módulo habilitado en el tenant

---

### Obtener Roles del Tenant

**Endpoint:** `GET /tenant/roles`

**Propósito:** Listar todos los roles disponibles en el tenant actual.

**Response:**
```json
{
  "roles": [
    {
      "id": "role-uuid-1",
      "name": "Gerente de Compras",
      "description": "Gestiona todas las órdenes de compra",
      "is_system_role": false,
      "user_count": 3,
      "permission_count": 12,
      "created_at": "2026-01-15T10:00:00.000Z"
    },
    {
      "id": "role-uuid-2",
      "name": "Comprador",
      "description": "Crea y gestiona órdenes de compra",
      "is_system_role": false,
      "user_count": 8,
      "permission_count": 6,
      "created_at": "2026-01-20T14:30:00.000Z"
    },
    {
      "id": "role-uuid-3",
      "name": "Almacenista",
      "description": "Recibe mercancía y actualiza inventario",
      "is_system_role": false,
      "user_count": 5,
      "permission_count": 4,
      "created_at": "2026-02-01T09:00:00.000Z"
    }
  ]
}
```

---

### Obtener Detalles de un Rol

**Endpoint:** `GET /tenant/roles/:roleId`

**Propósito:** Obtener información detallada de un rol específico con sus permisos.

**Response:**
```json
{
  "role": {
    "id": "role-uuid-1",
    "name": "Gerente de Compras",
    "description": "Gestiona todas las órdenes de compra",
    "is_system_role": false,
    "user_count": 3,
    "permission_count": 12,
    "created_at": "2026-01-15T10:00:00.000Z"
  },
  "permissions": [
    {
      "id": "permission-uuid-1",
      "module": "purchase_orders",
      "action": "Create",
      "description": "Create purchase orders"
    },
    {
      "id": "permission-uuid-2",
      "module": "purchase_orders",
      "action": "Read",
      "description": "Read purchase orders"
    },
    {
      "id": "permission-uuid-3",
      "module": "purchase_orders",
      "action": "Update",
      "description": "Update purchase orders"
    },
    {
      "id": "permission-uuid-4",
      "module": "purchase_orders",
      "action": "Delete",
      "description": "Delete purchase orders"
    },
    {
      "id": "permission-uuid-5",
      "module": "inventory",
      "action": "Read",
      "description": "Read inventory"
    },
    {
      "id": "permission-uuid-6",
      "module": "vendors",
      "action": "Read",
      "description": "Read vendors"
    }
  ]
}
```

---

### Crear Rol

**Endpoint:** `POST /tenant/roles`

**Request Body:**
```json
{
  "name": "Comprador Junior",
  "description": "Puede crear órdenes pero no aprobarlas",
  "permission_ids": [
    "permission-uuid-1",
    "permission-uuid-2"
  ]
}
```

**Response (201):**
```json
{
  "role": {
    "id": "new-role-uuid",
    "name": "Comprador Junior",
    "description": "Puede crear órdenes pero no aprobarlas",
    "is_system_role": false,
    "tenant_id": "tenant-uuid",
    "created_at": "2026-03-08T20:30:00.000Z"
  },
  "permissions": [
    {
      "id": "permission-uuid-1",
      "module": "purchase_orders",
      "action": "Create",
      "description": "Create purchase orders"
    },
    {
      "id": "permission-uuid-2",
      "module": "purchase_orders",
      "action": "Read",
      "description": "Read purchase orders"
    }
  ]
}
```

---

### Actualizar Rol

**Endpoint:** `PUT /tenant/roles/:roleId`

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "Gerente de Compras Senior",
  "description": "Descripción actualizada",
  "permission_ids": [
    "permission-uuid-1",
    "permission-uuid-2",
    "permission-uuid-3",
    "permission-uuid-4"
  ]
}
```

**Response (200):**
```json
{
  "role": {
    "id": "role-uuid-1",
    "name": "Gerente de Compras Senior",
    "description": "Descripción actualizada",
    "is_system_role": false,
    "updated_at": "2026-03-08T21:00:00.000Z"
  },
  "permissions": [...]
}
```

---

### Asignar Permisos a Rol

**Endpoint:** `POST /tenant/roles/:roleId/permissions`

**Request Body:**
```json
{
  "permission_ids": [
    "permission-uuid-5",
    "permission-uuid-6"
  ]
}
```

**Nota:** Este endpoint AGREGA permisos a los existentes, no los reemplaza.

**Response (201):**
```json
{
  "permissions": [
    {
      "id": "permission-uuid-1",
      "module": "purchase_orders",
      "action": "Create",
      "description": "Create purchase orders"
    },
    {
      "id": "permission-uuid-5",
      "module": "inventory",
      "action": "Read",
      "description": "Read inventory"
    },
    {
      "id": "permission-uuid-6",
      "module": "vendors",
      "action": "Read",
      "description": "Read vendors"
    }
  ]
}
```

---

### Eliminar Permiso de Rol

**Endpoint:** `DELETE /tenant/roles/:roleId/permissions/:permissionId`

**Response (204):** No content

---

### Eliminar Rol

**Endpoint:** `DELETE /tenant/roles/:roleId`

**Response (204):** No content

**Nota:** Al eliminar un rol, se remueve automáticamente de todos los usuarios que lo tenían asignado.

---

### Obtener Permisos del Usuario Actual

**Endpoint:** `GET /tenant/users/me`

**Response:**
```json
{
  "id": "user-uuid",
  "email": "usuario@empresa.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "tenant_id": "tenant-uuid",
  "roles": [
    {
      "id": "role-uuid-1",
      "name": "Gerente de Compras"
    }
  ],
  "permissions": [
    "purchase_orders:Create",
    "purchase_orders:Read",
    "purchase_orders:Update",
    "purchase_orders:Delete",
    "inventory:Read",
    "vendors:Read",
    "products:Read",
    "warehouses:Read"
  ]
}
```

**Uso:**
- Obtener permisos del usuario al iniciar sesión
- Guardar en estado global (Redux, Context, etc.)
- Validar permisos antes de mostrar botones/acciones
- Redirigir si no tiene permisos suficientes

---

## Validación de Permisos en el Frontend

### Ejemplo de Uso en Angular

```typescript
// auth.service.ts
export class AuthService {
  private currentUser: User;

  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }
}

// purchase-order-list.component.ts
export class PurchaseOrderListComponent {
  canCreate = this.authService.hasPermission('purchase_orders:Create');
  canUpdate = this.authService.hasPermission('purchase_orders:Update');
  canDelete = this.authService.hasPermission('purchase_orders:Delete');

  constructor(private authService: AuthService) {}
}
```

```html
<!-- purchase-order-list.component.html -->
<button *ngIf="canCreate" (click)="createOrder()">
  Nueva Orden de Compra
</button>

<button *ngIf="canUpdate" (click)="editOrder(order)">
  Editar
</button>

<button *ngIf="canDelete" (click)="deleteOrder(order)">
  Eliminar
</button>
```

---

## Resumen de Permisos para Purchase Orders

| Permiso | Descripción | Endpoints Permitidos |
|---------|-------------|---------------------|
| `purchase_orders:Create` | Crear órdenes de compra | POST /tenant/purchase-orders |
| `purchase_orders:Read` | Ver órdenes de compra | GET /tenant/purchase-orders, GET /tenant/purchase-orders/:id |
| `purchase_orders:Update` | Actualizar órdenes | PUT /tenant/purchase-orders/:id, PUT /tenant/purchase-orders/:id/status, POST /tenant/purchase-orders/:id/cancel |
| `purchase_orders:Delete` | Eliminar órdenes | DELETE /tenant/purchase-orders/:id |

**Nota:** El backend valida automáticamente los permisos en cada request. Si el usuario no tiene el permiso requerido, recibirá un error 403 (Forbidden).

