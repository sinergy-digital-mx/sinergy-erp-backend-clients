# UI — Costo y precio en detalle de lote

Contrato para Pollux. El lote **no guarda** el costo real: lo lee de la línea de OC (igual que el pedimento).

---

## Endpoint

```
GET /api/tenant/inventory/batches/:id
```

| Campo | Tipo | Qué es |
|-------|------|--------|
| `unit_cost` | number \| null | Costo proveedor / recepción. Hasta 4 decimales |
| `payment_currency` | `MXN` \| `USD` \| null | Moneda de ese costo |
| `real_unit_cost_usd` | number \| null | Costo real USD (T.C. de aduana). `null` si la OC no usó el tab |
| `real_unit_cost_mxn` | number \| null | Costo real MXN (T.C. de aduana) |
| `customs_exchange_rate` | number \| null | T.C. de aduana de la OC |
| `suggested_unit_price` | number \| null | Precio de la primera lista activa (el mismo criterio que stats) |
| `suggested_price_currency` | `MXN` \| null | Hoy las listas son MXN |

```json
{
  "batch_number": "MZN-ENS-BDG-00003",
  "purchase_order_folio": "ODC-000015",
  "pedimento_number": "264035916004053",
  "payment_currency": "USD",
  "unit_cost": 1.8,
  "real_unit_cost_usd": 1.9005,
  "real_unit_cost_mxn": 32.231,
  "customs_exchange_rate": 16.9593,
  "suggested_unit_price": 48.5,
  "suggested_price_currency": "MXN"
}
```

Lote migrado: mismos costos (misma línea de OC).

---

## Dónde mostrarlo (tab General)

Card **COSTOS** junto a REQUISICIÓN / PEDIMENTO.

```
COSTO PROVEEDOR     1.800  [USD]
COSTO REAL          1.901  [USD]   ← rojo
                    32.231 [MXN]   ← verde
T.C. ADUANA         16.9593
PRECIO SUGERIDO     48.50  [MXN]
```

| Condición | UI |
|-----------|-----|
| Sin OC | Ocultar costo proveedor y costo real |
| OC sin tab de costo real (`real_unit_*` null) | Solo costo proveedor + precio sugerido |
| Sin lista de precios | Precio sugerido `—` |

Solo lectura. El costo real se edita en la OC (`PUT /tenant/purchase-orders/:id/real-cost`). Tras guardar allá, recargar el lote.

El margen de inventario / `GET /inventory/stats` **no cambia** en esta fase. Sigue usando costo proveedor.

---

## Checklist Pollux

- [ ] Card COSTOS en tab General del lote
- [ ] Costo real USD rojo / MXN verde si vienen
- [ ] Precio sugerido de `suggested_unit_price`
- [ ] No editar costos desde inventario
