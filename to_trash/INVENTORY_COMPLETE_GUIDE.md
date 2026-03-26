# Inventory Management - Guía Completa para Frontend

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Integraciones Automáticas](#integraciones-automáticas)
4. [Endpoints - Inventory Items](#endpoints---inventory-items)
5. [Endpoints - Inventory Movements](#endpoints---inventory-movements)
6. [Endpoints - Stock Reservations](#endpoints---stock-reservations)
7. [Endpoints - Transfers & Adjustments](#endpoints---transfers--adjustments)
8. [Endpoints - Reports](#endpoints---reports)
9. [Modelos de Datos](#modelos-de-datos)
10. [Permisos RBAC](#permisos-rbac)
11. [Flujos de Integración](#flujos-de-integración)
12. [Métodos de Valorización](#métodos-de-valorización)
13. [Tipos de Movimiento](#tipos-de-movimiento)
14. [Troubleshooting](#troubleshooting)

---

## Introducción

El módulo de Inventory Management gestiona el stock de productos en almacenes, incluyendo:

- **Artículos de Inventario**: Stock disponible por producto/almacén
- **Movimientos**: Entradas, salidas, ajustes, transferencias
- **Reservas**: Stock reservado para órdenes de venta
- **Reportes**: Stock por almacén, movimientos, valorización, stock bajo
- **Integraciones Automáticas**: Con Purchase Orders y Sales Orders

### Base URL
```
/tenant/inventory
```


---

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token:

```
Authorization: Bearer {jwt_token}
```

El token incluye automáticamente:
- `tenantId`: ID del tenant (multi-tenancy)
- `userId`: ID del usuario autenticado

**No es necesario enviar estos campos en el body**, el backend los extrae del token.

---

## Integraciones Automáticas

### 🔄 Purchase Orders → Inventory

**Cuando una Purchase Order cambia a estado "Recibida":**

El backend automáticamente:
1. Crea `InventoryMovement` tipo `purchase_receipt` para cada línea
2. Incrementa `quantity_on_hand` en el almacén
3. Incrementa `quantity_available`
4. Actualiza la valorización según el método configurado (FIFO, LIFO, Weighted Average)

**✅ No requiere acción del frontend** - Es completamente automático.

**Campos de referencia:**
- `reference_type`: `'purchase_order'`
- `reference_id`: ID de la orden de compra


### 🔄 Sales Orders → Inventory

**Cuando una Sales Order cambia de estado:**

#### Estado: `draft` → `confirmed`
- Crea automáticamente `StockReservation` para cada línea
- Reduce `quantity_available` (pero NO `quantity_on_hand`)
- Incrementa `quantity_reserved`
- ⚠️ Si no hay stock suficiente, la operación falla y la orden NO se confirma

#### Estado: `confirmed` → `completed`
- Cumple las reservas existentes
- Crea `InventoryMovement` tipo `sales_shipment`
- Reduce `quantity_on_hand`
- Reduce `quantity_reserved`
- `quantity_available` se mantiene igual (ya estaba reducido)

#### Estado: `confirmed` → `cancelled`
- Cancela las reservas existentes
- Reduce `quantity_reserved`
- Incrementa `quantity_available`
- NO crea movimientos de inventario

**✅ No requiere acción del frontend** - Es completamente automático.

**Campos de referencia:**
- `reference_type`: `'sales_order'`
- `reference_id`: ID de la orden de venta


---

## Endpoints - Inventory Items

### 1. Crear Artículo de Inventario

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

**Métodos de valorización:** `FIFO`, `LIFO`, `Weighted_Average` (default)

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


### 2. Listar Artículos de Inventario

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
      "quantity_on_hand": 15,
      "quantity_reserved": 5,
      "quantity_available": 10,
      "reorder_point": 20,
      "product": {
        "name": "Producto A",
        "sku": "PROD-001"
      },
      "warehouse": {
        "name": "Almacén Principal"
      },
      "uom": {
        "name": "Pieza",
        "abbreviation": "pz"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 3. Obtener Artículo por ID

**Endpoint:** `GET /tenant/inventory/items/:id`

**Response (200):** Igual estructura que en crear, incluye `cost_layers` si usa FIFO/LIFO.

### 4. Actualizar Artículo

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

### 5. Eliminar Artículo

**Endpoint:** `DELETE /tenant/inventory/items/:id`

**Response (200):**
```json
{
  "message": "Inventory item deleted successfully"
}
```


---

## Endpoints - Inventory Movements

### 1. Crear Movimiento de Inventario

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

**Tipos de movimiento:**
- `purchase_receipt` - Recepción de compra (automático)
- `sales_shipment` - Envío de venta (automático)
- `adjustment` - Ajuste de inventario (manual)
- `transfer_in` - Transferencia entrante (automático)
- `transfer_out` - Transferencia saliente (automático)
- `initial_balance` - Saldo inicial (manual)
- `return_to_vendor` - Devolución a proveedor (manual)
- `return_from_customer` - Devolución de cliente (manual)

**Campos opcionales:** `reference_type`, `reference_id`, `location`, `lot_number`, `serial_number`, `notes`, `movement_date`

**Response (201):**
```json
{
  "id": "movement-uuid",
  "movement_type": "adjustment",
  "quantity": 50,
  "unit_cost": 10.50,
  "total_cost": 525.00,
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


### 2. Listar Movimientos de Inventario

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
      }
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20,
  "totalPages": 25
}
```

### 3. Obtener Movimiento por ID

**Endpoint:** `GET /tenant/inventory/movements/:id`

**Response (200):** Incluye todos los detalles del movimiento, producto, almacén, UoM, y usuario creador.


---

## Endpoints - Stock Reservations

### 1. Crear Reserva de Stock

**Endpoint:** `POST /tenant/inventory/reservations`

**⚠️ Nota:** Normalmente las reservas se crean automáticamente desde Sales Orders. Este endpoint es para casos especiales.

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
  }
}
```

### 2. Listar Reservas de Stock

**Endpoint:** `GET /tenant/inventory/reservations`

**Query Parameters:**
- `page`, `limit`
- `product_id`, `warehouse_id`
- `status`: "active" | "fulfilled" | "cancelled" | "expired"
- `reference_type`, `reference_id`

**Response (200):** Lista paginada de reservas.

### 3. Cumplir Reserva

**Endpoint:** `POST /tenant/inventory/reservations/:id/fulfill`

Marca la reserva como cumplida y libera el stock reservado.

### 4. Cancelar Reserva

**Endpoint:** `POST /tenant/inventory/reservations/:id/cancel`

Cancela la reserva y libera el stock reservado.


---

## Endpoints - Transfers & Adjustments

### 1. Transferir Inventario entre Almacenes

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

**Response (201):**
```json
{
  "transfer_out": {
    "id": "movement-out-uuid",
    "movement_type": "transfer_out",
    "quantity": -50,
    "warehouse_id": "source-warehouse-uuid"
  },
  "transfer_in": {
    "id": "movement-in-uuid",
    "movement_type": "transfer_in",
    "quantity": 50,
    "warehouse_id": "destination-warehouse-uuid"
  }
}
```

### 2. Ajustar Inventario

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

**⚠️ Nota:** `quantity` puede ser positivo (incremento) o negativo (decremento)

**Campos opcionales:** `location`, `lot_number`, `serial_number`

**Response (201):** Movimiento de tipo `adjustment` creado.


---

## Endpoints - Reports

### 1. Reporte de Stock por Almacén

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
      "warehouse_name": "Almacén Principal",
      "product_name": "Producto A",
      "product_sku": "PROD-001",
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

### 2. Reporte de Movimientos por Período

**Endpoint:** `GET /tenant/inventory/reports/movements-by-period`

**Query Parameters:**
- `start_date`: string (YYYY-MM-DD, requerido)
- `end_date`: string (YYYY-MM-DD, requerido)
- `warehouse_id`, `product_id`, `movement_type`: opcionales

**Response (200):**
```json
{
  "data": [
    {
      "movement_date": "2026-03-08",
      "movement_type": "purchase_receipt",
      "product_name": "Producto A",
      "warehouse_name": "Almacén Principal",
      "quantity": 100,
      "total_cost": 1050.00
    }
  ],
  "summary": {
    "total_movements": 150,
    "total_value": 15750.00,
    "by_type": {
      "purchase_receipt": 50,
      "sales_shipment": 30,
      "adjustment": 20
    }
  }
}
```


### 3. Reporte de Valorización de Inventario

**Endpoint:** `GET /tenant/inventory/reports/valuation`

**Query Parameters:**
- `warehouse_id`: string (UUID, opcional)
- `as_of_date`: string (YYYY-MM-DD, opcional) - Default: fecha actual

**Response (200):**
```json
{
  "data": [
    {
      "product_name": "Producto A",
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

### 4. Reporte de Productos con Stock Bajo

**Endpoint:** `GET /tenant/inventory/reports/low-stock`

**Query Parameters:**
- `warehouse_id`: string (UUID, opcional)

**Response (200):**
```json
{
  "data": [
    {
      "product_name": "Producto A",
      "warehouse_name": "Almacén Principal",
      "quantity_on_hand": 15,
      "quantity_available": 10,
      "reorder_point": 20,
      "reorder_quantity": 50,
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

## Modelos de Datos

### InventoryItem
```typescript
{
  id: string;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  uom_id: string;
  quantity_on_hand: number;        // Stock físico total
  quantity_reserved: number;       // Stock reservado para órdenes
  quantity_available: number;      // Stock disponible = on_hand - reserved
  reorder_point?: number;          // Punto de reorden
  reorder_quantity?: number;       // Cantidad a reordenar
  location?: string;               // Ubicación en almacén (ej: "A-01-03")
  valuation_method: "FIFO" | "LIFO" | "Weighted_Average";
  unit_cost: number;               // Costo unitario actual
  total_value: number;             // Valor total = quantity_on_hand × unit_cost
  cost_layers?: Array<{            // Solo para FIFO/LIFO
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
  quantity: number;                // Positivo = entrada, Negativo = salida
  unit_cost: number;
  total_cost: number;
  reference_type?: string;         // Ej: "purchase_order", "sales_order"
  reference_id?: string;           // ID de la orden relacionada
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
  reference_type: string;          // Ej: "sales_order"
  reference_id: string;            // ID de la orden de venta
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

## Permisos RBAC

Los usuarios necesitan los siguientes permisos para acceder a los endpoints:

| Permiso | Descripción | Endpoints |
|---------|-------------|-----------|
| `inventory:Create` | Crear artículos y movimientos | POST /items, /movements, /reservations, /transfer, /adjust |
| `inventory:Read` | Ver inventario | GET /items, /movements, /reservations, /reports/* |
| `inventory:Update` | Actualizar artículos | PUT /items/:id, POST /reservations/:id/fulfill, /cancel |
| `inventory:Delete` | Eliminar artículos | DELETE /items/:id |

### Ejemplo de Validación en Angular

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
}
```

```html
<!-- inventory.component.html -->
<button *ngIf="canCreate" (click)="createMovement()">
  Nuevo Movimiento
</button>
```


---

## Flujos de Integración

### Flujo 1: Crear Artículo de Inventario

```typescript
// 1. Obtener productos
const products = await http.get('/tenant/products');

// 2. Obtener almacenes
const warehouses = await http.get('/tenant/warehouses');

// 3. Obtener UoMs del producto seleccionado
const uoms = await http.get(`/tenant/products/${productId}/uoms`);

// 4. Crear artículo de inventario
const inventoryItem = await http.post('/tenant/inventory/items', {
  product_id: selectedProduct.id,
  warehouse_id: selectedWarehouse.id,
  uom_id: selectedUom.id,
  quantity_on_hand: 100,
  reorder_point: 20,
  reorder_quantity: 50,
  location: "A-01-03",
  valuation_method: "Weighted_Average",
  unit_cost: 10.50
});
```

### Flujo 2: Registrar Movimiento Manual

```typescript
// 1. Buscar producto
const products = await http.get('/tenant/products?search=...');

// 2. Seleccionar almacén
const warehouses = await http.get('/tenant/warehouses');

// 3. Crear movimiento
const movement = await http.post('/tenant/inventory/movements', {
  product_id: selectedProduct.id,
  warehouse_id: selectedWarehouse.id,
  uom_id: selectedUom.id,
  movement_type: "adjustment",
  quantity: 50,
  unit_cost: 10.50,
  notes: "Physical count adjustment"
});
```

### Flujo 3: Transferir entre Almacenes

```typescript
// 1. Obtener almacenes
const warehouses = await http.get('/tenant/warehouses');

// 2. Verificar stock disponible
const inventory = await http.get(
  `/tenant/inventory/items?product_id=${productId}&warehouse_id=${sourceWarehouseId}`
);

// 3. Ejecutar transferencia
const transfer = await http.post('/tenant/inventory/transfer', {
  product_id: productId,
  source_warehouse_id: sourceWarehouseId,
  destination_warehouse_id: destinationWarehouseId,
  uom_id: uomId,
  quantity: 50,
  unit_cost: 10.50,
  notes: "Transfer for restock"
});
```


### Flujo 4: Ajustar Inventario

```typescript
// 1. Obtener stock actual
const item = await http.get(`/tenant/inventory/items/${itemId}`);

// 2. Registrar ajuste (positivo o negativo)
const adjustment = await http.post('/tenant/inventory/adjust', {
  product_id: item.product_id,
  warehouse_id: item.warehouse_id,
  uom_id: item.uom_id,
  quantity: -5,  // Negativo = reducción
  unit_cost: item.unit_cost,
  notes: "Found damaged items during physical count"
});
```

### Flujo 5: Consultar Stock

```typescript
// Ver stock por almacén
const items = await http.get('/tenant/inventory/items?warehouse_id=...');

// Reporte consolidado
const report = await http.get('/tenant/inventory/reports/stock-by-warehouse');

// Productos con stock bajo
const lowStock = await http.get('/tenant/inventory/reports/low-stock');
```

### Flujo 6: Integración con Purchase Orders

```typescript
// El frontend solo necesita cambiar el estado de la orden
const po = await http.put(`/tenant/purchase-orders/${poId}/status`, {
  status: 'Recibida'
});

// ✅ El backend automáticamente:
// - Crea movimientos de inventario tipo "purchase_receipt"
// - Incrementa quantity_on_hand
// - Actualiza valorización

// Consultar movimientos creados (opcional)
const movements = await http.get(
  `/tenant/inventory/movements?reference_type=purchase_order&reference_id=${poId}`
);
```

### Flujo 7: Integración con Sales Orders

```typescript
// Confirmar orden de venta
const so = await http.put(`/tenant/sales-orders/${soId}`, {
  status: 'confirmed'
});

// ✅ El backend automáticamente:
// - Crea reservas de stock
// - Reduce quantity_available
// - Incrementa quantity_reserved

// Completar orden de venta
const completedSo = await http.put(`/tenant/sales-orders/${soId}`, {
  status: 'completed'
});

// ✅ El backend automáticamente:
// - Cumple las reservas
// - Crea movimientos tipo "sales_shipment"
// - Reduce quantity_on_hand y quantity_reserved
```


---

## Métodos de Valorización

### FIFO (First In, First Out)

**Concepto:** El primer stock que entra es el primero que sale.

**Uso recomendado:** Productos perecederos, alimentos, medicamentos.

**Cómo funciona:**
- Mantiene capas de costo por fecha de entrada
- Al vender, usa el costo de las capas más antiguas primero
- Refleja mejor el flujo físico de productos perecederos

**Ejemplo:**
```
Entrada 1: 50 unidades @ $10.00 (01-Mar)
Entrada 2: 50 unidades @ $11.00 (05-Mar)
Venta: 60 unidades

Costo de venta:
- 50 unidades @ $10.00 = $500
- 10 unidades @ $11.00 = $110
Total: $610

Stock restante: 40 unidades @ $11.00
```

### LIFO (Last In, First Out)

**Concepto:** El último stock que entra es el primero que sale.

**Uso recomendado:** Productos no perecederos, materiales de construcción.

**Cómo funciona:**
- Mantiene capas de costo por fecha de entrada
- Al vender, usa el costo de las capas más recientes primero
- Útil en períodos de inflación

**Ejemplo:**
```
Entrada 1: 50 unidades @ $10.00 (01-Mar)
Entrada 2: 50 unidades @ $11.00 (05-Mar)
Venta: 60 unidades

Costo de venta:
- 50 unidades @ $11.00 = $550
- 10 unidades @ $10.00 = $100
Total: $650

Stock restante: 40 unidades @ $10.00
```

### Weighted Average (Promedio Ponderado)

**Concepto:** Calcula el costo promedio de todo el stock.

**Uso recomendado:** La mayoría de casos, productos genéricos.

**Cómo funciona:**
- Más simple de calcular
- No mantiene capas de costo
- Costo unitario = Valor total / Cantidad total

**Ejemplo:**
```
Entrada 1: 50 unidades @ $10.00 = $500
Entrada 2: 50 unidades @ $11.00 = $550
Total: 100 unidades, $1,050

Costo promedio: $1,050 / 100 = $10.50

Venta: 60 unidades @ $10.50 = $630
Stock restante: 40 unidades @ $10.50 = $420
```


---

## Tipos de Movimiento

| Tipo | Descripción | Cantidad | Uso | Automático |
|------|-------------|----------|-----|------------|
| `purchase_receipt` | Recepción de compra | Positiva | Entrada desde Purchase Orders | ✅ Sí |
| `sales_shipment` | Envío de venta | Negativa | Salida desde Sales Orders | ✅ Sí |
| `adjustment` | Ajuste de inventario | +/- | Conteo físico, daños, mermas | ❌ Manual |
| `transfer_in` | Transferencia entrante | Positiva | Entrada desde otro almacén | ✅ Sí |
| `transfer_out` | Transferencia saliente | Negativa | Salida hacia otro almacén | ✅ Sí |
| `initial_balance` | Saldo inicial | Positiva | Setup inicial del sistema | ❌ Manual |
| `return_to_vendor` | Devolución a proveedor | Negativa | Devolución de compra | ❌ Manual |
| `return_from_customer` | Devolución de cliente | Positiva | Devolución de venta | ❌ Manual |

### Movimientos Automáticos

**Purchase Orders (status "Recibida"):**
```
Purchase Order → purchase_receipt movements
```

**Sales Orders (status "completed"):**
```
Sales Order → sales_shipment movements
```

**Transfers:**
```
Transfer request → transfer_out + transfer_in movements
```

### Movimientos Manuales

Estos movimientos deben ser creados explícitamente desde el frontend:

- `adjustment`: Para ajustes de inventario (conteo físico, daños)
- `initial_balance`: Para cargar saldos iniciales
- `return_to_vendor`: Para devoluciones a proveedores
- `return_from_customer`: Para devoluciones de clientes


---

## Troubleshooting

### Problema: "Insufficient stock" al confirmar Sales Order

**Causa:** No hay suficiente `quantity_available` en el inventario.

**Solución:**
1. Verificar el inventario actual:
   ```
   GET /tenant/inventory/items?product_id=xxx&warehouse_id=yyy
   ```
2. Revisar `quantity_available` (no `quantity_on_hand`)
3. Si hay stock reservado, verificar reservas activas:
   ```
   GET /tenant/inventory/reservations?product_id=xxx&status=active
   ```
4. Crear movimiento de entrada si es necesario:
   ```
   POST /tenant/inventory/adjust
   ```

### Problema: No se crean movimientos al recibir Purchase Order

**Posibles causas:**
- El `warehouse_id` no existe
- El `product_id` no existe
- El `uom_id` no está asignado al producto
- No hay `InventoryItem` creado para ese producto/almacén

**Solución:**
1. Verificar logs del servidor para ver el error específico
2. Verificar que todos los IDs sean válidos
3. Verificar que el producto tenga el UoM asignado:
   ```
   GET /tenant/products/:productId/uoms
   ```
4. Crear `InventoryItem` si no existe:
   ```
   POST /tenant/inventory/items
   ```

### Problema: Stock negativo después de ajuste

**Causa:** Se intentó reducir más stock del disponible.

**Solución:**
1. Verificar `quantity_on_hand` actual antes de ajustar
2. Validar en el frontend que el ajuste negativo no exceda el stock disponible
3. Si es necesario, hacer múltiples ajustes o transferencias


### Problema: Dependencia circular al iniciar la aplicación

**Causa:** Falta `forwardRef` en algún módulo.

**Solución:**
Asegúrate de usar `forwardRef(() => InventoryModule)` en los imports de `SalesOrdersModule` y `PurchaseOrdersModule`.

```typescript
// En SalesOrdersModule y PurchaseOrdersModule
imports: [
  // ...
  forwardRef(() => InventoryModule),
]
```

### Problema: Reservas no se cancelan al cancelar Sales Order

**Causa:** Error en el backend o falta de integración.

**Solución:**
1. Verificar logs del servidor
2. Consultar reservas manualmente:
   ```
   GET /tenant/inventory/reservations?reference_id=sales-order-id
   ```
3. Cancelar manualmente si es necesario:
   ```
   POST /tenant/inventory/reservations/:id/cancel
   ```

### Problema: Valorización incorrecta con FIFO/LIFO

**Causa:** Capas de costo no se están actualizando correctamente.

**Solución:**
1. Verificar que el método de valorización esté configurado correctamente
2. Consultar las capas de costo:
   ```
   GET /tenant/inventory/items/:id
   ```
3. Revisar el campo `cost_layers` en la respuesta
4. Si es necesario, cambiar a `Weighted_Average` temporalmente

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

## Módulos Complementarios Requeridos

Para que el módulo de Inventory funcione completamente, necesitas tener estos módulos disponibles:

### 1. Products (Productos) - ✅ Requerido

**Endpoint:** `GET /tenant/products`

**Propósito:** Obtener lista de productos para gestionar inventario.

### 2. Warehouses (Almacenes) - ✅ Requerido

**Endpoint:** `GET /tenant/warehouses`

**Propósito:** Obtener lista de almacenes donde se almacena el inventario.

### 3. UoM (Unidades de Medida) - ✅ Requerido

**Endpoint:** `GET /tenant/products/:productId/uoms`

**Propósito:** Obtener unidades de medida disponibles para un producto.

### 4. Purchase Orders - ⚠️ Integración Automática

**Endpoint:** `PUT /tenant/purchase-orders/:id/status`

**Integración:** Cuando el status cambia a "Recibida", se crean movimientos automáticamente.

### 5. Sales Orders - ⚠️ Integración Automática

**Endpoint:** `PUT /tenant/sales-orders/:id`

**Integración:** 
- Status "confirmed" → Crea reservas de stock
- Status "completed" → Crea movimientos de inventario
- Status "cancelled" → Cancela reservas

### 6. Users (Usuarios) - ✅ Requerido

**Endpoint:** `GET /tenant/users/me`

**Propósito:** Obtener información del usuario actual (creador de movimientos).

### 7. RBAC (Permisos) - ✅ Requerido

**Propósito:** Control de acceso basado en roles.

---

## Notas Importantes

### Stock Disponible vs Stock en Mano

- **`quantity_on_hand`**: Stock físico total en el almacén
- **`quantity_reserved`**: Stock reservado para órdenes de venta
- **`quantity_available`**: Stock disponible para vender = `on_hand - reserved`

**Ejemplo:**
```
quantity_on_hand: 100
quantity_reserved: 20
quantity_available: 80  ← Este es el que se usa para validar ventas
```


### Movimientos Automáticos

Los siguientes movimientos se crean automáticamente sin intervención del frontend:

1. **Purchase Orders (status "Recibida")** → `purchase_receipt`
2. **Sales Orders (status "completed")** → `sales_shipment`
3. **Transfers** → `transfer_out` + `transfer_in`

### Reservas de Stock

Las reservas se gestionan automáticamente:

1. **Se crean** cuando Sales Order status = "confirmed"
2. **Se cumplen** cuando Sales Order status = "completed"
3. **Se cancelan** cuando Sales Order status = "cancelled"

### Valorización

- El `unit_cost` se actualiza automáticamente según el método configurado
- El `total_value` = `quantity_on_hand` × `unit_cost`
- Los `cost_layers` solo se usan en FIFO y LIFO

### Permisos por Tenant

- Todos los endpoints validan automáticamente que el usuario pertenece al tenant
- Los permisos se validan en cada request
- Error 403 si no tiene permisos suficientes

---

## Resumen de Endpoints por Funcionalidad

### Gestión de Artículos
- `POST /tenant/inventory/items` - Crear artículo
- `GET /tenant/inventory/items` - Listar artículos
- `GET /tenant/inventory/items/:id` - Obtener artículo
- `PUT /tenant/inventory/items/:id` - Actualizar artículo
- `DELETE /tenant/inventory/items/:id` - Eliminar artículo

### Movimientos
- `POST /tenant/inventory/movements` - Crear movimiento manual
- `GET /tenant/inventory/movements` - Listar movimientos
- `GET /tenant/inventory/movements/:id` - Obtener movimiento

### Reservas
- `POST /tenant/inventory/reservations` - Crear reserva (raro, normalmente automático)
- `GET /tenant/inventory/reservations` - Listar reservas
- `GET /tenant/inventory/reservations/:id` - Obtener reserva
- `POST /tenant/inventory/reservations/:id/fulfill` - Cumplir reserva
- `POST /tenant/inventory/reservations/:id/cancel` - Cancelar reserva

### Operaciones
- `POST /tenant/inventory/transfer` - Transferir entre almacenes
- `POST /tenant/inventory/adjust` - Ajustar inventario

### Reportes
- `GET /tenant/inventory/reports/stock-by-warehouse` - Stock por almacén
- `GET /tenant/inventory/reports/movements-by-period` - Movimientos por período
- `GET /tenant/inventory/reports/valuation` - Valorización de inventario
- `GET /tenant/inventory/reports/low-stock` - Productos con stock bajo


---

## Quick Start - Implementación en Angular

### 1. Crear Servicio de Inventario

```typescript
// inventory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = '/tenant/inventory';

  constructor(private http: HttpClient) {}

  // Artículos
  getItems(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/items`, { params: httpParams });
  }

  getItem(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/items/${id}`);
  }

  createItem(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/items`, data);
  }

  updateItem(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${id}`, data);
  }

  deleteItem(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${id}`);
  }

  // Movimientos
  getMovements(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/movements`, { params: httpParams });
  }

  // Operaciones
  transfer(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transfer`, data);
  }

  adjust(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/adjust`, data);
  }

  // Reportes
  getStockByWarehouse(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/reports/stock-by-warehouse`, { params: httpParams });
  }

  getLowStock(warehouseId?: string): Observable<any> {
    const params = warehouseId ? { warehouse_id: warehouseId } : {};
    return this.http.get(`${this.baseUrl}/reports/low-stock`, { params });
  }
}
```


### 2. Componente de Lista de Inventario

```typescript
// inventory-list.component.ts
import { Component, OnInit } from '@angular/core';
import { InventoryService } from './inventory.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
  items: any[] = [];
  loading = false;
  page = 1;
  limit = 20;
  total = 0;

  // Permisos
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  // Filtros
  selectedWarehouse: string | null = null;
  lowStockOnly = false;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkPermissions();
    this.loadItems();
  }

  checkPermissions() {
    this.canCreate = this.authService.hasPermission('inventory:Create');
    this.canUpdate = this.authService.hasPermission('inventory:Update');
    this.canDelete = this.authService.hasPermission('inventory:Delete');
  }

  loadItems() {
    this.loading = true;
    const params = {
      page: this.page,
      limit: this.limit,
      warehouse_id: this.selectedWarehouse,
      low_stock: this.lowStockOnly
    };

    this.inventoryService.getItems(params).subscribe({
      next: (response) => {
        this.items = response.data;
        this.total = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.loading = false;
      }
    });
  }

  onWarehouseChange(warehouseId: string) {
    this.selectedWarehouse = warehouseId;
    this.page = 1;
    this.loadItems();
  }

  onLowStockToggle() {
    this.lowStockOnly = !this.lowStockOnly;
    this.page = 1;
    this.loadItems();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadItems();
  }

  deleteItem(id: string) {
    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      this.inventoryService.deleteItem(id).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
        }
      });
    }
  }
}
```


### 3. Template HTML

```html
<!-- inventory-list.component.html -->
<div class="inventory-container">
  <div class="header">
    <h2>Inventario</h2>
    <button *ngIf="canCreate" (click)="createItem()" class="btn-primary">
      Nuevo Artículo
    </button>
  </div>

  <!-- Filtros -->
  <div class="filters">
    <select [(ngModel)]="selectedWarehouse" (change)="onWarehouseChange($event.target.value)">
      <option [value]="null">Todos los almacenes</option>
      <option *ngFor="let warehouse of warehouses" [value]="warehouse.id">
        {{ warehouse.name }}
      </option>
    </select>

    <label>
      <input type="checkbox" [(ngModel)]="lowStockOnly" (change)="onLowStockToggle()">
      Solo stock bajo
    </label>
  </div>

  <!-- Tabla -->
  <table class="inventory-table">
    <thead>
      <tr>
        <th>Producto</th>
        <th>SKU</th>
        <th>Almacén</th>
        <th>En Mano</th>
        <th>Reservado</th>
        <th>Disponible</th>
        <th>Ubicación</th>
        <th>Costo Unit.</th>
        <th>Valor Total</th>
        <th *ngIf="canUpdate || canDelete">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of items" [class.low-stock]="item.quantity_available < item.reorder_point">
        <td>{{ item.product?.name }}</td>
        <td>{{ item.product?.sku }}</td>
        <td>{{ item.warehouse?.name }}</td>
        <td>{{ item.quantity_on_hand }}</td>
        <td>{{ item.quantity_reserved }}</td>
        <td>{{ item.quantity_available }}</td>
        <td>{{ item.location || '-' }}</td>
        <td>{{ item.unit_cost | currency }}</td>
        <td>{{ item.total_value | currency }}</td>
        <td *ngIf="canUpdate || canDelete">
          <button *ngIf="canUpdate" (click)="editItem(item)" class="btn-edit">
            Editar
          </button>
          <button *ngIf="canDelete" (click)="deleteItem(item.id)" class="btn-delete">
            Eliminar
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Paginación -->
  <div class="pagination">
    <button [disabled]="page === 1" (click)="onPageChange(page - 1)">
      Anterior
    </button>
    <span>Página {{ page }} de {{ Math.ceil(total / limit) }}</span>
    <button [disabled]="page * limit >= total" (click)="onPageChange(page + 1)">
      Siguiente
    </button>
  </div>
</div>
```


### 4. Componente de Ajuste de Inventario

```typescript
// inventory-adjust.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { ProductService } from '../products/product.service';
import { WarehouseService } from '../warehouses/warehouse.service';

@Component({
  selector: 'app-inventory-adjust',
  templateUrl: './inventory-adjust.component.html'
})
export class InventoryAdjustComponent implements OnInit {
  adjustForm: FormGroup;
  products: any[] = [];
  warehouses: any[] = [];
  uoms: any[] = [];
  currentStock: any = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private warehouseService: WarehouseService
  ) {
    this.adjustForm = this.fb.group({
      product_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      uom_id: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(-9999), Validators.max(9999)]],
      unit_cost: [0, [Validators.required, Validators.min(0)]],
      notes: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadProducts();
    this.loadWarehouses();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
      }
    });
  }

  loadWarehouses() {
    this.warehouseService.getWarehouses().subscribe({
      next: (response) => {
        this.warehouses = response.data;
      }
    });
  }

  onProductChange(productId: string) {
    // Cargar UoMs del producto
    this.productService.getProductUoms(productId).subscribe({
      next: (uoms) => {
        this.uoms = uoms;
      }
    });

    // Cargar stock actual si hay almacén seleccionado
    const warehouseId = this.adjustForm.get('warehouse_id')?.value;
    if (warehouseId) {
      this.loadCurrentStock(productId, warehouseId);
    }
  }

  onWarehouseChange(warehouseId: string) {
    const productId = this.adjustForm.get('product_id')?.value;
    if (productId) {
      this.loadCurrentStock(productId, warehouseId);
    }
  }

  loadCurrentStock(productId: string, warehouseId: string) {
    this.inventoryService.getItems({ product_id: productId, warehouse_id: warehouseId }).subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          this.currentStock = response.data[0];
          this.adjustForm.patchValue({
            unit_cost: this.currentStock.unit_cost
          });
        } else {
          this.currentStock = null;
        }
      }
    });
  }

  onSubmit() {
    if (this.adjustForm.valid) {
      this.loading = true;
      this.inventoryService.adjust(this.adjustForm.value).subscribe({
        next: (response) => {
          alert('Ajuste registrado exitosamente');
          this.adjustForm.reset();
          this.currentStock = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error adjusting inventory:', error);
          alert('Error al registrar ajuste: ' + error.error.message);
          this.loading = false;
        }
      });
    }
  }
}
```


---

## Mejores Prácticas

### 1. Validación de Stock Antes de Confirmar Sales Orders

```typescript
// Antes de confirmar una orden de venta
async validateStockAvailability(salesOrder: any): Promise<boolean> {
  for (const line of salesOrder.line_items) {
    const inventory = await this.inventoryService.getItems({
      product_id: line.product_id,
      warehouse_id: salesOrder.warehouse_id
    }).toPromise();

    if (inventory.data.length === 0) {
      alert(`No hay inventario para el producto ${line.product.name}`);
      return false;
    }

    const item = inventory.data[0];
    if (item.quantity_available < line.quantity) {
      alert(`Stock insuficiente para ${line.product.name}. Disponible: ${item.quantity_available}, Requerido: ${line.quantity}`);
      return false;
    }
  }

  return true;
}
```

### 2. Mostrar Alertas de Stock Bajo

```typescript
// En el dashboard o página principal
loadLowStockAlerts() {
  this.inventoryService.getLowStock().subscribe({
    next: (response) => {
      if (response.data.length > 0) {
        this.showLowStockNotification(response.data);
      }
    }
  });
}

showLowStockNotification(items: any[]) {
  const message = `Hay ${items.length} productos con stock bajo`;
  // Mostrar notificación en la UI
}
```

### 3. Auditoría de Movimientos

```typescript
// Ver historial de movimientos de un producto
viewProductHistory(productId: string) {
  this.inventoryService.getMovements({
    product_id: productId,
    limit: 100
  }).subscribe({
    next: (response) => {
      this.movements = response.data;
      // Mostrar en modal o página separada
    }
  });
}
```

### 4. Reportes Periódicos

```typescript
// Generar reporte mensual
generateMonthlyReport() {
  const startDate = '2026-03-01';
  const endDate = '2026-03-31';

  this.inventoryService.getMovementsByPeriod({
    start_date: startDate,
    end_date: endDate
  }).subscribe({
    next: (response) => {
      this.downloadReport(response);
    }
  });
}
```


### 5. Manejo de Errores

```typescript
// Servicio con manejo de errores centralizado
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

handleInventoryError(operation: string) {
  return (error: any) => {
    console.error(`${operation} failed:`, error);

    let userMessage = 'Error en operación de inventario';

    if (error.status === 409) {
      userMessage = 'Stock insuficiente para completar la operación';
    } else if (error.status === 404) {
      userMessage = 'Artículo de inventario no encontrado';
    } else if (error.status === 403) {
      userMessage = 'No tienes permisos para realizar esta operación';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    alert(userMessage);
    return throwError(() => error);
  };
}

// Uso en el servicio
adjust(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/adjust`, data).pipe(
    catchError(this.handleInventoryError('Ajuste de inventario'))
  );
}
```

### 6. Caché de Datos Frecuentes

```typescript
// Cachear productos y almacenes para evitar múltiples requests
import { shareReplay } from 'rxjs/operators';

private productsCache$: Observable<any> | null = null;
private warehousesCache$: Observable<any> | null = null;

getProductsCached(): Observable<any> {
  if (!this.productsCache$) {
    this.productsCache$ = this.productService.getProducts().pipe(
      shareReplay(1)
    );
  }
  return this.productsCache$;
}

getWarehousesCached(): Observable<any> {
  if (!this.warehousesCache$) {
    this.warehousesCache$ = this.warehouseService.getWarehouses().pipe(
      shareReplay(1)
    );
  }
  return this.warehousesCache$;
}

// Limpiar caché cuando sea necesario
clearCache() {
  this.productsCache$ = null;
  this.warehousesCache$ = null;
}
```

---

## Conclusión

Este documento contiene toda la información necesaria para integrar el módulo de Inventory Management en tu interfaz gráfica:

✅ **Endpoints completos** con request/response examples
✅ **Integraciones automáticas** con Purchase Orders y Sales Orders
✅ **Modelos de datos** TypeScript
✅ **Permisos RBAC** requeridos
✅ **Flujos de integración** paso a paso
✅ **Métodos de valorización** explicados
✅ **Tipos de movimiento** documentados
✅ **Troubleshooting** para problemas comunes
✅ **Código de ejemplo** en Angular
✅ **Mejores prácticas** de implementación

Para cualquier duda adicional, consulta los logs del servidor o revisa la documentación de los módulos complementarios (Products, Warehouses, UoM).

