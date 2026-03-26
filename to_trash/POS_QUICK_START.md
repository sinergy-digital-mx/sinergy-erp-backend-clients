# POS System - Guía Rápida de Uso

## Resumen

El módulo POS está completamente implementado y listo para usar en dos pantallas separadas:

1. **Pantalla de Toma de Orden** (Mesero/Empleado)
2. **Pantalla de Cobro** (Cajero)

## Arquitectura de Pantallas

```
┌─────────────────────────────────────────────────────────────┐
│                  PANTALLA 1: TOMA DE ORDEN                   │
│                      (Mesero/Empleado)                       │
├─────────────────────────────────────────────────────────────┤
│  • Crear nueva orden                                         │
│  • Agregar productos a la orden                              │
│  • Modificar cantidades y descuentos                         │
│  • Asignar mesa (restaurantes)                               │
│  • Ver órdenes pendientes                                    │
│  • Cancelar órdenes                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   PANTALLA 2: COBRO                          │
│                        (Cajero)                              │
├─────────────────────────────────────────────────────────────┤
│  • Abrir turno de caja                                       │
│  • Ver órdenes listas para cobrar                            │
│  • Procesar pagos (efectivo, tarjeta, transferencia)        │
│  • Pagos divididos                                           │
│  • Calcular cambio automáticamente                           │
│  • Cerrar turno de caja                                      │
│  • Ver reporte de turno                                      │
└─────────────────────────────────────────────────────────────┘
```

## Flujo Completo de Uso

### 1. Inicio del Día - Cajero

**Endpoint:** `POST /tenant/pos/cash-shifts/open`

```json
{
  "warehouse_id": "uuid-del-almacen",
  "initial_cash": 1000.00,
  "notes": "Turno matutino"
}
```

**Respuesta:**
```json
{
  "id": "shift-uuid",
  "cashier_id": "user-uuid",
  "warehouse_id": "warehouse-uuid",
  "initial_cash": 1000.00,
  "status": "open",
  "opened_at": "2026-03-08T08:00:00Z"
}
```

### 2. Pantalla de Toma de Orden - Mesero

#### 2.1 Crear Nueva Orden

**Endpoint:** `POST /tenant/pos/orders`

```json
{
  "warehouse_id": "uuid-del-almacen",
  "table_number": "5",
  "zone": "Terraza",
  "notes": "Cliente VIP"
}
```

**Respuesta:**
```json
{
  "id": "order-uuid",
  "order_number": "POS-20260308-0001",
  "warehouse_id": "warehouse-uuid",
  "waiter_id": "user-uuid",
  "table_number": "5",
  "zone": "Terraza",
  "status": "pending",
  "subtotal": 0,
  "tax": 0,
  "discount": 0,
  "tip": 0,
  "total": 0,
  "created_at": "2026-03-08T10:30:00Z"
}
```

#### 2.2 Agregar Productos a la Orden

**Endpoint:** `POST /tenant/pos/orders/{order-id}/lines`

```json
{
  "product_id": "product-uuid",
  "uom_id": "uom-uuid",
  "quantity": 2,
  "discount_percentage": 0,
  "notes": "Sin cebolla"
}
```

**Respuesta:**
```json
{
  "id": "line-uuid",
  "pos_order_id": "order-uuid",
  "product_id": "product-uuid",
  "quantity": 2,
  "unit_price": 150.00,
  "subtotal": 300.00,
  "discount_amount": 0,
  "line_total": 300.00,
  "notes": "Sin cebolla",
  "status": "pending"
}
```

La orden se recalcula automáticamente:
```json
{
  "id": "order-uuid",
  "order_number": "POS-20260308-0001",
  "subtotal": 300.00,
  "total": 300.00,
  "status": "pending"
}
```

#### 2.3 Ver Órdenes Pendientes

**Endpoint:** `GET /tenant/pos/orders?status=pending&warehouse_id={warehouse-id}`

