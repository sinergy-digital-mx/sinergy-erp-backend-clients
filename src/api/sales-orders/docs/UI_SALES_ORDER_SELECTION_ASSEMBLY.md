# UI — Crear OV: proceso de selección y armado

Checkbox en el modal **Crear Orden de Venta**, tab **Información**, entre fecha de entrega y notas (después de razón social y sucursal; **sin almacén**):

**Necesita proceso de selección y armado** → `requires_selection_assembly: true|false`

Mostrar el checkbox **solo** si `warehouse_control` está enabled **y** `sale_scope` no es `services`. En Divino no: ni checkbox ni menú Mesa de Control.

Si `sale_scope=services` (o la orden no tiene líneas `goods`), el API fuerza `requires_selection_assembly=false` y no crea job de Mesa de Control. En `combined`, el job/FIFO solo usa líneas de producto.

Texto de ayuda: “La orden se surtirá por almacén (picking y armado en Mesa de Control)”.

**No** pedir almacén por línea. El back parte el pedido según el stock de cada almacén de la sucursal.

| Valor | `general_status` al crear |
|-------|---------------------------|
| `false` (default) | `Creada` |
| `true` | `En Selección` + job en Mesa de Control |

Solo MANUAL. POS ignora el flag.

Las OV en **En Selección** se gestionan en **Mesa de Control** (`src/api/warehouse-control/docs/UI_WAREHOUSE_CONTROL.md`).

Alta del modal: `src/api/sales-orders/docs/UI_SALES_ORDER_CREATE.md`.

Edición (`PUT`) permitida en `Creada` / `En Selección` solo si el picking **no** empezó.

Tras corroboración → **Lista para entrega** (elegible para shipping junto con `Surtida`).

En el detalle OV, si hay job: `header.control_desk` (progreso `2/3 almacenes`, posición, faltantes).
