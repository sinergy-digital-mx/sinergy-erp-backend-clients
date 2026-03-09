# Inventory API - Endpoints y Respuestas

## Base URL
```
/tenant/inventory
```

## Autenticación
- Header: `Authorization: Bearer {jwt_token}`
- El token incluye: `tenantId` y `userId`

---

## SECCIÓN 1: INVENTORY ITEMS (Artículos de Inventario)

### 1.1 Crear Artículo de Inventario

**Endpoint:** `POST /tenant/inventory/items`

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "warehouse_id": "uuid-string",
  "uom_id": "uuid-string",
  "quantity_on_hand": 100,
  "reorder_point": 20,
  "reorder_quantity": 50,
  "location": "A-01-03",
  "valuation_method": "Weighted_Average",
  "unit_cost": 10.50
}
```

**Campos opcionales:** `quantity_on_hand`, `reorder_point`, `reorder_quantity`, `location`, `valuation_method`, `unit_cost`

**Métodos de valorización disponibles:** `FIFO`, `LIFO`, `Weighted_Average` (default)

**Response (201):**
```json
{
  "id": "inventory-item-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "quantity_on_hand": 100,
  "quantity_reserved": 0,
  "quantity_available": 100,
  "reorder_point": 20,
  "reorder_quantity": 50,
  "location": "A-01-03",
  "valuation_method": "Weighted_Average",
  "unit_cost": 10.50,
  "total_value": 1050.00,
  "cost_layers": [],
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001"
  },
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal"
  },
  "uom": {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz"
  },
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-08T20:30:00.000Z"
}
```

---

### 1.2 Listar Artículos de Inventario

**Endpoint:** `GET /tenant/inventory/items`

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `product_id`: string (UUID, opcional)
- `warehouse_id`: string (UUID, opcional)
- `location`: string (opcional)
- `low_stock`: boolean (opcional) - Filtrar artículos bajo punto de reorden

**Ejemplo:** `GET /tenant/inventory/items?page=1&limit=20&warehouse_id=warehouse-uuid&low_stock=true`

**Response (200):**
```json
{
  "data": [
    {
      "id": "inventory-item-uuid",
      "product_id": "product-uuid",
      "warehouse_id": "warehouse-uuid",
      "uom_id": "uom-uuid",
      "quantity_on_hand": 15,
      "quantity_reserved": 5,
      "quantity_available": 10,
      "reorder_point": 20,
      "reorder_quantity": 50,
      "location": "A-01-03",
      "valuation_method": "Weighted_Average",
      "unit_cost": 10.50,
      "total_value": 157.50,
      "product": {
        "id": "product-uuid",
        "name": "Producto A",
        "sku": "PROD-001"
      },
      "warehouse": {
        "id": "warehouse-uuid",
        "name": "Almacén Principal"
      },
      "uom": {
        "id": "uom-uuid",
        "name": "Pieza",
        "abbreviation": "pz"
      },
      "created_at": "2026-03-08T20:30:00.000Z",
      "updated_at": "2026-03-08T20:30:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

### 1.3 Obtener Artículo de Inventario por ID

**Endpoint:** `GET /tenant/inventory/items/:id`

**Response (200):**
```json
{
  "id": "inventory-item-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "quantity_on_hand": 100,
  "quantity_reserved": 20,
  "quantity_available": 80,
  "reorder_point": 20,
  "reorder_quantity": 50,
  "location": "A-01-03",
  "valuation_method": "FIFO",
  "unit_cost": 10.50,
  "total_value": 1050.00,
  "cost_layers": [
    {
      "quantity": 50,
      "unit_cost": 10.00,
      "date": "2026-03-01T10:00:00.000Z"
    },
    {
      "quantity": 50,
      "unit_cost": 11.00,
      "date": "2026-03-05T14:00:00.000Z"
    }
  ],
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001",
    "description": "Descripción del producto"
  },
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal",
    "code": "ALM-001"
  },
  "uom": {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz"
  },
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-08T20:30:00.000Z"
}
```

---

### 1.4 Actualizar Artículo de Inventario

**Endpoint:** `PUT /tenant/inventory/items/:id`

**Request Body:** (todos los campos opcionales)
```json
{
  "reorder_point": 30,
  "reorder_quantity": 100,
  "location": "B-02-05",
  "valuation_method": "FIFO"
}
```

**Response (200):**
```json
{
  "id": "inventory-item-uuid",
  "reorder_point": 30,
  "reorder_quantity": 100,
  "location": "B-02-05",
  "valuation_method": "FIFO",
  "updated_at": "2026-03-08T21:00:00.000Z"
}
```

---

### 1.5 Eliminar Artículo de Inventario

**Endpoint:** `DELETE /tenant/inventory/items/:id`

**Response (200):**
```json
{
  "message": "Inventory item deleted successfully"
}
```

---

## SECCIÓN 2: INVENTORY MOVEMENTS (Movimientos de Inventario)

### 2.1 Crear Movimiento de Inventario

**Endpoint:** `POST /tenant/inventory/movements`

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "warehouse_id": "uuid-string",
  "uom_id": "uuid-string",
  "movement_type": "adjustment",
  "quantity": 50,
  "unit_cost": 10.50,
  "reference_type": "manual_adjustment",
  "reference_id": "uuid-string",
  "location": "A-01-03",
  "lot_number": "LOT-2024-001",
  "serial_number": "SN-123456",
  "notes": "Physical count adjustment",
  "movement_date": "2026-03-08T10:00:00Z"
}
```

**Tipos de movimiento disponibles:**
- `purchase_receipt` - Recepción de compra
- `sales_shipment` - Envío de venta
- `adjustment` - Ajuste de inventario
- `transfer_in` - Transferencia entrante
- `transfer_out` - Transferencia saliente
- `initial_balance` - Saldo inicial
- `return_to_vendor` - Devolución a proveedor
- `return_from_customer` - Devolución de cliente

**Campos opcionales:** `reference_type`, `reference_id`, `location`, `lot_number`, `serial_number`, `notes`, `movement_date`

**Response (201):**
```json
{
  "id": "movement-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "movement_type": "adjustment",
  "quantity": 50,
  "unit_cost": 10.50,
  "total_cost": 525.00,
  "reference_type": "manual_adjustment",
  "reference_id": "uuid-string",
  "location": "A-01-03",
  "lot_number": "LOT-2024-001",
  "serial_number": "SN-123456",
  "notes": "Physical count adjustment",
  "movement_date": "2026-03-08T10:00:00.000Z",
  "created_by_user_id": "user-uuid",
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001"
  },
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal"
  },
  "uom": {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz"
  },
  "created_at": "2026-03-08T20:30:00.000Z"
}
```

---

### 2.2 Listar Movimientos de Inventario

**Endpoint:** `GET /tenant/inventory/movements`

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `product_id`: string (UUID, opcional)
- `warehouse_id`: string (UUID, opcional)
- `movement_type`: string (opcional)
- `start_date`: string (YYYY-MM-DD, opcional)
- `end_date`: string (YYYY-MM-DD, opcional)
- `reference_type`: string (opcional)
- `reference_id`: string (UUID, opcional)

**Ejemplo:** `GET /tenant/inventory/movements?product_id=product-uuid&movement_type=purchase_receipt&start_date=2026-03-01`

**Response (200):**
```json
{
  "data": [
    {
      "id": "movement-uuid",
      "product_id": "product-uuid",
      "warehouse_id": "warehouse-uuid",
      "uom_id": "uom-uuid",
      "movement_type": "purchase_receipt",
      "quantity": 100,
      "unit_cost": 10.50,
      "total_cost": 1050.00,
      "reference_type": "purchase_order",
      "reference_id": "po-uuid",
      "movement_date": "2026-03-08T10:00:00.000Z",
      "product": {
        "name": "Producto A",
        "sku": "PROD-001"
      },
      "warehouse": {
        "name": "Almacén Principal"
      },
      "created_at": "2026-03-08T20:30:00.000Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20,
  "totalPages": 25
}
```

---

### 2.3 Obtener Movimiento por ID

**Endpoint:** `GET /tenant/inventory/movements/:id`

**Response (200):**
```json
{
  "id": "movement-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "movement_type": "purchase_receipt",
  "quantity": 100,
  "unit_cost": 10.50,
  "total_cost": 1050.00,
  "reference_type": "purchase_order",
  "reference_id": "po-uuid",
  "location": "A-01-03",
  "lot_number": "LOT-2024-001",
  "notes": "Received from PO-001",
  "movement_date": "2026-03-08T10:00:00.000Z",
  "created_by_user_id": "user-uuid",
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001",
    "description": "Descripción"
  },
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal",
    "code": "ALM-001"
  },
  "uom": {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz"
  },
  "created_by_user": {
    "id": "user-uuid",
    "first_name": "Juan",
    "last_name": "Pérez"
  },
  "created_at": "2026-03-08T20:30:00.000Z"
}
```

---

## SECCIÓN 3: STOCK RESERVATIONS (Reservas de Stock)

### 3.1 Crear Reserva de Stock

**Endpoint:** `POST /tenant/inventory/reservations`

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "warehouse_id": "uuid-string",
  "uom_id": "uuid-string",
  "quantity_reserved": 10,
  "reference_type": "sales_order",
  "reference_id": "uuid-string",
  "expires_at": "2026-03-15T10:00:00Z"
}
```

