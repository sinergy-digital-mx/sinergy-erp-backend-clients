# UI — Enganche financiado

- 2026-10-23: `overdue_count` solo cuenta cuotas abiertas (`pendiente`/`parcial`). Una cuota pagada no sigue como vencida. Si la meta ya está cubierta, se pueden generar las mensualidades aunque quede un renglón sucio.

Al crear con `down_payment_financed: true`, la meta va en `down_payment_target`. `down_payment` es el abono inicial (0 si todavía no hay pagos). El detalle y la card **Meta de enganche** leen `down_payment_target`; si llega null, muestran “Sin definir”.

```http
POST /api/tenant/contracts
```

```json
{
  "down_payment_financed": true,
  "down_payment": 0,
  "down_payment_target": 36000
}
```

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

`overdue_count` **no** incluye cuotas `pagado` o `cancelado`, aunque `is_overdue` haya quedado encendido. `overdue_amount` es la suma de `amount_pending` de esas cuotas abiertas vencidas.

`downpayment_financing_complete` es `true` cuando el pendiente de meta redondea a `0`. Con eso el tab **Pagos** habilita **Generar pagos**. No bloquea por una fila `parcial` con `$0.00` pendiente.

---

## Lista

```http
GET /api/tenant/contracts/:contractId/downpayment-payments
```

Orden: `due_date` ASC. Fechas de calendario (`YYYY-MM-DD`), sin correr el día por UTC.
