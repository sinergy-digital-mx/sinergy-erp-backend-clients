# UI — Pedimento en detalle de lote

## Cambios

- 2026-11-02: Si el número tiene 15 dígitos, la respuesta lo trae con la máscara del SAT (`26  47  3807  6000123`).

El pedimento de una orden de compra vive en la OC. El lote apunta a esa OC (`purchase_order_batch_id`); al recibir se copia esa relación, y al transferir se conserva.

## Endpoint

```
GET /api/tenant/inventory/batches/:id
```

Campo nuevo:

| Campo | Tipo | Cuándo viene |
|-------|------|----------------|
| `pedimento_number` | `string \| null` | Pedimento de la OC de origen. `null` si no hay OC, o la OC no tiene pedimento. |

Sigue igual: `purchase_order_id`, `purchase_order_folio`.

```json
{
  "id": "uuid-lote",
  "batch_number": "MZN-ENS-BDG-00003",
  "purchase_order_id": "uuid-oc",
  "purchase_order_folio": "OC-000012",
  "pedimento_number": "26  47  3807  6000123",
  "warehouse_name": "Bodega",
  "product_name": "ENCINO 1X6"
}
```

Lote de transferencia: mismo `pedimento_number` que el lote origen (misma OC).

## Dónde mostrarlo (tab General)

En la card **REQUISICIÓN** (junto al folio), o una card **PEDIMENTO** al lado.

```
REQUISICIÓN          OC-000012
PEDIMENTO            26  47  3807  6000123
```

Bindings:

```ts
const folio = batch.purchase_order_folio ?? '—';
const pedimento = batch.pedimento_number?.trim() || null;
```

| Condición | UI |
|-----------|-----|
| `pedimento_number` con valor | Mostrar el número (mismo formato que en OC; no validar SAT) |
| `pedimento_number` null / vacío | No mostrar la card, o `—` / `Sin pedimento` |
| Sin OC (`purchase_order_folio` vacío) | No hay pedimento |

**Solo lectura.** No editar desde inventario; el pedimento se cambia en la OC (`PATCH /tenant/purchase-orders/:id/pedimento`). Tras guardar ahí, recargar el lote.

No hace falta un GET extra a la OC: el detalle del lote ya trae el valor.

Ver también: `src/api/purchase-orders/docs/UI_PURCHASE_ORDER_PEDIMENTO.md`.
