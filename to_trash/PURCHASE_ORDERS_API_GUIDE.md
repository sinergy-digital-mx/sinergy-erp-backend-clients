# Purchase Orders API - Guía Rápida

## Crear una Purchase Order (CON Line Items)

### Endpoint
```
POST /api/tenant/purchase-orders
```

### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Body Request (CON productos)

```json
{
  "vendor_id": "61ca49d3-f054-4a53-8b19-77f2081ed81e",
  "purpose": "Compra mensual de materia prima",
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "tentative_receipt_date": "2026-03-19",
  "line_items": [
    {
      "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
      "uom_id": "273f603f-297c-46f0-9238-6a3b4021d0f6",
      "quantity": 100,
      "unit_price": 25.50,
      "iva_percentage": 16,
      "ieps_percentage": 0
    },
    {
      "product_id": "358008be-6173-4140-a0df-6f752d691f2d",
      "uom_id": "273f603f-297c-46f0-9238-6a3b4021d0f6",
      "quantity": 50,
      "unit_price": 15.00,
      "iva_percentage": 16,
      "ieps_percentage": 8
    }
  ]
}
```

### Body Request (SIN productos - solo header)

```json
{
  "vendor_id": "61ca49d3-f054-4a53-8b19-77f2081ed81e",
  "purpose": "Compra de materiales para producción",
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "tentative_receipt_date": "2026-03-15"
}
```

### Campos Purchase Order

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `vendor_id` | UUID | Sí | ID del proveedor |
| `purpose` | string | Sí | Propósito de la orden de compra (máx 500 caracteres) |
| `warehouse_id` | UUID | Sí | ID del almacén donde se recibirán los productos |
| `tentative_receipt_date` | date | Sí | Fecha tentativa de recepción (formato: YYYY-MM-DD) |
| `status` | enum | No | Estado inicial. Valores: 'En Proceso', 'Recibida', 'Cancelada'. Default: 'En Proceso' |
| `line_items` | array | No | Array de productos a comprar |

### Campos Line Item (dentro de line_items)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | UUID | Sí | ID del producto |
| `uom_id` | UUID | Sí | ID de la unidad de medida |
| `quantity` | decimal | Sí | Cantidad (mínimo 0.01) |
| `unit_price` | decimal | Sí | Precio unitario (mínimo 0) |
| `iva_percentage` | decimal | No | Porcentaje de IVA (0-100). Default: 0 |
| `ieps_percentage` | decimal | No | Porcentaje de IEPS (0-100). Default: 0 |

**Nota**: Los campos `subtotal`, `iva_amount`, `ieps_amount` y `line_total` se calculan automáticamente.

### Response (201 Created)

```json
{
  "id": "uuid-generado",
  "tenant_id": "uuid-del-tenant",
  "vendor_id": "61ca49d3-f054-4a53-8b19-77f2081ed81e",
  "creator_id": "uuid-del-usuario",
  "purpose": "Compra mensual de materia prima",
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "tentative_receipt_date": "2026-03-19",
  "status": "En Proceso",
  "payment_status": "No pagado",
  "total_subtotal": 3300.00,
  "total_iva": 528.00,
  "total_ieps": 60.00,
  "grand_total": 3888.00,
  "remaining_amount": 3888.00,
  "created_at": "2024-03-08T10:30:00.000Z",
  "updated_at": "2024-03-08T10:30:00.000Z",
  "line_items": [
    {
      "id": "line-item-uuid-1",
      "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
      "uom_id": "273f603f-297c-46f0-9238-6a3b4021d0f6",
      "quantity": 100,
      "unit_price": 25.50,
      "subtotal": 2550.00,
      "iva_percentage": 16,
      "iva_amount": 408.00,
      "ieps_percentage": 0,
      "ieps_amount": 0,
      "line_total": 2958.00,
      "created_at": "2024-03-08T10:30:00.000Z",
      "updated_at": "2024-03-08T10:30:00.000Z"
    },
    {
      "id": "line-item-uuid-2",
      "product_id": "358008be-6173-4140-a0df-6f752d691f2d",
      "uom_id": "273f603f-297c-46f0-9238-6a3b4021d0f6",
      "quantity": 50,
      "unit_price": 15.00,
      "subtotal": 750.00,
      "iva_percentage": 16,
      "iva_amount": 120.00,
      "ieps_percentage": 8,
      "ieps_amount": 60.00,
      "line_total": 930.00,
      "created_at": "2024-03-08T10:30:00.000Z",
      "updated_at": "2024-03-08T10:30:00.000Z"
    }
  ],
  "payments": [],
  "documents": []
}
```

---

## Otros Endpoints Disponibles

### Listar Purchase Orders
```
GET /api/tenant/purchase-orders?page=1&limit=20&status=En Proceso
```

**Query Parameters:**
- `page` (opcional): Número de página. Default: 1
- `limit` (opcional): Registros por página. Default: 20, Max: 100
- `vendor_id` (opcional): Filtrar por proveedor
- `status` (opcional): Filtrar por estado
- `start_date` (opcional): Fecha inicio (YYYY-MM-DD)
- `end_date` (opcional): Fecha fin (YYYY-MM-DD)

### Obtener una Purchase Order
```
GET /api/tenant/purchase-orders/:id
```

### Actualizar Purchase Order
```
PUT /api/tenant/purchase-orders/:id
```

Body: Mismos campos que crear (todos opcionales)

### Actualizar Estado
```
PUT /api/tenant/purchase-orders/:id/status
```

```json
{
  "status": "Recibida"
}
```

### Cancelar Purchase Order
```
POST /api/tenant/purchase-orders/:id/cancel
```

```json
{
  "cancellation_reason": "Proveedor no puede cumplir con la entrega"
}
```

### Eliminar Purchase Order
```
DELETE /api/tenant/purchase-orders/:id
```

---

## Estados de Purchase Order

| Estado | Descripción |
|--------|-------------|
| `En Proceso` | Orden creada, pendiente de recepción |
| `Recibida` | Productos recibidos en almacén |
| `Cancelada` | Orden cancelada |

## Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `No pagado` | Sin pagos registrados |
| `Parcial` | Pagos parciales realizados |
| `Pagada` | Totalmente pagada |

---

## Ejemplo Completo: Crear Purchase Order

```bash
curl -X POST https://api.example.com/api/tenant/purchase-orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "123e4567-e89b-12d3-a456-426614174000",
    "purpose": "Compra mensual de materia prima",
    "warehouse_id": "987fcdeb-51a2-43f7-9abc-123456789def",
    "tentative_receipt_date": "2024-03-20"
  }'
```

---

## Permisos Requeridos

Todas las operaciones requieren autenticación JWT y los siguientes permisos RBAC:

| Operación | Permiso Requerido |
|-----------|-------------------|
| Crear | `purchase_orders:Create` |
| Leer | `purchase_orders:Read` |
| Actualizar | `purchase_orders:Update` |
| Eliminar | `purchase_orders:Delete` |

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - Sin permisos suficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: orden ya cancelada) |
| 500 | Internal Server Error |

---

## Notas Importantes

1. **UUIDs**: Todos los IDs deben ser UUIDs válidos v4
2. **Fechas**: Usar formato ISO 8601 (YYYY-MM-DD)
3. **Tenant**: El `tenant_id` se obtiene automáticamente del token JWT
4. **Creator**: El `creator_id` se obtiene automáticamente del usuario autenticado
5. **Cálculos**: Los totales (subtotal, IVA, IEPS, grand_total) se calculan automáticamente al agregar line items