**Campo opcional:** `expires_at`

**Response (201):**
```json
{
  "id": "reservation-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "quantity_reserved": 10,
  "reference_type": "sales_order",
  "reference_id": "so-uuid",
  "status": "active",
  "reserved_at": "2026-03-08T20:30:00.000Z",
  "expires_at": "2026-03-15T10:00:00.000Z",
  "fulfilled_at": null,
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001"
  },
  "warehouse": {
    "id": "warehouse-uuid",
    "name": "Almacén Principal"
  },
  "uom": {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz"
  },
  "created_at": "2026-03-08T20:30:00.000Z",
  "updated_at": "2026-03-08T20:30:00.000Z"
}
```

---

### 3.2 Listar Reservas de Stock

**Endpoint:** `GET /tenant/inventory/reservations`

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `product_id`: string (UUID, opcional)
- `warehouse_id`: string (UUID, opcional)
- `status`: "active" | "fulfilled" | "cancelled" | "expired" (opcional)
- `reference_type`: string (opcional)
- `reference_id`: string (UUID, opcional)

**Ejemplo:** `GET /tenant/inventory/reservations?status=active&warehouse_id=warehouse-uuid`

**Response (200):**
```json
{
  "data": [
    {
      "id": "reservation-uuid",
      "product_id": "product-uuid",
      "warehouse_id": "warehouse-uuid",
      "uom_id": "uom-uuid",
      "quantity_reserved": 10,
      "reference_type": "sales_order",
      "reference_id": "so-uuid",
      "status": "active",
      "reserved_at": "2026-03-08T20:30:00.000Z",
      "expires_at": "2026-03-15T10:00:00.000Z",
      "product": {
        "name": "Producto A",
        "sku": "PROD-001"
      },
      "warehouse": {
        "name": "Almacén Principal"
      },
      "created_at": "2026-03-08T20:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 3.3 Obtener Reserva por ID

**Endpoint:** `GET /tenant/inventory/reservations/:id`

**Response (200):** (igual estructura que en 3.1)

---

### 3.4 Cumplir Reserva

**Endpoint:** `POST /tenant/inventory/reservations/:id/fulfill`

**Propósito:** Marca la reserva como cumplida y libera el stock reservado.

**Response (200):**
```json
{
  "id": "reservation-uuid",
  "status": "fulfilled",
  "fulfilled_at": "2026-03-10T14:30:00.000Z",
  "updated_at": "2026-03-10T14:30:00.000Z"
}
```

---

### 3.5 Cancelar Reserva

**Endpoint:** `POST /tenant/inventory/reservations/:id/cancel`

**Propósito:** Cancela la reserva y libera el stock reservado.

**Response (200):**
```json
{
  "id": "reservation-uuid",
  "status": "cancelled",
  "updated_at": "2026-03-10T14:30:00.000Z"
}
```

---

## SECCIÓN 4: TRANSFERS & ADJUSTMENTS (Transferencias y Ajustes)

### 4.1 Transferir Inventario entre Almacenes

**Endpoint:** `POST /tenant/inventory/transfer`

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "source_warehouse_id": "uuid-string",
  "destination_warehouse_id": "uuid-string",
  "uom_id": "uuid-string",
  "quantity": 50,
  "unit_cost": 10.50,
  "notes": "Transfer for restock"
}
```

