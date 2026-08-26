# UI — Moneda de la orden de compra (MXN / USD)

Una OC es **toda en pesos o toda en dólares**. No se mezclan. La moneda sale del **costo de proveedor + UOM** de cada producto (o de lo que el usuario elija si todavía no hay costo).

Valores: `MXN` | `USD`.

---

## 1. Badge de la OC (crear / editar)

En el header del modal **Crear Orden de Compra** (tab Productos o título): badge fijo según `payment_currency`.

| Estado | Badge | Texto |
|--------|--------|--------|
| Sin productos aún | vacío / “Moneda: —” | Todavía no hay moneda |
| Primer producto MXN | `MXN` | Pesos |
| Primer producto USD | `USD` | Dólares |

Tras el primer producto, **la moneda de la OC queda bloqueada**. Si el usuario quita todos los productos, el badge vuelve a “—”.

Listado y detalle: `payment_currency` ya viene en el GET de la OC. Muestra el mismo badge.

Cards **Por Estado** / **Estado de Pago** del listado: montos partidos en MXN y USD (`stats.by_currency`). No sumar. Ver `UI_PURCHASE_ORDER_STATS.md`.

---

## 2. Modal **Agregar producto**

`GET /api/tenant/vendors/:vendorId/products` ahora trae `currency` por UOM:

- Con costo de ese proveedor: `"MXN"` o `"USD"`.
- Sin costo: `null`. Prefill de costo/IVA/IEPS en `0`.

### Con costo (`uom.currency` = MXN o USD)

1. Prefill costo, IVA, IEPS **y moneda** de esa UOM.
2. Moneda **solo lectura** (badge al lado de Costo unitario). El usuario no la cambia aquí; se cambia en el producto.
3. Si la OC ya tiene moneda y `uom.currency !== payment_currency` de la OC:
   - **No agregar.** Deshabilitar **Agregar**.
   - Mensaje: `Esta orden está en MXN. No puedes agregar un producto en USD.` (o al revés).
   - No hace falta pegarle al API: el POST igual responde **400**.

### Sin costo (`uom.currency` = null)

**Sí se puede agregar.** El usuario captura costo, IVA, IEPS y **moneda**.

- Si la OC aún no tiene moneda: radio `MXN` | `USD` (default `MXN`). El primer producto fija la OC.
- Si la OC ya tiene moneda: radio bloqueado en esa moneda (o ni mostrarlo: se asume la de la OC).

Al **Crear Orden** / guardar, el backend **crea** el costo de proveedor (ese vendor + producto + UOM) con el costo, impuestos y moneda de la línea. No pidas un POST extra a vendor-costs. No sobrescribe un costo que ya existía.

Sigue siendo válido abrir **Ver producto** y configurar el costo ahí antes de agregar.

---

## 3. POST / PUT de la OC

```
POST /api/tenant/purchase-orders
PUT  /api/tenant/purchase-orders/:id
```

```json
{
  "vendor_id": "uuid",
  "payment_currency": "USD",
  "line_items": [
    {
      "product_id": "uuid",
      "uom_id": "uuid",
      "quantity": 1,
      "unit_total": 41.1,
      "iva_percentage": 0,
      "ieps_percentage": 0,
      "currency": "USD"
    }
  ]
}
```

| Campo | Dónde | Obligatorio |
|-------|--------|-------------|
| `payment_currency` | header | Mandarlo. Debe coincidir con la moneda de los productos. |
| `line_items[].currency` | cada línea | Mandarlo. Misma moneda en todas las líneas. |

Si un producto ya tiene costo de ese proveedor, gana esa moneda. Si mandas otra → **400**.

Si mezclas MXN y USD en el mismo body → **400**:

`No se pueden mezclar MXN y USD en la misma orden de compra. Todos los productos deben estar en la misma moneda.`

Agregar línea a OC existente (`POST .../line-items`): misma regla contra `payment_currency` de la OC.

---

## 4. Flujo Pollux (crear OC)

1. Usuario elige proveedor (y el resto del header).
2. `GET /vendors/:id/products` → cada UOM trae `cost` + `currency`.
3. Agrega primer producto:
   - Con costo → OC = `uom.currency`.
   - Sin costo → OC = lo que eligió en el radio.
4. Badge MXN o USD.
5. Siguiente producto: si su moneda (configurada o elegida) ≠ badge → bloquear **Agregar**.
6. POST con `payment_currency` + `currency` en cada línea.
7. Productos que no tenían costo de ese proveedor quedan guardados en el producto (tab Costos).

Cambiar de proveedor con productos ya en el carrito: vaciar líneas y resetear el badge (otro proveedor = otros costos/monedas).

---

## 5. Checklist

- [ ] Modal costo de producto: radio MXN / USD. Ver `UI_PRODUCT_VENDOR_COST_CURRENCY.md`
- [ ] Tabla de costos del producto: columna moneda
- [ ] Agregar producto en OC: prefill `uom.currency`; si `null`, el usuario elige
- [ ] Badge de moneda en crear / editar / detalle / listado
- [ ] No mezclar: bloquear Agregar si la moneda del producto ≠ la de la OC
- [ ] POST manda `payment_currency` y `line_items[].currency`
- [ ] Sin costo de proveedor: sí se agrega; al crear la OC se persiste el costo
- [ ] No convertir MXN ↔ USD
- [ ] Cards del listado: stats por MXN / USD (`UI_PURCHASE_ORDER_STATS.md`)
