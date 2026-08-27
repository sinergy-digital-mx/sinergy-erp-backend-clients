# UI — Editar / eliminar líneas de orden de compra

El detalle de la OC **sí se puede editar por línea** mientras `general_status === 'Creada'`. El API ya lo hace. Falta pintar acciones, modal, IVA y badge de moneda.

No uses `PUT /api/tenant/purchase-orders/:id` para cambiar el IVA o el precio de **una** línea: ese endpoint reemplaza **todas** las líneas. Usa PATCH/DELETE de línea.

---

## Cuándo hay acciones

| `general_status` | Editar línea | Eliminar línea | Agregar producto |
|------------------|--------------|----------------|------------------|
| `Creada` | Sí | Sí | Sí |
| `Recibida` | No | No | No |
| `Cancelada` | No | No | No |

Campo de apoyo en GET detalle / listado: `can_edit_lines` (`true` solo en **Creada**).

Si `can_edit_lines === false`: oculta lápiz, basura y “Agregar producto”. La tabla queda solo lectura.

---

## Tabla Productos (detalle)

Cada fila = `line_items[]`. La moneda de **toda** la OC es `payment_currency` (`MXN` | `USD`). No concatenar `"USD 2.22"`.

**`unit_total` es costo sin impuestos.** El importe de línea que ves como `6,660.00` (`2.22 × 3000`) es **sin IVA**. El IVA de esa línea es `line_iva` (`1,065.60` al 16%). El total de la línea con impuestos es `line_total` (`7,725.60`).

Estos 4 montos **vienen persistidos** en cada línea. No los recalcules en el cliente.

| Columna | Fuente | Cómo pintar |
|---------|--------|-------------|
| Producto | `product.name` + código | igual que ahora |
| Costo unit. | `unit_total` | **sin IVA**. Número + badge `payment_currency` |
| IVA % | `iva_percentage` | badge `16%` / `0%` |
| Importe (sin IVA) | `line_subtotal` | `qty × unit_total`. Badge moneda |
| IVA $ | `line_iva` | monto de IVA de **esa** línea. Badge moneda |
| Total línea | `line_total` | `line_subtotal + line_iva + line_ieps`. Badge moneda |
| Solicitadas | `quantity` + UOM | igual |
| Recibidas | recepción | igual |
| Acciones | — | lápiz + basura **solo si** `can_edit_lines` |

| Campo persistido | Qué es |
|------------------|--------|
| `unit_total` | Costo unitario **sin** IVA/IEPS |
| `iva_percentage` / `ieps_percentage` | % de la línea |
| `iva_unit` / `ieps_unit` | Impuesto **por unidad** |
| `line_subtotal` | Importe **sin** impuestos |
| `line_iva` | IVA de la línea |
| `line_ieps` | IEPS de la línea |
| `line_total` | Importe **con** IVA + IEPS |

IEPS: columna `line_ieps` solo si alguna línea tiene `ieps_percentage > 0`. En el modal de editar, sí mostrar el campo (puede ser 0).

Al cambiar IVA 16 → 0 en el PATCH, `line_iva` pasa a `0` y `line_total` queda igual a `line_subtotal`. El footer `requested_*` es la suma de esas columnas.

### Badge de moneda

Mismo componente que el header de crear OC (`UI_PURCHASE_ORDER_CURRENCY.md`).

```
[USD]  2.22
[USD]  6,660.00
```

Nunca `USD 2.22` como texto plano. El código de moneda sale de `payment_currency` del header, no de cada línea.

---

## Footer de totales (abajo de la tabla)

Siempre visible en el tab Productos. Montos del **header**, no sumes la tabla en el cliente (salvo para validar).

| Etiqueta | Campo |
|----------|--------|
| Subtotal | `requested_subtotal` |
| IVA | `requested_iva_total` |
| IEPS | `requested_ieps_total` (ocultar si es 0) |
| **Total** | `requested_total` |

Cada monto con badge `payment_currency`.

Si unas líneas van a 16% y otras a 0%, el footer muestra la **suma** de IVA (`requested_iva_total`). El % por línea va en la columna IVA %.

---

## Modal editar línea

Al clic en lápiz. Prefill con la fila actual.

| Campo UI | Body PATCH | Notas |
|----------|------------|--------|
| Cantidad | `quantity` | `> 0` |
| Costo unitario | `unit_total` | `>= 0` |
| IVA % | `iva_percentage` | `0`–`100`. Select 0 / 16 o input. |
| IEPS % | `ieps_percentage` | `0`–`100`. Opcional. |

Moneda **no** se edita en la línea (es de la OC).

```
PATCH /api/tenant/purchase-orders/:orderId/line-items/:lineItemId
```

Cambiar solo IVA 16 → 0:

```json
{ "iva_percentage": 0 }
```

Cambiar precio e IVA:

```json
{
  "unit_total": 2.22,
  "iva_percentage": 0,
  "quantity": 3000
}
```

### Respuesta (200)

Misma forma que `GET /api/tenant/purchase-orders/:id`. Reemplaza el estado del detalle con este objeto: líneas, `requested_*`, `can_edit_lines`.

No hace falta un GET extra si usas la respuesta.

400 si la OC ya no está en **Creada**:

`No se puede actualizar la línea de la orden de compra con estado: Recibida`

---

## Eliminar línea

1. Confirmación. Texto sugerido: `¿Eliminar {product.name} de esta orden? Se recalcularán los totales.`
2. Si confirma:

```
DELETE /api/tenant/purchase-orders/:orderId/line-items/:lineItemId
```

200 = misma forma que el GET detalle (OC ya sin esa línea y con totales nuevos).

404 si la línea ya no existe. 400 si no está en **Creada**.

---

## Agregar producto (detalle)

Mismo modal que al crear la OC. Solo si `can_edit_lines`.

```
POST /api/tenant/purchase-orders/:orderId/line-items
```

Body = `CreateLineItemDto` (producto, UOM, cantidad, costo, IVA, IEPS, `currency` = `payment_currency` de la OC).

200/201 = GET detalle completo (no solo la línea nueva).

---

## Qué no hacer

- No concatenar moneda + monto.
- No usar PUT de la OC para un cambio de una línea.
- No editar líneas en Recibida / Cancelada (el API responde 400).
- No sumar MXN + USD (una OC es una sola moneda).
- No asumas que IVA es siempre 16: cada línea tiene su `iva_percentage`.

---

## Checklist Pollux

- [ ] Columna IVA % (badge) en tab Productos
- [ ] Importe línea = `line_subtotal` (**sin IVA**). No es el total con impuesto
- [ ] Columna IVA $ = `line_iva` y Total línea = `line_total`
- [ ] Costo e importes con badge MXN / USD (`payment_currency`)
- [ ] Footer: subtotal, IVA, IEPS si aplica, total
- [ ] Lápiz + basura por fila si `can_edit_lines`
- [ ] Modal: cantidad, costo unitario, IVA %, IEPS %
- [ ] PATCH línea → pintar respuesta (líneas + `requested_*`)
- [ ] DELETE con confirmación → pintar respuesta
- [ ] Ocultar acciones si no es **Creada**
