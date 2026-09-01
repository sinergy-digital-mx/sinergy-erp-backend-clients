# UI — Crear OV: proceso de selección y armado

Checkbox en el modal **Crear Orden de Venta**, tab **Información**, entre fecha de entrega y notas (después de razón social y sucursal; **sin almacén**):

**Necesita proceso de selección y armado** → `requires_selection_assembly: true|false`

| Valor | `general_status` al crear |
|-------|---------------------------|
| `false` (default) | `Creada` |
| `true` | `En Selección` |

Solo MANUAL. POS ignora el flag.

Las OV en **En Selección** se gestionan en **Control de almacén** (`src/api/warehouse-control/docs/UI_WAREHOUSE_CONTROL.md`).

Alta del modal: `src/api/sales-orders/docs/UI_SALES_ORDER_CREATE.md`.

Tras corroboración → **Lista para entrega** (elegible para shipping junto con `Surtida`).