```json
{
  "data": [
    {
      "id": "order-uuid",
      "order_number": "POS-20260308-0001",
      "table_number": "5",
      "waiter": {
        "id": "user-uuid",
        "first_name": "Juan",
        "last_name": "Pérez"
      },
      "total": 300.00,
      "status": "pending",
      "created_at": "2026-03-08T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### 2.4 Modificar Línea de Orden

**Endpoint:** `PUT /tenant/pos/lines/{line-id}`

```json
{
  "quantity": 3,
  "discount_percentage": 10
}
```

#### 2.5 Eliminar Línea de Orden

**Endpoint:** `DELETE /tenant/pos/lines/{line-id}`

#### 2.6 Cancelar Orden

**Endpoint:** `POST /tenant/pos/orders/{order-id}/cancel`

```json
{
  "reason": "Cliente canceló el pedido"
}
```

### 3. Pantalla de Cobro - Cajero

#### 3.1 Ver Órdenes Listas para Cobrar

**Endpoint:** `GET /tenant/pos/orders?status=pending,ready&warehouse_id={warehouse-id}`

```json
{
  "data": [
    {
      "id": "order-uuid",
      "order_number": "POS-20260308-0001",
      "table_number": "5",
      "waiter": {
        "first_name": "Juan",
        "last_name": "Pérez"
      },
      "total": 300.00,
      "status": "ready",
      "lines": [
        {
          "product": {
            "name": "Hamburguesa",
            "sku": "BURG-001"
          },
          "quantity": 2,
          "line_total": 300.00
        }
      ]
    }
  ]
}
```

#### 3.2 Procesar Pago - Efectivo

**Endpoint:** `POST /tenant/pos/orders/{order-id}/payment`

```json
{
  "payment_method": "cash",
  "amount_paid": 300.00,
  "received_amount": 500.00,
  "tip": 20.00
}
```

**Nota:** El campo `amount_paid` acepta tanto números como strings (ej: `"300.00"` o `300.00`). El backend convierte automáticamente strings a números.

**Respuesta:**
```json
{
  "id": "payment-uuid",
  "pos_order_id": "order-uuid",
  "payment_method": "cash",
  "amount": 300.00,
  "received_amount": 500.00,
  "change_amount": 200.00,
  "cashier_id": "cashier-uuid",
  "cash_shift_id": "shift-uuid",
  "created_at": "2026-03-08T11:00:00Z"
}
```

**Efectos automáticos:**
- Orden marcada como `paid`
- Mesa liberada (si aplica)
- Movimientos de inventario creados automáticamente
- Propina agregada al total de la orden

#### 3.3 Procesar Pago - Tarjeta

**Endpoint:** `POST /tenant/pos/orders/{order-id}/payment`

```json
{
  "payment_method": "card",
  "amount_paid": 300.00,
  "reference": "AUTH123456",
  "tip": 30.00
}
```

#### 3.4 Procesar Pago Dividido

**Endpoint:** `POST /tenant/pos/orders/{order-id}/split-payment`

```json
{
  "payments": [
    {
      "payment_method": "cash",
      "amount_paid": 150.00,
      "received_amount": 200.00
    },
    {
      "payment_method": "card",
      "amount_paid": 150.00,
      "reference": "AUTH789012"
    }
  ]
}
```

**Validación automática:** La suma de amounts debe ser igual al total de la orden.

### 4. Cierre del Día - Cajero

#### 4.1 Cerrar Turno de Caja

**Endpoint:** `POST /tenant/pos/cash-shifts/{shift-id}/close`

```json
{
  "final_cash": 4850.00,
  "notes": "Todo correcto"
}
```

**Respuesta:**
```json
{
  "id": "shift-uuid",
  "cashier_id": "cashier-uuid",
  "initial_cash": 1000.00,
  "final_cash": 4850.00,
  "expected_cash": 4800.00,
  "difference": 50.00,
  "status": "closed",
  "opened_at": "2026-03-08T08:00:00Z",
  "closed_at": "2026-03-08T18:00:00Z"
}
```

#### 4.2 Ver Reporte de Turno

**Endpoint:** `GET /tenant/pos/cash-shifts/{shift-id}/report`

```json
{
  "shift_id": "shift-uuid",
  "cashier_name": "María González",
  "opened_at": "2026-03-08T08:00:00Z",
  "closed_at": "2026-03-08T18:00:00Z",
  "initial_cash": 1000.00,
  "final_cash": 4850.00,
  "expected_cash": 4800.00,
  "difference": 50.00,
  "total_orders": 45,
  "total_sales": 6750.00,
  "payments_by_method": {
    "cash": {
      "count": 25,
      "total": 3800.00
    },
    "card": {
      "count": 15,
      "total": 2250.00
    },
    "transfer": {
      "count": 5,
      "total": 700.00
    }
  }
}
```

## Endpoints Disponibles

### Pantalla de Toma de Orden (Mesero)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/tenant/pos/orders` | Crear nueva orden |
| GET | `/tenant/pos/orders` | Listar órdenes con filtros |
| GET | `/tenant/pos/orders/:id` | Ver detalle de orden |
| POST | `/tenant/pos/orders/:id/lines` | Agregar producto |
| PUT | `/tenant/pos/lines/:id` | Modificar línea |
| DELETE | `/tenant/pos/lines/:id` | Eliminar línea |
| POST | `/tenant/pos/orders/:id/cancel` | Cancelar orden |

