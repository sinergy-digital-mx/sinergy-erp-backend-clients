# UI — Pagos de orden de compra

Contrato para Pollux. El pago se registra sobre la OC. Si el monto es mayor al pendiente, la OC no se infla: el excedente queda como saldo a favor del proveedor.

## 2026-10-26 — Pago con excedente

`POST /api/tenant/purchase-orders/:id/payments` ya no rechaza un monto mayor al pendiente.

- `applied = min(monto, pendiente)` se guarda en `inv_s_purchase_order_payments`.
- `credit = monto − applied` entra al kardex `vendor_credit_ledger` en la misma moneda del pago.
- La OC pasa a `Pagado` cuando el pendiente llega a 0.

Respuesta:

```json
{
  "payment": { "id": "uuid", "amount": 10000 },
  "summary": { "amount_paid": 10000, "amount_pending": 0, "payment_status": "Pagado", "currency": "MXN" },
  "credit_created": { "amount": 2000, "currency": "MXN", "balance_after": 2000 }
}
```

`credit_created` es `null` si no hubo excedente. `payment` es `null` solo si la OC ya estaba pagada y todo el monto fue a favor.

Diálogo **Registrar pago**: Total / Pendiente / Este pago / A favor. Si hay excedente: «Excedente $X. Queda como saldo a favor del proveedor.»

Borrar el pago (`DELETE .../payments/:paymentId`) reversa ese crédito. Si ya se aplicó a otra OC: **400**.

El consumo del saldo (aplicarlo a otra OC) no va en este paso. Ver ficha del proveedor, tab Cuentas, y CxP (`credit_balance_mxn` / `credit_balance_usd`).
