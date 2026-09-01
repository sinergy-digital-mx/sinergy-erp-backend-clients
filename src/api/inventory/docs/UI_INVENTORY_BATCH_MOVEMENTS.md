# UI — Movimientos del lote

Tab **Movimientos** en el detalle de lote (`MZN-CTR-BDG-00001`). Timeline de todo lo que le pasó al lote: se creó, salió por venta, se transfirió, se ajustó por auditoría.

Hoy el resumen de General muestra **0** en Órdenes aunque el lote ya vendió. Ese número sale de `movement_summary`; el tab pinta `movements`.

Contrato igual que OC (`UI_PURCHASE_ORDER_MOVEMENTS.md`): no armes el copy en Pollux. Pinta `title` + `description`.

---

## Dónde va

Tabs actuales:

`General | Transferencias | Auditorías | Foto | Etiqueta`

Agregar **Movimientos** (sugerido: entre General y Transferencias). Badge = `movements_count`.

```
General | Movimientos (3) | Transferencias | Auditorías | Foto | Etiqueta
```

**Transferencias** y **Auditorías** se quedan. Este tab es el historial completo.

---

## Endpoints

| Uso | Ruta |
|-----|------|
| Tab (ya viene en el detalle) | `GET /api/tenant/inventory/batches/:id` → `movements` + `movements_count` + `movement_summary` |
| Solo historial / refresh | `GET /api/tenant/inventory/batches/:id/movements` |

Permiso: `inventory:read`.

Respuesta del GET dedicado:

```json
{
  "data": [
    {
      "id": "sold:uuid",
      "type": "stock_sold",
      "type_label": "Salida por venta",
      "title": "Salida por venta",
      "description": "Salieron 2.000 Pieza por la venta OV-000010 (Juan García).",
      "direction": "out",
      "quantity": "2.000",
      "actor_name": "Ana Pérez",
      "authorized_by_name": null,
      "occurred_at": "2026-08-19T12:00:00.000Z",
      "changes": [],
      "metadata": { "sales_order_folio": "OV-000010" }
    }
  ],
  "total": 3
}
```

Orden: **más reciente primero**. Siempre hay al menos la fila de origen (creación / compra / importación / transferencia de entrada).

El lote de la captura (tag `IMPORTACION`, inicial 3, disponible 1) **debe** mostrar:

1. **Entrada por importación** +3 (18 ago 2026)
2. **Salida por venta** −2 (las 2 piezas consumidas)

Si Órdenes sigue en 0, Pollux no está leyendo `movement_summary.by_type.orders` del GET nuevo.

---

## Fila

| UI | Campo |
|----|--------|
| Chip | `type` + `type_label` |
| Título | `title` |
| Texto | `description` |
| Cantidad | `quantity` + `direction` |
| Usuario | `actor_name` (si null: `—`) |
| Autorizó | `authorized_by_name` solo si no es null (auditorías) |
| Fecha | `occurred_at` |
| Diff | `changes[]` si `length > 0` |

Cantidad:

| `direction` | UI |
|-------------|-----|
| `in` | verde `+{quantity}` |
| `out` | rojo `−{quantity}` |
| `adjust` | `quantity` ya viene con signo (`-0.500` / `1.000`) |

---

## `type`

| `type` | Chip | Cuándo |
|--------|------|--------|
| `created` | Lote creado | Alta sin OC / sin importación / sin transferencia |
| `purchase_received` | Entrada por compra | Recibo de OC |
| `imported` | Entrada por importación | Tag `IMPORTACION` (carga masiva) |
| `transfer_in` | Entrada por transferencia | Este lote nació de un TRF |
| `transfer_out` | Salida por transferencia | Se partió hacia otro lote |
| `stock_sold` | Salida por venta | FIFO a una OV / POS |
| `inventory_adjusted` | Ajuste de inventario | Auditoría **autorizada** |

Colores: entradas verde, salidas rojo/naranja, ajustes morado, creación gris.

Filtros opcionales: chips por `type`. Default: todos.

---

## Cards de General (`movement_summary`)

Siguen en General. Ahora sí cuentan ventas.

| Card | Campo |
|------|--------|
| Total Movimientos | `movement_summary.total_movements` (= `movements_count`) |
| Órdenes | `by_type.orders` |
| Transferencias salida | `by_type.transfers_out` |
| Transferencias entrada | `by_type.transfers_in` |
| Ajustes | `by_type.adjustments` |

`total_in` / `total_out` son sumas de cantidad, no de filas.

---

## `metadata` (detalle expandible)

- Compra: `purchase_order_folio`, `warehouse_name`
- Importación: `source_tag_identifier`
- Transferencia: `transfer_folio`, `related_batch_number`, `warehouse_name`
- Venta: `sales_order_folio`, `sales_order_id`, `customer_name`, `sales_order_type` (`POS` / `MANUAL`)
- Ajuste: `audit_folio`, `reason`, `variance`

Links:

- OV → `/ventas/ordenes/{sales_order_id}` (o folio)
- OC → `/compras/{purchase_order_id}`
- TRF → `/inventario/transferencias/{transfer_id}`
- AUD → `/inventario/auditorias/{audit_id}`

---

## Layout

Timeline vertical (igual que OC / actividades de cliente):

```
●  Ajuste de inventario · Ana Pérez · autorizó Luis Mora · 21/08/2026 11:00
   Ajuste AUD-000001: 1.500 → 1.000 Pieza. Merma.
   Existencia  1.500  →  1.000
   −0.500

●  Salida por transferencia · Ana Pérez · 20/08/2026 10:00
   Salieron 1.000 Pieza hacia el lote MZN-SBA-BDG-00002 (SUR · Bodega Sur). Folio TRF-000001.
   −1.000

●  Salida por venta · Ana Pérez · 19/08/2026 12:00
   Salieron 2.000 Pieza por la venta OV-000010 (Juan García).
   −2.000

●  Entrada por importación · Ana Pérez · 18/08/2026 10:00
   Entraron 3.000 Pieza por importación en Bodega.
   +3.000
```

Vacío: no debería pasar. Si `data` viene `[]`, *Sin movimientos.*

---

## Checklist Pollux

- [ ] Tab **Movimientos** con badge `movements_count`
- [ ] Lista de `movements` del GET detalle (o GET `/batches/:id/movements`)
- [ ] Chip `type_label`, texto `description`, `actor_name`, `occurred_at`
- [ ] `authorized_by_name` en ajustes
- [ ] `+` / `−` según `direction`
- [ ] `changes` de → a con `field_label` (ajustes)
- [ ] Card **Órdenes** de General = `movement_summary.by_type.orders` (en la captura debe ser ≥ 1 si hay 2 piezas consumidas por venta)
