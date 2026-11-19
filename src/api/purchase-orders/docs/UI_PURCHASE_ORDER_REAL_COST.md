# UI — Costo real en órdenes de compra (tab opcional)

## 2026-10-19 — Lo que se paga es el total factura

Cuentas por pagar y la columna **Total** del listado (`payable_total`) usan el total factura de la moneda de pago cuando hay costo real. El costo final sigue siendo solo de inventario y análisis. `requested_total` y `received_total` no cambian.

## 2026-10-14 — Totales contratado, factura y costo final

Cada gasto de la tabla tiene la casilla **Factura** (`include_in_invoice`). Si está marcada, ese monto se suma al total de factura del proveedor. Si no, queda en costos operativos (aduana, transporte y el resto).

| Total | Fórmula |
|-------|---------|
| Total contratado | Precio de la mercancía |
| Total factura | Mercancía + gastos con casilla Factura |
| Costos operativos | Gastos sin casilla |
| Total costo final | Total factura + costos operativos |

El costo real de la línea (y el del inventario) sigue usando **todos** los gastos. La casilla solo cambia el desglose, no el unitario.

En el sidebar **TOTALES**, debajo del total de la orden: Total contratado, Total factura, Costos operativos (si hay) y Total costo final. En el resumen del tab, las mismas filas en USD y MXN.

`extra_costs[].include_in_invoice` es boolean. En el GET también llegan `landed_contracted_mxn` / `_usd`, `landed_invoice_mxn` / `_usd` y `landed_operating_extras_mxn` / `_usd`.

`PUT /tenant/purchase-orders/:id/real-cost` acepta `include_in_invoice` en cada gasto. Si no viene, queda en false.

El inventario (`GET /inventory/stats` y el kardex) usa `real_unit_cost_mxn` cuando la OC lo tiene. Ese valor es el costo final.

## 2026-10-09 — Permiso

El costo real solo se muestra y se edita con `purchase_order_real_cost:Read`.

Ese módulo queda habilitado solo para Madereria Zona Norte y se asigna al rol Admin de esa organización. Otras organizaciones no ven el permiso ni pueden activarlo.

Sin el permiso se ocultan:

- Tab **Costo real** y el bloque **Gastos / Total final** del detalle
- Columnas Real USD / Real MXN en **Lotes**
- **Costo real** y **T.C. aduana** en el detalle del lote
- Movimiento `real_cost_updated` del historial

`PUT /tenant/purchase-orders/:id/real-cost` responde 403. El recibo de compra sigue recalculando el costo si ya estaba capturado; no hace falta este permiso para recibir.

Contrato para Pollux. Tab **Costo real** en el detalle de la OC. Es **opcional**: si no se usa, la OC sigue igual (costo proveedor, pagos, PDF, stats).

No hay catálogo de gastos. El usuario **agrega o quita filas** (flete, honorarios, o un concepto nuevo).

El T.C. es el de **aduana** (el de la hoja). No usar el tipo de cambio del día al facturar.

---

## Dónde va

En el detalle de la OC, junto a Productos / Documentos / Lotes / Pagos / Movimientos.

| UI | Campo |
|----|--------|
| Título del tab | Costo real |
| Badge | `extra_costs_count`. Si `0`, mostrar `—` o ocultar el número |
| Editable | `can_edit_real_cost === true` (Creada y Recibida). Cancelada: solo lectura |

No ocultar el tab si el proveedor es nacional. Un flete nacional también aplica.

---

## Lectura

```
GET /api/tenant/purchase-orders/:id
```

Campos en `data.header` (y en el objeto plano del header):

| Campo | Tipo | Qué es |
|-------|------|--------|
| `has_real_cost` | boolean | Hay T.C. y/o al menos un gasto |
| `can_edit_real_cost` | boolean | Se puede guardar el tab |
| `customs_date` | `YYYY-MM-DD` \| null | Fecha de aduana / pedimento |
| `customs_exchange_rate` | number \| null | T.C. de aduana (hasta 4 decimales) |
| `landed_increment_percentage` | number | GTOS% (`5.5836`) |
| `landed_merchandise_mxn` | number | Valor mercancía en MXN |
| `landed_extras_mxn` | number | Suma de gastos en MXN |
| `landed_extras_usd` | number \| null | Gastos en USD (`gastos_mxn / T.C.`) |
| `landed_total_usd` | number \| null | Total costo final USD (mercancía + todos los gastos) |
| `landed_total_mxn` | number | Total costo final MXN (mercancía + todos los gastos) |
| `landed_contracted_mxn` | number | Total contratado MXN (solo mercancía) |
| `landed_contracted_usd` | number \| null | Total contratado USD |
| `landed_invoice_mxn` | number | Total factura MXN (mercancía + gastos marcados) |
| `landed_invoice_usd` | number \| null | Total factura USD |
| `landed_operating_extras_mxn` | number | Costos operativos MXN (gastos sin marcar) |
| `landed_operating_extras_usd` | number \| null | Costos operativos USD |
| `extra_costs_count` | number | Filas de gastos (badge) |
| `extra_costs[]` | array | Gastos libres |
| `line_items[].unit_total` | number | Costo proveedor (no cambia) |
| `line_items[].igi_percentage` | number | IGI % (default 0) |
| `line_items[].real_unit_cost_usd` | number \| null | Costo real USD (rojo) |
| `line_items[].real_unit_cost_mxn` | number \| null | Costo real MXN (verde) |