**Campo opcional:** `notes`

**Response (201):**
```json
{
  "transfer_out": {
    "id": "movement-out-uuid",
    "product_id": "product-uuid",
    "warehouse_id": "source-warehouse-uuid",
    "movement_type": "transfer_out",
    "quantity": -50,
    "unit_cost": 10.50,
    "total_cost": -525.00,
    "notes": "Transfer for restock",
    "movement_date": "2026-03-08T20:30:00.000Z"
  },
  "transfer_in": {
    "id": "movement-in-uuid",
    "product_id": "product-uuid",
    "warehouse_id": "destination-warehouse-uuid",
    "movement_type": "transfer_in",
    "quantity": 50,
    "unit_cost": 10.50,
    "total_cost": 525.00,
    "notes": "Transfer for restock",
    "movement_date": "2026-03-08T20:30:00.000Z"
  }
}
```

---

### 4.2 Ajustar Inventario

**Endpoint:** `POST /tenant/inventory/adjust`

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "warehouse_id": "uuid-string",
  "uom_id": "uuid-string",
  "quantity": -5,
  "unit_cost": 10.50,
  "notes": "Physical count adjustment - found damaged items",
  "location": "A-01-03",
  "lot_number": "LOT-2024-001",
  "serial_number": "SN-123456"
}
```

**Nota:** `quantity` puede ser positivo (incremento) o negativo (decremento)

**Campos opcionales:** `location`, `lot_number`, `serial_number`

**Response (201):**
```json
{
  "id": "movement-uuid",
  "product_id": "product-uuid",
  "warehouse_id": "warehouse-uuid",
  "uom_id": "uom-uuid",
  "movement_type": "adjustment",
  "quantity": -5,
  "unit_cost": 10.50,
  "total_cost": -52.50,
  "location": "A-01-03",
  "lot_number": "LOT-2024-001",
  "serial_number": "SN-123456",
  "notes": "Physical count adjustment - found damaged items",
  "movement_date": "2026-03-08T20:30:00.000Z",
  "created_by_user_id": "user-uuid",
  "product": {
    "name": "Producto A",
    "sku": "PROD-001"
  },
  "warehouse": {
    "name": "Almacén Principal"
  },
  "created_at": "2026-03-08T20:30:00.000Z"
}
```

---

## SECCIÓN 5: REPORTS (Reportes)

### 5.1 Reporte de Stock por Almacén

**Endpoint:** `GET /tenant/inventory/reports/stock-by-warehouse`

**Query Parameters:**
- `warehouse_id`: string (UUID, opcional)
- `product_id`: string (UUID, opcional)
- `low_stock`: boolean (opcional)

**Response (200):**
```json
{
  "data": [
    {
      "warehouse_id": "warehouse-uuid",
      "warehouse_name": "Almacén Principal",
      "warehouse_code": "ALM-001",
      "product_id": "product-uuid",
      "product_name": "Producto A",
      "product_sku": "PROD-001",
      "uom_name": "Pieza",
      "uom_abbreviation": "pz",
      "quantity_on_hand": 100,
      "quantity_reserved": 20,
      "quantity_available": 80,
      "reorder_point": 50,
      "unit_cost": 10.50,
      "total_value": 1050.00,
      "is_low_stock": false
    }
  ]
}
```

---

### 5.2 Reporte de Movimientos por Período

**Endpoint:** `GET /tenant/inventory/reports/movements-by-period`

**Query Parameters:**
- `start_date`: string (YYYY-MM-DD, requerido)
- `end_date`: string (YYYY-MM-DD, requerido)
- `warehouse_id`: string (UUID, opcional)
- `product_id`: string (UUID, opcional)
- `movement_type`: string (opcional)

**Response (200):**
```json
{
  "data": [
    {
      "movement_date": "2026-03-08",
      "movement_type": "purchase_receipt",
      "product_name": "Producto A",
      "product_sku": "PROD-001",
      "warehouse_name": "Almacén Principal",
      "quantity": 100,
      "unit_cost": 10.50,
      "total_cost": 1050.00,
      "reference_type": "purchase_order",
      "reference_id": "po-uuid"
    }
  ],
  "summary": {
    "total_movements": 150,
    "total_value": 15750.00,
    "by_type": {
      "purchase_receipt": 50,
      "sales_shipment": 30,
      "adjustment": 20,
      "transfer_in": 25,
      "transfer_out": 25
    }
  }
}
```

---

### 5.3 Reporte de Valorización de Inventario

**Endpoint:** `GET /tenant/inventory/reports/valuation`

**Query Parameters:**
- `warehouse_id`: string (UUID, opcional)
- `as_of_date`: string (YYYY-MM-DD, opcional) - Default: fecha actual

**Response (200):**
```json
{
  "data": [
    {
      "product_id": "product-uuid",
      "product_name": "Producto A",
      "product_sku": "PROD-001",
      "warehouse_name": "Almacén Principal",
      "quantity_on_hand": 100,
      "valuation_method": "FIFO",
      "unit_cost": 10.50,
      "total_value": 1050.00,
      "cost_layers": [
        {
          "quantity": 50,
          "unit_cost": 10.00,
          "date": "2026-03-01"
        },
        {
          "quantity": 50,
          "unit_cost": 11.00,
          "date": "2026-03-05"
        }
      ]
    }
  ],
  "summary": {
    "total_quantity": 1500,
    "total_value": 157500.00,
    "average_unit_cost": 105.00
  }
}
```

---

### 5.4 Reporte de Productos con Stock Bajo

**Endpoint:** `GET /tenant/inventory/reports/low-stock`

**Query Parameters:**
- `warehouse_id`: string (UUID, opcional)

**Response (200):**
```json
{
  "data": [
    {
      "product_id": "product-uuid",
      "product_name": "Producto A",
      "product_sku": "PROD-001",
      "warehouse_name": "Almacén Principal",
      "quantity_on_hand": 15,
      "quantity_available": 10,
      "reorder_point": 20,
      "reorder_quantity": 50,
      "unit_cost": 10.50,
      "suggested_order_value": 525.00
    }
  ],
  "summary": {
    "total_products_low_stock": 12,
    "total_suggested_order_value": 6300.00
  }
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
- **409**: Conflict - Conflicto (ej: stock insuficiente)
- **500**: Internal Server Error - Error del servidor

---

## Modelos de Datos

### InventoryItem
```typescript
{
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  uom_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point?: number;
  reorder_quantity?: number;
  location?: string;
  valuation_method: "FIFO" | "LIFO" | "Weighted_Average";
  unit_cost: number;
  total_value: number;
  cost_layers?: Array<{
    quantity: number;
    unit_cost: number;
    date: Date;
  }>;
  product?: Product;
  warehouse?: Warehouse;
  uom?: UoM;
  created_at: string;
  updated_at: string;
}
```

### InventoryMovement
```typescript
{
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  uom_id: string;
  movement_type: "purchase_receipt" | "sales_shipment" | "adjustment" | 
                 "transfer_in" | "transfer_out" | "initial_balance" | 
                 "return_to_vendor" | "return_from_customer";
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: string;
  location?: string;
  lot_number?: string;
  serial_number?: string;
  notes?: string;
  movement_date: string;
  created_by_user_id: string;
  product?: Product;
  warehouse?: Warehouse;
  uom?: UoM;
  created_by_user?: User;
  created_at: string;
}
```

### StockReservation
```typescript
{
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  uom_id: string;
  quantity_reserved: number;
  reference_type: string;
  reference_id: string;
  status: "active" | "fulfilled" | "cancelled" | "expired";
  reserved_at: string;
  expires_at?: string;
  fulfilled_at?: string;
  product?: Product;
  warehouse?: Warehouse;
  uom?: UoM;
  created_at: string;
  updated_at: string;
}
```

---

## Integración con Otros Módulos

### Integración Automática con Purchase Orders

Cuando una orden de compra cambia su estado a **"Recibida"**, el backend automáticamente:

1. Crea movimientos de inventario tipo `purchase_receipt` para cada línea
2. Actualiza `quantity_on_hand` en el almacén especificado
3. Registra el costo unitario de cada producto
4. Actualiza la valorización según el método configurado (FIFO, LIFO, Weighted Average)

**No se requiere ninguna acción adicional desde el frontend.**

---

### Integración Automática con Sales Orders

Cuando una orden de venta cambia su estado:

**Estado "confirmed":**
- Crea reservas de stock automáticamente para cada línea
- Reduce `quantity_available` (pero no `quantity_on_hand`)
- Aumenta `quantity_reserved`

**Estado "completed":**
- Cumple las reservas de stock
- Crea movimientos de inventario tipo `sales_shipment`
- Reduce `quantity_on_hand` y `quantity_reserved`
- Aumenta `quantity_available`

**Estado "cancelled":**
- Cancela las reservas de stock
- Libera el stock reservado

**No se requiere ninguna acción adicional desde el frontend.**

---

## Módulos y Servicios Complementarios

Para que el módulo de Inventory funcione completamente, necesitas integrar los siguientes módulos:

### 1. Módulo de Products (Productos) - Requerido

**Endpoint:** `GET /tenant/products`

**Propósito:** Obtener lista de productos para gestionar inventario.

**Response:**
```json
{
  "data": [
    {
      "id": "product-uuid",
      "name": "Producto A",
      "sku": "PROD-001",
      "description": "Descripción",
      "base_price": 1000.00,
      "cost": 800.00,
      "base_uom_id": "uom-uuid",
      "status": "active"
    }
  ]
}
```

---

### 2. Módulo de Warehouses (Almacenes) - Requerido

**Endpoint:** `GET /tenant/warehouses`

**Propósito:** Obtener lista de almacenes donde se almacena el inventario.

**Response:**
```json
{
  "data": [
    {
      "id": "warehouse-uuid",
      "name": "Almacén Principal",
      "code": "ALM-001",
      "address": "Calle Industrial 456",
      "type": "main",
      "status": "active"
    }
  ]
}
```

---

### 3. Módulo de UoM (Unidades de Medida) - Requerido

**Endpoint:** `GET /tenant/products/:productId/uoms`

**Propósito:** Obtener unidades de medida disponibles para un producto.

**Response:**
```json
[
  {
    "id": "uom-uuid",
    "name": "Pieza",
    "abbreviation": "pz",
    "conversion_factor": 1,
    "is_base": true
  }
]
```

---

### 4. Módulo de Purchase Orders - Integración Automática

**Endpoint:** `PUT /tenant/purchase-orders/:id/status`

**Integración:** Cuando el status cambia a "Recibida", se crean movimientos de inventario automáticamente.

---

### 5. Módulo de Sales Orders - Integración Automática

**Endpoint:** `PUT /tenant/sales-orders/:id`

**Integración:** 
- Status "confirmed" → Crea reservas de stock
- Status "completed" → Crea movimientos de inventario tipo `sales_shipment`
- Status "cancelled" → Cancela reservas

---

### 6. Módulo de Users (Usuarios) - Requerido

**Endpoint:** `GET /tenant/users/me`

**Propósito:** Obtener información del usuario actual (creador de movimientos).

---

### 7. Módulo de RBAC (Permisos) - Requerido

**Permisos Requeridos:**

| Permiso | Descripción | Acciones Permitidas |
|---------|-------------|---------------------|
| `inventory:Create` | Crear artículos y movimientos | POST /tenant/inventory/items, POST /tenant/inventory/movements, POST /tenant/inventory/reservations, POST /tenant/inventory/transfer, POST /tenant/inventory/adjust |
| `inventory:Read` | Ver inventario | GET /tenant/inventory/items, GET /tenant/inventory/movements, GET /tenant/inventory/reservations, GET /tenant/inventory/reports/* |
| `inventory:Update` | Actualizar artículos | PUT /tenant/inventory/items/:id, POST /tenant/inventory/reservations/:id/fulfill, POST /tenant/inventory/reservations/:id/cancel |
| `inventory:Delete` | Eliminar artículos | DELETE /tenant/inventory/items/:id |

---

## Flujo de Integración Completo

### Crear Artículo de Inventario:
1. **GET** `/tenant/products` → Seleccionar producto
2. **GET** `/tenant/warehouses` → Seleccionar almacén
3. **GET** `/tenant/products/:id/uoms` → Obtener UoMs del producto
4. **POST** `/tenant/inventory/items` → Crear artículo de inventario

### Registrar Movimiento Manual:
1. **GET** `/tenant/products?search=...` → Buscar producto
2. **GET** `/tenant/warehouses` → Seleccionar almacén
3. **POST** `/tenant/inventory/movements` → Crear movimiento

### Transferir entre Almacenes:
1. **GET** `/tenant/warehouses` → Seleccionar almacenes origen y destino
2. **GET** `/tenant/inventory/items?product_id=...&warehouse_id=...` → Verificar stock disponible
3. **POST** `/tenant/inventory/transfer` → Ejecutar transferencia

### Ajustar Inventario:
1. **GET** `/tenant/inventory/items/:id` → Obtener stock actual
2. **POST** `/tenant/inventory/adjust` → Registrar ajuste (positivo o negativo)

### Consultar Stock:
1. **GET** `/tenant/inventory/items?warehouse_id=...` → Ver stock por almacén
2. **GET** `/tenant/inventory/reports/stock-by-warehouse` → Reporte consolidado
3. **GET** `/tenant/inventory/reports/low-stock` → Productos con stock bajo

---

## Resumen de Dependencias

| Módulo | Requerido | Propósito |
|--------|-----------|-----------|
| Products | ✅ Sí | Productos a inventariar |
| Warehouses | ✅ Sí | Almacenes donde se guarda |
| UoM | ✅ Sí | Unidades de medida |
| Purchase Orders | ⚠️ Automático | Integración automática al recibir |
| Sales Orders | ⚠️ Automático | Integración automática al vender |
| Users | ✅ Sí | Creador de movimientos |
| RBAC | ✅ Sí | Control de acceso |

---

## Métodos de Valorización

### FIFO (First In, First Out)
- El primer stock que entra es el primero que sale
- Útil para productos perecederos
- Mantiene capas de costo por fecha de entrada

### LIFO (Last In, First Out)
- El último stock que entra es el primero que sale
- Útil para productos no perecederos
- Mantiene capas de costo por fecha de entrada

### Weighted Average (Promedio Ponderado)
- Calcula el costo promedio de todo el stock
- Más simple de calcular
- Recomendado para la mayoría de casos

**Nota:** El método de valorización se configura por artículo de inventario y afecta cómo se calcula el `unit_cost` y `total_value`.

---

## Tipos de Movimiento

| Tipo | Descripción | Cantidad | Uso |
|------|-------------|----------|-----|
| `purchase_receipt` | Recepción de compra | Positiva | Automático desde Purchase Orders |
| `sales_shipment` | Envío de venta | Negativa | Automático desde Sales Orders |
| `adjustment` | Ajuste de inventario | Positiva/Negativa | Manual (conteo físico, daños) |
| `transfer_in` | Transferencia entrante | Positiva | Automático desde Transfer |
| `transfer_out` | Transferencia saliente | Negativa | Automático desde Transfer |
| `initial_balance` | Saldo inicial | Positiva | Manual (setup inicial) |
| `return_to_vendor` | Devolución a proveedor | Negativa | Manual |
| `return_from_customer` | Devolución de cliente | Positiva | Manual |

---

## Validación de Permisos en el Frontend

### Ejemplo de Uso en Angular

```typescript
// auth.service.ts
export class AuthService {
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }
}

// inventory.component.ts
export class InventoryComponent {
  canCreate = this.authService.hasPermission('inventory:Create');
  canUpdate = this.authService.hasPermission('inventory:Update');
  canDelete = this.authService.hasPermission('inventory:Delete');

  constructor(private authService: AuthService) {}
}
```

```html
<!-- inventory.component.html -->
<button *ngIf="canCreate" (click)="createMovement()">
  Nuevo Movimiento
</button>

<button *ngIf="canUpdate" (click)="adjustStock()">
  Ajustar Stock
</button>

<button *ngIf="canDelete" (click)="deleteItem()">
  Eliminar
</button>
```

---

## Notas Importantes

1. **Stock Disponible vs Stock en Mano:**
   - `quantity_on_hand`: Stock físico total
   - `quantity_reserved`: Stock reservado para órdenes
   - `quantity_available`: Stock disponible = on_hand - reserved

2. **Movimientos Automáticos:**
   - Purchase Orders (status "Recibida") → `purchase_receipt`
   - Sales Orders (status "completed") → `sales_shipment`
   - Transfers → `transfer_out` + `transfer_in`

3. **Reservas de Stock:**
   - Se crean automáticamente desde Sales Orders (status "confirmed")
   - Se cumplen automáticamente cuando Sales Order status = "completed"
   - Se cancelan automáticamente cuando Sales Order status = "cancelled"

4. **Valorización:**
   - El `unit_cost` se actualiza automáticamente según el método configurado
   - El `total_value` = `quantity_on_hand` × `unit_cost`
   - Los `cost_layers` solo se usan en FIFO y LIFO

5. **Permisos por Tenant:**
   - Todos los endpoints validan automáticamente que el usuario pertenece al tenant
   - Los permisos se validan en cada request
   - Error 403 si no tiene permisos suficientes
