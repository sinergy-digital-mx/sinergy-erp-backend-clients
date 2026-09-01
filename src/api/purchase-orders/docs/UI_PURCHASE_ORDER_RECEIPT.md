# UI — Recibo de mercancía (tamaño opcional)

Guía para Pollux: casilla **Indicar medida**, tamaño **aparte** de la UOM de la OC, y campos numéricos **vacíos** (nunca `0`).

## Dos cosas distintas

| Qué | Ejemplo | Dónde |
|-----|---------|--------|
| **Cantidad de la OC / inventario** | 200 PT, 900 ft² | `product_uom_id` + `quantity` |
| **Tamaño de la pieza** | 8 Foot, 12 PIES | `measure` + `measure_uom_id` |

La OC puede venir en **PT (pie tabla)** o **ft²**. Al recibir se puede indicar que son 900 tablas de **8 ft**. El 8 Foot **no** es PT ni ft².

- No prellenar el select de tamaño con la UOM de la línea (PT / ft²).
- No pintar el tamaño como `8 ft²` ni `8 PT`. Pintar `8 Foot` / `12 PIES` (`measure_label`).
- El stock sigue en la UOM del producto. El tamaño solo etiqueta el lote para totalizar (8 vs 12).

---

## Endpoint

```
POST /api/tenant/purchase-orders/:id/receipt
```

Campos nuevos opcionales: `measure`, `measure_uom_id`.

Unidades del tamaño: `GET /api/uom-catalog?limit=200` (Foot, PIES, Pie, …). **No** uses solo las UOM asignadas al producto.

---

## Formulario (por línea)

```
Producto     SKU-PINO  Tabla 1x6
UOM OC       PT                         ← no tocar, es la cantidad
Cantidad     [    ]                      ← vacío, no 0
Costo        [    ]

[ ] Indicar medida                       ← off por defecto

     Tamaño   [    ]  Unidad [  elegir  ]   ← vacío, NO preseleccionar PT
```

### Casilla

| Estado | UI | Body |
|--------|----|------|
| Off | Ocultar tamaño y unidad | omitir `measure` y `measure_uom_id` |
| On | Número + select de catálogo UoM | ambos obligatorios |

Select: placeholder **Elegir unidad** (Foot, PIES). Nunca default = UOM de la OC.

### Un lote

```json
{
  "line_item_id": "uuid",
  "product_id": "uuid",
  "product_uom_id": "uuid-pt",
  "quantity": 200,
  "unit_total": 18.5,
  "iva_percentage": 16,
  "iva_unit": 2.96,
  "ieps_percentage": 0,
  "ieps_unit": 0,
  "lot_mode": "single",
  "measure": 12,
  "measure_uom_id": "uuid-foot"
}
```

`product_uom_id` = PT (cantidad). `measure_uom_id` = Foot (tamaño). Distintos.

### Varios lotes (mismo SKU, 8 y 12)

Un select de unidad de tamaño para la línea (Foot). Cada lote: cantidad + tamaño numérico.

```
[x] Indicar medida
Unidad del tamaño  [ Foot ▼ ]     ← una vez, no PT

Lote 1  tag [A-01]  cant [    ]  tamaño [ 8 ]
Lote 2  tag [A-02]  cant [    ]  tamaño [12 ]
```

```json
{
  "lot_mode": "multiple",
  "measure_uom_id": "uuid-foot",
  "lots": [
    {
      "tag_identifier": "A-01",
      "product_uom_id": "uuid-pt",
      "quantity": 80,
      "measure": 8
    },
    {
      "tag_identifier": "A-02",
      "product_uom_id": "uuid-pt",
      "quantity": 120,
      "measure": 12
    }
  ]
}
```

`measure_uom_id` puede ir en la línea (vale para todos) o en cada lote. `quantity` de línea = suma de lotes.

`400` si hay tamaño sin unidad: *Indica la unidad del tamaño (Foot, PIES, …). No uses la unidad de la orden de compra*

---

## Qué se guarda en el lote

| Campo | Ejemplo | No es |
|-------|---------|-------|
| `uom_id` / cantidad | PT, 200 | — |
| `measure` | `"8"` | no es ft² |
| `measure_uom_id` / `measure_uom_name` | Foot | no es la UOM de la OC |
| `measure_label` | `"8 Foot"` | para pintar |

Al transferir se copian `measure` y `measure_uom_id`.

---

## Campos numéricos: nunca `0`

En **todas** las formas: cantidad, costo, tamaño, IVA, IEPS inician `null` / `''`. Placeholder, no valor. Opcionales: omitir la key.

---

## Checklist Pollux

- [ ] Casilla off por defecto; On → tamaño + unidad de catálogo
- [ ] Select de unidad **vacío**, nunca PT/ft² de la línea
- [ ] Pintar `measure_label` (`8 Foot`), nunca `8` + UOM del producto
- [ ] Varios lotes: misma unidad, tamaños 8 y 12
- [ ] Inputs numéricos vacíos
- [ ] Totalizado: `UI_INVENTORY_MEASURE.md`