### Pantalla de Cobro (Cajero)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/tenant/pos/cash-shifts/open` | Abrir turno |
| GET | `/tenant/pos/cash-shifts/current` | Ver turno actual |
| GET | `/tenant/pos/orders` | Ver órdenes para cobrar |
| GET | `/tenant/pos/orders/:id` | Ver detalle de orden |
| POST | `/tenant/pos/orders/:id/payment` | Procesar pago |
| POST | `/tenant/pos/orders/:id/split-payment` | Pago dividido |
| POST | `/tenant/pos/cash-shifts/:id/close` | Cerrar turno |
| GET | `/tenant/pos/cash-shifts/:id/report` | Reporte de turno |

### Reportes (Gerente)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/tenant/pos/reports/daily-sales` | Ventas del día |
| GET | `/tenant/pos/reports/waiter-performance` | Desempeño de meseros |
| GET | `/tenant/pos/reports/top-products` | Productos más vendidos |
| GET | `/tenant/pos/reports/sales-by-hour` | Ventas por hora |
| GET | `/tenant/pos/reports/payment-methods` | Ventas por método de pago |

## Permisos RBAC Requeridos

### Mesero
- `pos:Create` - Crear órdenes
- `pos:Read` - Ver órdenes
- `pos:Update` - Modificar órdenes y líneas
- `pos:Delete` - Cancelar órdenes

### Cajero
- `pos:Read` - Ver órdenes
- `pos:Payment` - Procesar pagos
- `pos:CashShift` - Gestionar turnos de caja

### Gerente
- Todos los permisos anteriores
- `pos:Reports` - Acceder a reportes

## Integración con Inventario

El módulo POS está completamente integrado con el módulo de inventario:

1. **Al procesar un pago**, automáticamente se crean movimientos de inventario tipo `sales_shipment`
2. **Cada línea de la orden** genera un movimiento de inventario con quantity negativo
3. **Los movimientos referencian** la orden POS: `reference_type: 'pos_order'`, `reference_id: order.id`
4. **El stock se actualiza** automáticamente en el almacén correspondiente

## Características Implementadas

✅ Creación rápida de órdenes con número secuencial
✅ Gestión de líneas de orden (agregar, modificar, eliminar)
✅ Cálculo automático de totales, descuentos y propinas
✅ Múltiples métodos de pago (efectivo, tarjeta, transferencia)
✅ Pagos divididos con validación de suma
✅ Cálculo automático de cambio para pagos en efectivo
✅ Control de turnos de caja con reconciliación
✅ Gestión de mesas para restaurantes
✅ Integración automática con inventario
✅ Reportes de ventas, desempeño y productos
✅ Aislamiento multi-tenant
✅ Auditoría completa (waiter_id, cashier_id, timestamps)

## Próximos Pasos

Para usar el módulo en producción:

1. **Ejecutar migraciones**: `npm run migration:run`
2. **Configurar permisos RBAC** para meseros y cajeros
3. **Crear almacenes** (warehouses) para cada punto de venta
4. **Crear productos** con precios
5. **Configurar mesas** (opcional, para restaurantes)
6. **Capacitar usuarios** en el flujo de trabajo

## Notas Importantes

- Un cajero debe tener un turno abierto para procesar pagos
- Las órdenes no se pueden modificar después de ser pagadas
- Los movimientos de inventario se crean automáticamente al pagar
- El order_number es único por día y almacén
- Las mesas se liberan automáticamente al pagar la orden
- Los pagos divididos deben sumar exactamente el total de la orden