```json
{
  "has_real_cost": true,
  "can_edit_real_cost": true,
  "customs_date": "2026-08-21",
  "customs_exchange_rate": 16.9593,
  "landed_increment_percentage": 5.5836,
  "landed_merchandise_mxn": 417202.51,
  "landed_extras_mxn": 23295.01,
  "landed_extras_usd": 1373.58,
  "landed_total_usd": 25973.8,
  "landed_total_mxn": 440497.52,
  "extra_costs_count": 7,
  "extra_costs": [
    { "id": "uuid", "concept": "Flete terrestre", "amount": 6529.33, "currency": "MXN", "include_in_invoice": true, "sort_order": 0 }
  ]
}
```

`payment_currency` del header sigue siendo la moneda de la OC (costo proveedor).

`requested_total` y `received_total` no cambian. El saldo por pagar (`payments_summary`, cuentas por pagar y `payable_total` del listado) usa el total factura cuando hay costo real. El total costo final (artículos + todos los gastos) es solo de análisis e inventario.

Fórmula del total final (no es el Importe con GTOS%+IGI):

- `gastos_mxn` = cada gasto convertido a MXN con T.C. aduana
- `gastos_usd` = `gastos_mxn / T.C.`
- `total_final_mxn` = valor aduana MXN + gastos MXN
- `total_final_usd` = valor aduana USD + gastos USD

En **TOTALES** (sidebar): si hay gastos, debajo del total de la orden pintar **Total contratado**, **Total factura**, **Costos operativos** (si el monto es mayor a 0) y **Total costo final** en `payment_currency`.

Al lado de Gastos, un resumen (tabla, no recuadro rojo): columnas con badge **USD** / **MXN**, filas Total contratado, Total factura, Costos operativos y Total costo final. Preview en vivo al teclear; en los demás tabs usar los campos persistidos del GET. La casilla **Factura** de cada fila decide qué gastos entran al total de factura.

---

## Guardar (reemplazo del tab)

```
PUT /api/tenant/purchase-orders/:id/real-cost
```

Manda **todo** el tab. `extra_costs` es la lista completa: lo que no venga, se borra. Para agregar un gasto nuevo, incluye una fila más. No hay endpoint por gasto.

```json
{
  "customs_date": "2026-08-21",
  "customs_exchange_rate": 16.9593,
  "extra_costs": [
    { "concept": "Prevalidación", "amount": 336, "currency": "MXN", "include_in_invoice": false },
    { "concept": "Honorarios", "amount": 2800, "currency": "MXN" },
    { "concept": "Maniobra nueva", "amount": 500, "currency": "MXN" }
  ],
  "line_items": [
    { "line_item_id": "uuid-linea", "igi_percentage": 0 }
  ]
}
```

Para **limpiar** el costo real:

```json
{
  "customs_date": null,
  "customs_exchange_rate": null,
  "extra_costs": []
}
```

Respuesta 200: OC completa (mismo shape que el GET).

### Errores 400 (toast con `message`)

| Caso | Mensaje |
|------|---------|
| Cancelada | No se puede editar el costo real de una orden cancelada |
| Gasto sin concepto | Cada gasto necesita un concepto (la UI manda `Gasto` si el concepto va vacío) |
| Gastos en otra moneda y sin T.C. | Indica el tipo de cambio de aduana para convertir gastos en otra moneda |
| T.C. ≤ 0 | El tipo de cambio de aduana debe ser mayor a 0 |

Máximo 80 gastos. Concepto ≤ 120 caracteres.

---

## Layout del tab

```
[ Fecha aduana ]  [ T.C. aduana 16.9593 ]  [ GTOS% 5.58 ]

Gastos agregados                         [ + Agregar gasto ]
  Concepto (texto libre)   [Factura]   MXN   USD   [x]
  ...
  Total gastos MXN  23,295.01
  Total contratado     24,600.22 / 417,202.51
  Total factura      mercancía + gastos con casilla Factura
  Costos operativos  gastos sin casilla (aduana y transporte)
  Total costo final  25,973.80 / 440,497.52

Productos
  Producto | Costo prov. | IGI% | GTOS% | Real USD | Real MXN
  EN1C     | 1.800 USD   | 0    | 5.58  | 1.901    | 32.231
```

- **Real USD**: color rojo. Hasta 4 decimales. Badge `USD`.
- **Real MXN**: color verde. Hasta 4 decimales. Badge `MXN`.
- Costo proveedor: `unit_total` + badge de `payment_currency`. No es editable aquí.
- IGI: input opcional por línea (0 por default). Se manda en `line_items`.
- GTOS% de línea = `landed_increment_percentage` (el mismo para todas).
- Botón **+ Agregar gasto**: nueva fila vacía (concepto + monto + moneda). Sin lista predefinida.
- Prefill de T.C. (solo UI): `GET /api/tenant/exchange-rates/daily?date=YYYY-MM-DD`. El usuario lo cambia al de aduana.

El tab puede previsualizar GTOS% y el total final en vivo. Tras el PUT, pinta lo que regresa el GET. Si un gasto tiene monto y el concepto va vacío, la UI lo guarda como `Gasto`.

---

## Movimientos

Tipo nuevo: `real_cost_updated` (label: Costo real actualizado).

---

## Checklist Pollux

- [ ] Tab **Costo real** en detalle OC (todas las OC)
- [ ] Gastos **agregables / quitables**, concepto libre
- [ ] Casilla **Factura** por gasto: suma al total de factura
- [ ] `PUT /tenant/purchase-orders/:id/real-cost` al guardar
- [ ] T.C. de aduana independiente del diario
- [ ] Columnas Real USD (rojo) y Real MXN (verde)
- [ ] Solo lectura si `can_edit_real_cost === false`
- [ ] Vacío no rompe la OC
- [ ] Lote: ver `UI_INVENTORY_BATCH_COST.md` y columnas en `UI_PURCHASE_ORDER_LOTS.md`
