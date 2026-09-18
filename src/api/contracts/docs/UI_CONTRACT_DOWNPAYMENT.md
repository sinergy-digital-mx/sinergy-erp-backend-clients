# UI — Enganche financiado

Tab **Enganche** del detalle de contrato.

Base: `/api/tenant/contracts/:contractId/downpayment-payments`  
Permisos: `Contract` + `Read` (lista/stats), `Create` (abono/cuotas), `Update` (pagar/editar meta).

---

## Cards de meta

```http
GET /api/tenant/contracts/:contractId/downpayment-payments/stats
```

| Card | Campo | Vacío |
|------|--------|--------|
| Meta de enganche | `down_payment_target` | “Sin definir” solo si no hay meta ni cuotas |
| Abonado | `down_payment_applied` | `$0.00` |
| **Pendiente de meta** | **`down_payment_remaining`** | **Nunca “—”**. Si no hay meta, `0` |
| Estado | `downpayment_financing_complete` | En proceso / Completado |

`down_payment_remaining` siempre es número. Si la meta no está guardada pero hay cuotas, el API usa la suma de esas cuotas como meta efectiva.

---

## Vencidos

Misma fila de conteos que HOA:

| Card | Valor | Sub |
|------|--------|-----|
| Vencidos | `overdue_count` | `overdue_amount` |

---

## Lista

```http
GET /api/tenant/contracts/:contractId/downpayment-payments
```

Orden: `due_date` ASC. Fechas de calendario (`YYYY-MM-DD`), sin correr el día por UTC.
