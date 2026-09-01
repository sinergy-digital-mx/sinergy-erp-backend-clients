# UI — Historial de movimientos de la orden de compra

Contrato para Pollux. Tab nuevo en el detalle de la OC, a la derecha de **Pagos**: **Historial de movimientos**.

Cubre creación, estatus, cambios de producto/precio/IVA, notas, pedimento, recibo, migraciones de lote, documentos, pagos, ajustes de inventario y salidas por venta. Quién y cuándo en cada fila.

---

## Endpoints

| Uso | Ruta |
|-----|------|
| Tab (ya viene en el detalle) | `GET /api/tenant/purchase-orders/:id` → `data.movements` + `data.movements_count` |
| Solo historial / refresh | `GET /api/tenant/purchase-orders/:id/movements` |

Respuesta del GET dedicado:

```json
{
  "data": [ { "id": "created:uuid", "type": "created", "type_label": "Orden creada", "occurred_at": "..." } ],
  "total": 12
}
```

Badge del tab: `movements_count` (o `total` del GET dedicado).

Orden: **más reciente primero**.

---

## Fila

| UI | Campo |
|----|--------|
| Icono / chip | `type` + `type_label` |
| Título | `title` (ya en español) |
| Texto | `description` |
| Usuario | `actor_name` (si null: `—`) |
| Fecha | `occurred_at` |
| Diff | `changes[]` si `length > 0` |

No construyas el copy en el cliente. Pinta `title` + `description`.

---

## `type`

| `type` | Chip | Cuándo |
|--------|------|--------|
| `created` | Orden creada | Alta de la OC |
| `status_changed` | Cambio de estatus | Recibida / Cancelada |
| `line_added` | Producto agregado | POST línea |
| `line_updated` | Producto actualizado | PATCH línea (precio, IVA, cantidad, UOM) |
| `line_removed` | Producto eliminado | DELETE línea |
| `notes_updated` | Notas actualizadas | PATCH notas |
| `pedimento_updated` | Pedimento actualizado | PATCH pedimento |
| `header_replaced` | Orden reemplazada | PUT/PATCH completo |
| `received` | Mercancía recibida | Resumen del recibo |
| `lot_received` | Lote recibido | Un lote al recibir |
| `lot_migrated` | Lote migrado | Transferencia de inventario |
| `document_uploaded` | Documento subido | Factura, etc. |
| `document_generated` | Documento generado | PDF original / recepción |
| `payment_recorded` | Pago registrado | Alta de pago |
| `payment_deleted` | Pago eliminado | Borrado de pago |
| `inventory_adjusted` | Ajuste de inventario | Auditoría autorizada sobre un lote de la OC |
| `stock_sold` | Salida por venta | Asignación a OV |

Colores sugeridos: estatus (ámbar/verde/rojo), dinero (verde), lotes/migraciones (morado), documentos (azul), errores no aplican.

Filtros opcionales del tab: chips por `type`. Default: todos.

---

## Diff (`changes`)

Solo en ediciones (precio, IVA, notas, estatus, reemplazo). Si el array está vacío, no muestres tabla de cambios.

```json
{
  "field": "iva_percentage",
  "field_label": "IVA %",
  "from": "16",
  "to": "0"
}
```

UI:

```
IVA %          16  →  0
Costo unitario 2.22 → 2.50
```

Usa `field_label`, no `field`.

Edits de línea **anteriores** a este API no tienen diff (el dato se sobreescribía). A partir de ahora sí. Recibos, lotes, PDFs y pagos **sí** salen en OC viejas porque se reconstruyen.

---

## `metadata` (opcional, detalle expandible)

No es obligatorio pintarlo. Útil si la fila se abre:

- Lote: `batch_number`, `quantity`, `warehouse_name`
- Migración: `transfer_folio`, `source_batch_number`, `destination_batch_number`, `destination_sucursal`
- Pago: `amount`, `currency`, `payment_method`, `reference_number`
- Documento: `document_type_name`, `file_name`
- Venta: `sales_order_folio`

---

## Layout sugerido

Timeline vertical (igual que actividades de cliente):

```
●  Cambio de estatus · María López · 31/08/2026 11:04
   La orden pasó de Creada a Recibida.
   Estatus  Creada → Recibida

●  Lote migrado · Ana · 12/01/2026 10:00
   Se migraron 1314.000 del lote MZN-CTIJ-BDG-00005 al lote MZN-CTR-BDG-01493
   (Torreón · Bodega Torreón). Folio TRF-000010.

●  Documento generado · Sistema · 10/01/2026 09:12
   Se generó DOCUMENTO_ORIGINAL (DOCUMENTO_ORIGINAL_ODC-000020_es.pdf).

●  Orden creada · Miguel Arriaga · 10/01/2026 09:00
   Se creó la orden ODC-000020 para TURMAN MERCER SAWMILLS.
```

Vacío: *Sin movimientos.* No debería pasar: siempre hay `created`.

---

## Checklist Pollux

- [ ] Tab **Historial de movimientos** junto a Pagos
- [ ] Badge = `movements_count`
- [ ] Lista de `data.movements` (o GET `/movements`)
- [ ] Chip `type_label`, texto `description`, `actor_name`, `occurred_at`
- [ ] `changes` como de → a con `field_label`
- [ ] No listar lotes migrados como recibos extra: eso va en `UI_PURCHASE_ORDER_LOTS.md`
