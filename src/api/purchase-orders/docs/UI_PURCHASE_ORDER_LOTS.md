# UI — Lotes de la orden de compra (recibidos vs migrados)

Contrato para Pollux. El tab **Lotes** del detalle **no** debe listar plano todos los `inv_s_batches` de la OC. Los lotes destino de una transferencia **no son otro recibo**: van anidados bajo el lote que sí llegó del proveedor.

`GET /api/tenant/purchase-orders/:id` ya trae el árbol. No uses `header.batches` crudo de TypeORM.

---

## Endpoints

| Uso | Ruta |
|-----|------|
| Árbol + totales | `GET /api/tenant/purchase-orders/:id` → `data.batches` y `data.batches_summary` |
| Mismos datos en header | `data.header.batches` / `data.header.batches_summary` |

Badge del tab: **`batches_summary.received_lots`**, no `batches.length` ni el conteo de nodos anidados.

Si hay migraciones, junto al badge o en el título: `+N migraciones` con `batches_summary.migrated_lots`.

---

## Qué es cada fila

| `origin` | `origin_label` | Significado |
|----------|----------------|-------------|
| `receipt` | Recibido | Lote creado al **recibir** la OC. Fila padre. |
| `migration` | Migrado a | Lote creado por **transferencia**. Solo como hijo de `migrated_to[]`. |

Nunca pintes un `origin: migration` como fila de primer nivel. Eso es lo que hacía parecer que se recibió de más.

---

## Columnas del padre (recibido)

| Columna UI | Campo | Notas |
|------------|--------|--------|
| Lote | `batch_number` | Badge |
| Producto | `product_name` + `product_sku` | |
| Almacén | `sucursal` + `warehouse_name` | 2 líneas. También `razon_social` |
| Costo | `unit_cost` + `payment_currency` del header | Hasta 4 decimales. Badge de moneda, no `"USD 2.22"` |
| Costo real USD | `real_unit_cost_usd` | Rojo. Ocultar si `null`. Ver `UI_PURCHASE_ORDER_REAL_COST.md` |
| Costo real MXN | `real_unit_cost_mxn` | Verde. Ocultar si `null` |
| Importe | `amount` | `unit_cost × received_quantity`. **Solo padres entran al TOTALES** |
| Solicitadas | `ordered_quantity` + `uom_name` | Cantidad de la **línea**, no del lote |
| Llegaron | `received_quantity` + `uom_name` | Lo que llegó en **este** lote |
| Quedan aquí | `remaining_quantity` | `available_quantity` de este almacén |
| Migrados | `migrated_quantity` | Suma de transferencias de salida. Si `> 0`, hay hijos |
| Otras salidas | `consumed_quantity` | Venta / auditoría. Ocultar si `0.000` |
| Medida | `measure_label` | `"8 Foot"`. `—` si null. Ver `UI_INVENTORY_MEASURE.md` |

Si `migrated_to.length > 0`, fila expandible. Indicador: chevron + texto **Migrado a**.

---

## Filas anidadas (migrado a)

Indentadas bajo el padre. Prefijo o chip **Migrado a**.

| Columna UI | Campo |
|------------|--------|
| Lote destino | `batch_number` |
| Destino | `sucursal` + `warehouse_name` |
| Folio transferencia | `transfer.transfer_folio` |
| Quién / cuándo | `transfer.transferred_by_name` + `transfer.transferred_at` |
| Se movieron | `transfer.quantity` (o `received_quantity` del hijo: lo que **llegó** al destino) |
| Quedan en destino | `remaining_quantity` |
| Re-migrados | `migrated_quantity` del hijo si volvió a salir |

`ordered_quantity` del hijo es `null`: no lo pintes como 3000 PT otra vez.

Costo/importe del hijo son de la porción movida. **No los sumes en TOTALES.**

Cadena A → B → C: B anidado en A, C anidado en B.

---

## TOTALES del tab

Usa `batches_summary`, no sumes la tabla visible (incluye hijos y duplicarías importe).

| UI | Campo |
|----|--------|
| Lotes recibidos | `received_lots` |
| Cantidad recibida | `received_quantity` + UOM |
| Queda en lotes originales | `remaining_on_received_lots` |
| Queda en todos los almacenes | `remaining_total` |
| Migrado desde el recibo | `migrated_quantity` |
| Importe | `amount_total` + moneda del header |

`amount_total` **solo** suma padres `origin: receipt`. En el ejemplo ODC-000020, `MZN-CTIJ-BDG-00005` y `MZN-CTR-BDG-01493` no deben aparecer como dos recibos de USD 2,917.08.

---

## Ejemplo

```json
{
  "batches_summary": {
    "received_lots": 4,
    "migrated_lots": 1,
    "received_quantity": "4256.000",
    "remaining_on_received_lots": "2942.000",
    "remaining_total": "4256.000",
    "migrated_quantity": "1314.000",
    "amount_total": 7184.72
  },
  "batches": [
    {
      "batch_number": "MZN-CTIJ-BDG-00005",
      "origin": "receipt",
      "origin_label": "Recibido",
      "received_quantity": "1314.000",
      "remaining_quantity": "0.000",
      "migrated_quantity": "1314.000",
      "consumed_quantity": "0.000",
      "unit_cost": 2.22,
      "real_unit_cost_usd": 2.344,
      "real_unit_cost_mxn": 39.75,
      "amount": 2917.08,
      "migrated_to": [
        {
          "batch_number": "MZN-CTR-BDG-01493",
          "origin": "migration",
          "origin_label": "Migrado a",
          "sucursal": "Torreón",
          "warehouse_name": "Bodega",
          "received_quantity": "1314.000",
          "remaining_quantity": "1314.000",
          "ordered_quantity": null,
          "transfer": {
            "transfer_folio": "TRF-000010",
            "quantity": "1314.000",
            "transferred_by_name": "Ana",
            "destination_sucursal": "Torreón",
            "destination_warehouse_name": "Bodega Torreón"
          },
          "migrated_to": []
        }
      ]
    }
  ]
}
```

UI padre:

```
MZN-CTIJ-BDG-00005   ENCINO 4/4 EN1
Llegaron 1314 PT · Quedan 0 PT · Migrados 1314 PT  →
  └ Migrado a  MZN-CTR-BDG-01493  Torreón / Bodega
     Se movieron 1314 PT · Quedan 1314 PT · TRF-000010
```

---

## Checklist Pollux

- [ ] Tab Lotes usa `data.batches` (árbol). Badge = `received_lots`
- [ ] Hijos solo en `migrated_to`, chip **Migrado a**
- [ ] Padre muestra llegaron / quedan / migrados (y otras salidas si > 0)
- [ ] Hijo muestra destino, folio, cantidad movida, quedan allá
- [ ] TOTALES desde `batches_summary`, sin sumar filas migradas
- [ ] Moneda con badge de `payment_currency`
- [ ] `measure_label` si viene
- [ ] Costo real USD/MXN si `real_unit_cost_*` no es null
