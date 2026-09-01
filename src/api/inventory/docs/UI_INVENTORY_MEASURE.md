# UI — Tamaño en lotes y totalizado

El tamaño (**8 Foot**, **12 PIES**) vive en el lote. Es **independiente** de la UOM de inventario / OC (PT, ft², pza).

Una fila por SKU + almacén. `measure_totals` desglosa por tamaño. No clonar filas. No concatenar el tamaño con `uom_name`.

---

## Qué es

OC en PT. Recibes 200 PT de tablas: unas de 8 Foot y otras de 12 PIES.

```
SKU-PINO  Tabla 1x6   Bodega   200.000 PT
  8 Foot  →  80.000 PT
  12 PIES → 120.000 PT
```

- `200.000 PT` = existencia (UOM del producto).
- `8 Foot` = `measure_label`. **No** `8 PT` ni `8 ft²`.

Si `measure_totals` está vacío, no pintar desglose.

---

## Lotes

`GET /api/tenant/inventory/batches`

| Columna | Campo | Vacío |
|---------|--------|--------|
| Medida | `measure_label` (`"8 Foot"`) | `—` si `null` |

No uses `measure` + `uom_name`. `uom_name` es PT/ft² de la cantidad.

Detalle: `measure_label` junto al TAG, separado de la cantidad.

---

## Totalizado

`GET /api/tenant/inventory/summary`

```json
{
  "product_sku": "SKU-PINO",
  "uom_name": "PT",
  "total_available_quantity": "200.000",
  "measure_totals": [
    {
      "measure": "8",
      "measure_uom_id": "uuid-foot",
      "measure_uom_name": "Foot",
      "measure_label": "8 Foot",
      "total_available_quantity": "80.000",
      "total_initial_quantity": "80.000",
      "total_batches": 2
    },
    {
      "measure": "12",
      "measure_uom_id": "uuid-pies",
      "measure_uom_name": "PIES",
      "measure_label": "12 PIES",
      "total_available_quantity": "120.000",
      "total_initial_quantity": "120.000",
      "total_batches": 1
    }
  ]
}
```

Cantidad de la fila: `total_available_quantity` + `uom_name` (PT).

Chips (si `measure_totals.length > 0`):

```
200.000 PT
8 Foot → 80.000 · 12 PIES → 120.000
```

Usa `measure_label`. La cantidad a la derecha del chip sigue en UOM del SKU (PT). No sumar 8+12.

`measure: null` en un bucket = lotes sin tamaño (solo si hay mezcla). Label: **Sin medida**.

---

## POS / transferencias / Excel

- POS: `measure_label` al elegir SKU. La venta sigue por UOM de inventario.
- Transferencia: copia tamaño + unidad. Mostrar `measure_label` en el picker.
- Excel lotes: columna Medida = `8 Foot`.
- Excel totalizado: `8 Foot → 80.000 · 12 PIES → 120.000`.
- Detalle de lote: si el recibo no trajo medida, se puede capturar después (`UI_INVENTORY_BATCH_EDIT.md`).

---

## Checklist Pollux

- [ ] Columna Medida = `measure_label`, nunca tamaño + UOM del producto
- [ ] Totalizado: una fila; chips con `measure_label`
- [ ] Recibo: `UI_PURCHASE_ORDER_RECEIPT.md`
- [ ] Detalle lote sin medida: lápiz + PATCH (`UI_INVENTORY_BATCH_EDIT.md`)
