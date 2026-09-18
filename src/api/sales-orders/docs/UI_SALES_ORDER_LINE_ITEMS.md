# UI — Editar / eliminar líneas de orden de venta

El detalle de la OV **se edita por línea** en el mismo diálogo, igual que la orden de compra. No abrir `/sales-orders/:id/edit` ni otra pestaña para cambiar precio, IVA o productos.

No uses `PUT /api/tenant/sales-orders/:id` para cambiar **una** línea: ese endpoint reemplaza **todas** las líneas. Usa PATCH/POST/DELETE de línea.

---

## Cuándo hay acciones

| `general_status` | Editar línea | Eliminar línea | Agregar producto |
|------------------|--------------|----------------|------------------|
| `Creada` | Sí* | Sí* | Sí* |
| `En Selección` | Sí* | Sí* | Sí* |
| `Surtida` / `Cancelada` / otros | No | No | No |

\* Bloqueado si el picking de Mesa de Control ya empezó.

Campo de apoyo en GET detalle: `can_edit_lines`.

Si `can_edit_lines === false`: oculta lápiz, basura y “Agregar producto”.

---

## Tabla Productos (detalle)

Cada fila = `line_items[]`. `unit_price` es **sin impuestos**, hasta 4 decimales.

Los importes de línea (`line_subtotal`, `line_iva`, `line_ieps`, `line_total`) y el footer (`subtotal`, `iva_total`, `ieps_total`, `total`) vienen del API. No los recalcules en el cliente.

| Columna | Fuente | Cómo pintar |
|---------|--------|-------------|
| Producto | `product.name` + SKU | igual |
| Precio unit. | `unit_price` | sin IVA. Hasta 4 decimales. Badge moneda |
| Importe | `line_subtotal` + `line_total` | apilado s/IVA · c/IVA si hay impuesto |
| IVA | `iva_percentage` + `line_iva` | badge `%` + monto |
| IEPS | `ieps_percentage` + `line_ieps` | igual; ocultar columna si todas van en 0 |
| Solicitadas | `quantity` + UOM | igual |
| Entregadas | asignaciones / surtido | igual |
| Acciones | — | lápiz + basura **solo si** `can_edit_lines` |

Footer (header, no suma cliente):

| Etiqueta | Campo |
|----------|--------|
| Subtotal | `subtotal` / `requested_subtotal` |
| IVA | `iva_total` / `requested_iva_total` |
| IEPS | `ieps_total` (ocultar si es 0) |
| **Total** | `total` / `requested_total` |

Si unas líneas van a 16% y otras a 0%, el footer muestra la **suma** de IVA. El % por línea va en la columna IVA.

---

## Endpoints

```
POST   /api/tenant/sales-orders/:id/line-items
PATCH  /api/tenant/sales-orders/:orderId/line-items/:lineItemId
DELETE /api/tenant/sales-orders/:orderId/line-items/:lineItemId
```

Respuesta 200/201 = misma forma que `GET /api/tenant/sales-orders/:id` (`data.header`, `data.line_items`, `can_edit_lines`). Reemplaza el estado del detalle con este objeto. No hace falta un GET extra.

### POST body (`CreateSalesOrderLineItemDto`)

`product_id`, `product_uom_id`, `quantity`, `unit_price`, `iva_percentage?`, `ieps_percentage?`, `discount_percentage?`.

### PATCH body (parcial)

```json
{
  "quantity": 12,
  "unit_price": 61.3524,
  "iva_percentage": 16,
  "ieps_percentage": 0
}
```

Cambiar solo IVA 16 → 0:

```json
{ "iva_percentage": 0 }
```

### DELETE

Confirmación: `¿Eliminar {product.name} de esta orden? Se recalcularán los totales.`

400 si queda sin productos: `La orden debe tener al menos un producto`.

400 si ya no es editable: `No se puede actualizar la línea de la orden de venta con estado: Surtida`.

---

## Modal editar línea

Lápiz. Prefill de la fila. Chips 0 / 8 / 16 + input para IVA e IEPS.

| Campo UI | Body PATCH |
|----------|------------|
| Cantidad | `quantity` |
| Precio unitario | `unit_price` |
| IVA % | `iva_percentage` |
| IEPS % | `ieps_percentage` |

---

## Agregar producto

Mismo buscador que al crear la OV (`GET /tenant/sales-orders/products-summary` con `fiscal_configuration_id` y `billing_branch_id` de la orden).

---

## Qué no hacer

- No navegar a `/sales-orders/:id/edit` para editar líneas.
- No usar PUT de la OV para un cambio de una línea.
- No redondear `unit_price` a 2 decimales en el cliente.
- No sumar IVA en el cliente para el footer.
- No asumas que IVA es siempre 16: cada línea tiene su `iva_percentage`.
