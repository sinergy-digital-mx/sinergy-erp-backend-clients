# Inventory Integration Guide

## Overview

Este documento describe las integraciones implementadas entre el módulo de Inventory Management y los módulos de Sales Orders y Purchase Orders.

## Integraciones Implementadas

### 1. Sales Orders → Inventory (Stock Reservations)

#### Flujo Automático

**Cuando una orden de venta cambia de estado:**

1. **Status: `draft` → `confirmed`**
   - Se crean automáticamente `StockReservation` para cada línea de la orden
   - Se reduce `quantity_available` en el inventario
   - Se incrementa `quantity_reserved` en el inventario
   - Si no hay stock suficiente, la operación falla y la orden no se confirma

2. **Status: `confirmed` → `completed`**
   - Se cumplen las reservas existentes (`fulfillStockReservation`)
   - Se crean `InventoryMovement` de tipo `sales_shipment`
   - Se reduce `quantity_on_hand` en el inventario
   - Se reduce `quantity_reserved` en el inventario
   - `quantity_available` se mantiene igual (ya estaba reducido por la reserva)

3. **Status: `confirmed` → `cancelled`**
   - Se cancelan las reservas existentes (`cancelStockReservation`)
   - Se reduce `quantity_reserved` en el inventario
   - Se incrementa `quantity_available` en el inventario
   - NO se crea ningún movimiento de inventario

#### Código de Ejemplo

```typescript
// Actualizar orden de venta a confirmada
await salesOrderService.update(
  orderId,
  { status: 'confirmed' },
  tenantId,
  userId
);
// Automáticamente crea reservas de stock

// Completar orden de venta
await salesOrderService.update(
  orderId,
  { status: 'completed' },
  tenantId,
  userId
);
// Automáticamente cumple reservas y crea movimientos
```

#### Campos de Referencia

Las reservas y movimientos se vinculan a la orden de venta mediante:
- `reference_type`: `'sales_order'`
- `reference_id`: ID de la orden de venta

### 2. Purchase Orders → Inventory (Inventory Movements)

#### Flujo Automático

**Cuando una orden de compra cambia de estado:**

1. **Status: `En Proceso` → `Recibida`**
   - Se crean automáticamente `InventoryMovement` de tipo `purchase_receipt` para cada línea
   - Se incrementa `quantity_on_hand` en el inventario
   - Se incrementa `quantity_available` en el inventario
   - Se actualiza la valorización del inventario según el método configurado (FIFO, LIFO, Weighted Average)

#### Código de Ejemplo

```typescript
// Marcar orden de compra como recibida
await purchaseOrderService.updateStatus(
  orderId,
  'Recibida',
  tenantId,
  userId
);
// Automáticamente crea movimientos de entrada
```

#### Campos de Referencia

Los movimientos se vinculan a la orden de compra mediante:
- `reference_type`: `'purchase_order'`
- `reference_id`: ID de la orden de compra

### 3. Relaciones de Base de Datos

#### Purchase Order Line Items → UoM

Se agregó la relación faltante:

```typescript
@ManyToOne(() => UoM, { onDelete: 'RESTRICT', nullable: false })
@JoinColumn({ name: 'uom_id' })
uom: UoM;

@Column()
uom_id: string;
```

**Migración**: `1772813000000-add-uom-to-line-items.ts`

## Manejo de Errores

### Sales Orders

- Si no hay stock suficiente al confirmar una orden, la operación falla con `BadRequestException`
- Los errores en la creación de reservas previenen la confirmación de la orden
- Los errores en el cumplimiento de reservas se registran pero no bloquean el cambio de estado
- Los errores en la cancelación de reservas se registran pero continúan con las demás reservas

### Purchase Orders

- Los errores en la creación de movimientos se registran pero no bloquean el cambio de estado
- Si falla un movimiento, se continúa procesando los demás line items

## Logging

Todas las operaciones de integración se registran con el logger de NestJS:

```typescript
this.logger.log(`Creating stock reservations for sales order ${salesOrder.id}`);
this.logger.error(`Failed to create reservation for line ${line.id}: ${error.message}`);
```

## Consultas de Auditoría

### Ver reservas de una orden de venta

```typescript
const reservations = await inventoryService.findStockReservations(
  tenantId,
  {
    reference_type: 'sales_order',
    reference_id: salesOrderId,
  }
);
```

### Ver movimientos de una orden de compra

```typescript
const movements = await inventoryService.findInventoryMovements(
  tenantId,
  {
    reference_type: 'purchase_order',
    reference_id: purchaseOrderId,
  }
);
```

