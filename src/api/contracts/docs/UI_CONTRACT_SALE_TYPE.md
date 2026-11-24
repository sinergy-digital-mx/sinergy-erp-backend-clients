# UI — Contado y financiado

## Historial

- 2026-11-19: Cada contrato trae `sale_type`: `cash` (Contado) o `financed` (Financiado). El alta es por pasos. Contado no pide enganche ni calendario de mensualidades. Los abonos partidos se capturan después en Enganche y no cambian el tipo.

## Tipo

| `sale_type` | Badge | Marca | Hover |
|-------------|---------|--------|--------|
| `cash` | Contado | — | Contado, sin mensualidad |
| `financed` + `down_payment_financed: true` | Financiado | E + F | Enganche más financiamiento |
| `financed` + `down_payment_financed: false` | Financiado | F | Financiamiento |

La marca va debajo del número, en lista y en el detalle. Ya no se usa Enganche / Contrato para el tipo de venta. El siguiente pago sigue indicando si la cuota próxima es de enganche o de contrato.

Un contado puede tener abonos de enganche. Eso no lo vuelve financiado y no le crea pago mensual.

## Alta

`POST /api/tenant/contracts`

Contado:

```json
{
  "sale_type": "cash",
  "cash_paid_in_full": false,
  "contract_date": "2026-11-19",
  "total_price": 36000,
  "down_payment": 0,
  "payment_months": 0,
  "first_payment_date": "2026-11-19"
}
```

- `cash_paid_in_full: true` deja `status: completado`, enganche = precio y saldo 0.
- `cash_paid_in_full: false` deja `status: activo`, enganche 0 y saldo = precio. Los 2 o 3 abonos se agregan en la pestaña Enganche.
- No manda `down_payment_financed`. `payment_months` y `monthly_payment` quedan en 0. No hay interés de morosos.

Financiado: `sale_type: "financed"` y el mismo cuerpo de enganche y meses de siempre. Si `down_payment_financed` es true, la marca es E + F. Si no, es F.

## Existentes

La migración marca `cash` a quien no tiene filas en `contract_payments` y les pone meses, mensualidad, interés y días de mora en vacío. Quien ya tiene pagos de contrato queda `financed`.

## Qué no hacer

- Tratar un contado con abonos de enganche como financiado.
- Pedir meses de pago o fecha de mensualidad al crear un contado.
- Mostrar pago mensual fijo en un contado.
- Generar el calendario de pagos de contrato si `sale_type` es `cash`.
