# UI — Cuotas HOA / mantenimiento

Tab **HOA** del detalle de contrato. Las cuotas se listan **por mes calendario**, no por el número con el que se generaron.

Base: `/api/tenant/contracts/:contractId/hoa-payments`  
Permisos: `Contract` + `Read` (lista/stats), `Create` (generar), `Update` (pagar/editar/marcar vencidos).

---

## Lista

```http
GET /api/tenant/contracts/:contractId/hoa-payments
```

El API ordena por `due_date` ASC. El mes de cada fila sale de esa fecha (día de calendario, sin correr UTC).

Pinta:

- Encabezado de año cuando cambia 2025 → 2026.
- Filtro **Todos / 2025 / 2026** si hay más de un año.
- Texto de rango: *15 cuotas de enero 2025 a marzo 2026*.

No uses `payment_number` para ordenar. Si se generó 2026 primero y luego 2025, el # puede ir 13, 14, 1… el mes debe ir ene 2025 → dic 2025 → ene 2026.

---

## Stats

```http
GET /api/tenant/contracts/:contractId/hoa-payments/stats
```

| Card | Valor | Sub |
|------|--------|-----|
| Total HOA | `total_payments` | `total_expected` |
| Pagados | `paid_count` | `total_paid` |
| Parciales | `partial_count` | cuota parcial |
| Pendientes | `pending_count` | `total_pending` |
| Vencidos | `overdue_count` | **`overdue_amount`** |

`overdue_amount` es la suma de `amount_pending` de cuotas `pendiente`/`parcial` con vencimiento anterior a hoy. Se calcula en el API aunque no hayan pulsado **Marcar vencidos**.

No pongas “Cancelados N” en la card de vencidos.

---

## Generar

```http
POST /api/tenant/contracts/:contractId/hoa-payments/generate
```

```json
{
  "first_payment_date": "2026-01-05",
  "payments_count": 12,
  "payment_day": 5,
  "monthly_amount": 1500
}
```

Pueden generar varias veces. El API salta meses que ya existen. La fecha es `YYYY-MM-DD` de calendario.

Después: refrescar lista + stats.