### Ver todos los movimientos de un producto

```typescript
const movements = await inventoryService.findInventoryMovements(
  tenantId,
  {
    product_id: productId,
  }
);
```

## Dependencias Circulares

Para evitar dependencias circulares entre módulos, se usa `forwardRef`:

```typescript
// En SalesOrdersModule y PurchaseOrdersModule
imports: [
  // ...
  forwardRef(() => InventoryModule),
]
```

## Configuración Requerida

### 1. Módulos

Asegúrate de que los siguientes módulos estén importados en `AppModule`:

- `InventoryModule`
- `SalesOrdersModule`
- `PurchaseOrdersModule`

### 2. Permisos RBAC

Los usuarios necesitan los siguientes permisos:

**Para Sales Orders:**
- `sales_orders:Update` - Para cambiar el estado de órdenes

**Para Purchase Orders:**
- `purchase_orders:Update` - Para cambiar el estado de órdenes

**Para Inventory (automático):**
- El sistema usa el `tenantId` o `userId` del usuario autenticado
- No se requieren permisos adicionales para las operaciones automáticas

### 3. Datos Iniciales

Antes de usar las integraciones, asegúrate de tener:

1. **Productos** con UoMs asignados
2. **Almacenes** configurados
3. **Inventory Items** creados para los productos en los almacenes

## Testing

### Test de Integración: Sales Order → Inventory

```typescript
describe('Sales Order Inventory Integration', () => {
  it('should create reservations when order is confirmed', async () => {
    // 1. Crear orden de venta en estado draft
    const order = await salesOrderService.create(dto, tenantId);
    
    // 2. Confirmar orden
    await salesOrderService.update(
      order.id,
      { status: 'confirmed' },
      tenantId,
      userId
    );
    
    // 3. Verificar que se crearon reservas
    const reservations = await inventoryService.findStockReservations(
      tenantId,
      { reference_id: order.id }
    );
    
    expect(reservations.data.length).toBeGreaterThan(0);
    expect(reservations.data[0].status).toBe('active');
  });
});
```

### Test de Integración: Purchase Order → Inventory

```typescript
describe('Purchase Order Inventory Integration', () => {
  it('should create movements when order is received', async () => {
    // 1. Crear orden de compra
    const po = await purchaseOrderService.create(dto, tenantId, userId);
    
    // 2. Marcar como recibida
    await purchaseOrderService.updateStatus(
      po.id,
      'Recibida',
      tenantId,
      userId
    );
    
    // 3. Verificar que se crearon movimientos
    const movements = await inventoryService.findInventoryMovements(
      tenantId,
      { reference_id: po.id }
    );
    
    expect(movements.data.length).toBeGreaterThan(0);
    expect(movements.data[0].movement_type).toBe('purchase_receipt');
  });
});
```

## Troubleshooting

### Problema: "Insufficient stock" al confirmar orden de venta

**Causa**: No hay suficiente `quantity_available` en el inventario.

**Solución**:
1. Verificar el inventario actual: `GET /tenant/inventory/items?product_id=xxx`
2. Crear movimiento de entrada si es necesario
3. Verificar que no haya reservas activas bloqueando el stock

### Problema: No se crean movimientos al recibir orden de compra

**Causa**: Posibles problemas:
- El `warehouse_id` no existe
- El `product_id` no existe
- El `uom_id` no está asignado al producto

**Solución**:
1. Verificar logs del servidor para ver el error específico
2. Verificar que todos los IDs sean válidos
3. Verificar que el producto tenga el UoM asignado

### Problema: Dependencia circular al iniciar la aplicación

**Causa**: Falta `forwardRef` en algún módulo.

**Solución**:
Asegúrate de usar `forwardRef(() => InventoryModule)` en los imports de `SalesOrdersModule` y `PurchaseOrdersModule`.

## Próximos Pasos

### Mejoras Futuras

1. **Webhooks/Events**: Implementar eventos para notificar cambios de inventario
2. **Compensación**: Implementar lógica de compensación si falla una operación
3. **Batch Processing**: Procesar múltiples órdenes en lote
4. **Async Processing**: Usar colas (Bull/Redis) para operaciones pesadas
5. **Notificaciones**: Alertar a usuarios cuando hay problemas de stock

### Extensiones

1. **Devoluciones**: Implementar flujo de devoluciones de clientes
2. **Transferencias**: Integrar con transferencias entre almacenes
3. **Ajustes**: Permitir ajustes manuales con aprobación
4. **Reportes**: Dashboards de movimientos y reservas
