# UI — Costo real en órdenes de compra (tab opcional)

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
  "extra_costs_count": 7,
  "extra_costs": [
    { "id": "uuid", "concept": "Flete terrestre", "amount": 6529.33, "currency": "MXN", "sort_order": 0 }
  ]
}
```

`payment_currency` del header sigue siendo la moneda de la OC (costo proveedor).

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
    { "concept": "Prevalidación", "amount": 336, "currency": "MXN" },
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
| Gasto sin concepto | Cada gasto necesita un concepto |
| Gastos en otra moneda y sin T.C. | Indica el tipo de cambio de aduana para convertir gastos en otra moneda |
| T.C. ≤ 0 | El tipo de cambio de aduana debe ser mayor a 0 |

Máximo 80 gastos. Concepto ≤ 120 caracteres.

---

## Layout del tab

```
[ Fecha aduana ]  [ T.C. aduana 16.9593 ]  [ GTOS% 5.58 ]

Gastos agregados                         [ + Agregar gasto ]
  Concepto (texto libre)   Monto   MXN|USD   [x]
  ...
  Total gastos MXN  23,295.01
  Valor mercancía   417,202.51

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

No recalcules en el cliente. Tras el PUT, pinta lo que regresa el GET.

---

## Movimientos

Tipo nuevo: `real_cost_updated` (label: Costo real actualizado).

---

## Checklist Pollux

- [ ] Tab **Costo real** en detalle OC (todas las OC)
- [ ] Gastos **agregables / quitables**, concepto libre
- [ ] `PUT /tenant/purchase-orders/:id/real-cost` al guardar
- [ ] T.C. de aduana independiente del diario
- [ ] Columnas Real USD (rojo) y Real MXN (verde)
- [ ] Solo lectura si `can_edit_real_cost === false`
- [ ] Vacío no rompe la OC
- [ ] Lote: ver `UI_INVENTORY_BATCH_COST.md` y columnas en `UI_PURCHASE_ORDER_LOTS.md`
