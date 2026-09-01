# UI — Moneda de contratos (USD / MXN)

Contrato para Pollux: cada contrato es **todo en dólares o todo en pesos**. Los montos **no se convierten**. La moneda sale de `currency` (`USD` | `MXN`).

Hasta ahora los contratos existentes (incluye mensualidades, enganche y HOA) son **USD**. El default de alta también es **USD**. MXN solo si el lote o el POST lo mandan.

Nunca hardcodear `MXN` ni `Intl` con `currency: 'MXN'`. Eso pinta `MX$` en cards y tabla.

---

## Listado — Precio Total y Saldo Pendiente

`GET /api/tenant/contracts` ya trae `currency` en cada fila.

```json
{
  "id": "…",
  "contract_number": "CONT-2-6",
  "total_price": 25000,
  "remaining_balance": 0,
  "currency": "USD"
}
```

| Columna | Campo | Cómo pintar |
|---------|--------|-------------|
| Precio Total | `total_price` | número + badge `currency` |
| Saldo Pendiente | `remaining_balance` | igual |

Mismo patrón que OC: **badge** `USD` / `MXN` al lado del monto. No concatenar `"USD 25,000.00"` como texto plano.

```
$25,000.00  [USD]
$27,500.00  [USD]
```

`Intl.NumberFormat` con `currency: row.currency` (no fijo MXN). Vacío / 0 = `$0.00` + badge.

---

## Cards

`GET /api/tenant/contracts/stats` (mismos filtros que la tabla):

```json
{
  "currency": "USD",
  "currencies": ["USD"],
  "total": { "count": 61, "value": 2913337.14 },
  "completed": { "count": 21, "value": 886902.2 },
  "pending": {
    "count": 40,
    "value": 2026434.94,
    "paid": 809088.05,
    "remaining": 1217346.89
  },
  "overdue": {
    "contracts_count": 13,
    "payments_count": 51,
    "value": 19640.13
  }
}
```

| Campo | Uso |
|--------|-----|
| `currency` | Código para formatear las 4 cards. Hoy `USD`. |
| `currencies` | Si en el filtro hay más de una moneda. |

Formato de cards: `USD $2,913,337.14` (o `US$…`). **No** `MX$`.

Si `currency === null` y `currencies` tiene MXN y USD: no sumar las dos; mostrar badge por renglón como en OC. Hoy no aplica.

---

## Detalle y pagos

La moneda del contrato aplica a **todos** los pagos de ese contrato (mensualidades, enganche, HOA).

| Recurso | Campo |
|---------|--------|
| `GET /contracts/:id` | `currency` |
| `GET /contracts/:id/payments` | cada fila `currency` |
| `GET /contracts/:id/payments/stats` | `currency` |
| Preview / generate | `currency` junto a `monthly_payment` |
| Enganche (`…/downpayment-payments`) | igual |
| HOA (`…/hoa-payments`) | `currency` en fila y stats |

Alta: `currency` opcional. Si se omite: moneda del lote, si no **USD**. Valores: `USD` \| `MXN`.

---

## Qué no hacer

- `style: 'currency', currency: 'MXN'` fijo
- Prefijo `MX$` en Contratos
- Convertir MXN ↔ USD
- Sumar pesos y dólares en las cards

---

## Checklist Pollux

- [ ] Precio Total y Saldo Pendiente con badge `data[].currency`
- [ ] Cards con `stats.currency` (USD), no MXN
- [ ] Tab Pagos / enganche / HOA con el `currency` del GET
- [ ] Excel ya trae columna **Moneda**
