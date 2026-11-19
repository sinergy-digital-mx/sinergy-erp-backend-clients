# UI — Cancelar, reabrir y corregir una orden de compra recibida

## Cancelar

`POST /api/tenant/purchase-orders/:id/cancel`

```json
{ "reason": "El proveedor no entregó" }
```

| Estado | Efecto |
|--------|--------|
| `Creada` | Pasa a `Cancelada`. No mueve inventario. |
| `Recibida` | Da **salida** de cada lote de ingreso (`purchase_reversal`) y pasa a `Cancelada`. La entrada original queda en el kardex con su fecha; la salida queda el día de la cancelación. |
| `Cancelada` | `400` |

Si un lote de ingreso ya no tiene toda la existencia (`available < initial` porque se vendió, transfirió o auditó), `400` con la lista de lotes. Hay que **auditar y reponer** esa cantidad en el lote y después cancelar. No se cancela con los números incompletos.

## Volver a creada

`POST /api/tenant/purchase-orders/:id/reopen`

Solo desde `Cancelada`. Vuelve a `Creada`. Si ya se había recibido, el inventario que salió **no regresa**: los lotes quedan en cero y hay que recibir de nuevo. Esa recepción nueva crea lotes nuevos; los que ya salieron no bloquean el recibo.

## Corregir recibo

Permiso: `purchase_orders:CorrectReceipt` (Admin lo tiene).

`PATCH /api/tenant/purchase-orders/:id/receipt-correction`

```json
{
  "lines": [
    { "line_item_id": "uuid", "quantity": 180, "unit_total": 12.5 }
  ]
}
```

Solo en `Recibida`, y solo si el lote de esa línea sigue completo. Cantidad y precio. Si el lote ya se tocó, la misma regla: auditar primero.

## Reabrir para otro ingreso

Fecha: 2026-10-09.

Cuando la orden ya está `Recibida` (se recibió menos de lo solicitado, o la factura posterior trae otros productos) se reabre **sin sacar** el inventario que ya entró.

`POST /api/tenant/purchase-orders/:id/reopen-for-receipt`

- Solo desde `Recibida`.
- Pasa a `Creada` y marca `additional_receipt_open`.
- Los lotes existentes se quedan.

En ese estado se pueden agregar productos nuevos. Las líneas que ya tienen cantidad recibida no se editan ni se borran.

El recibo siguiente **suma** la cantidad nueva a la línea que ya tenía stock y crea lotes solo por lo nuevo. Al terminar, la orden vuelve a `Recibida` y se apaga `additional_receipt_open`. Los totales recibidos se recalculan con todas las líneas.

`POST /api/tenant/purchase-orders/:id/close-additional-receipt`

Vuelve a `Recibida` sin un ingreso nuevo. No mueve inventario.

En el detalle: **Reabrir para agregar productos** y, mientras esté abierta, **Cerrar ingreso**.

Esto no es el `POST :id/reopen` de una orden cancelada. Ese otro flujo no restaura el inventario que ya salió.
