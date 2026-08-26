# UI — Stats de órdenes de compra (MXN / USD)

Contrato para Pollux: las cards **Por Estado** y **Estado de Pago** no pueden sumar pesos y dólares. El listado ahora trae `stats` partido por moneda. No hay endpoint extra.

Nunca hagas `MXN + USD`. No conviertas. El monto es `requested_total` (misma cifra que la columna Total).

---

## Dónde

Mismo `GET` del listado. `stats` cubre **todas** las OC de los filtros actuales, no solo la página.

```
GET /api/tenant/purchase-orders?...mismos filtros
```

No sumar `data[]`. Eso mezcla monedas y se corta con la paginación.

---

## Shape

```json
{
  "data": [],
  "total": 18,
  "stats": {
    "count": 18,
    "by_currency": {
      "MXN": {
        "count": 17,
        "amount": 1045914.4,
        "by_status": {
          "Creada": { "count": 3, "amount": 5549 },
          "Recibida": { "count": 11, "amount": 1040365.4 },
          "Cancelada": { "count": 3, "amount": 0 }
        },
        "by_payment": {
          "Pagado": { "count": 2, "amount": 877006.4 },
          "Pendiente": { "count": 12, "amount": 168908 }
        }
      },
      "USD": {
        "count": 1,
        "amount": 500,
        "by_status": {
          "Creada": { "count": 1, "amount": 500 },
          "Recibida": { "count": 0, "amount": 0 },
          "Cancelada": { "count": 0, "amount": 0 }
        },
        "by_payment": {
          "Pagado": { "count": 0, "amount": 0 },
          "Pendiente": { "count": 1, "amount": 500 }
        }
      }
    }
  }
}
```

`stats.by_currency.MXN` y `.USD` **siempre** vienen. Si no hay OC en esa moneda: `count: 0`, `amount: 0`.

---

## Cómo pintar las dos cards

Siguen siendo **dos cards**. Cada monto (y, si cabe, el conteo) se muestra **en dos renglones**: MXN y USD.

Formato igual que la columna Total de la tabla: `MXN $1,045,914.40` / `USD $500.00`.

### Por Estado

| UI | Conteo | Monto MXN | Monto USD |
|----|--------|-----------|-----------|
| Total | `stats.count` | `by_currency.MXN.amount` | `by_currency.USD.amount` |
| Creadas | `MXN.by_status.Creada.count + USD.by_status.Creada.count` | `MXN.by_status.Creada.amount` | `USD.by_status.Creada.amount` |
| Recibidas | igual con `Recibida` | `…Recibida.amount` | `…Recibida.amount` |

Canceladas: opcional. Si las muestran, misma key `Cancelada`.

### Estado de Pago

| UI | Conteo | Monto MXN | Monto USD |
|----|--------|-----------|-----------|
| Total | `stats.count` | `MXN.amount` | `USD.amount` |
| Pagadas | suma `Pagado.count` de ambas monedas | `MXN.by_payment.Pagado.amount` | `USD.by_payment.Pagado.amount` |
| Pendientes | suma `Pendiente.count` | `MXN.by_payment.Pendiente.amount` | `USD.by_payment.Pendiente.amount` |

Si `USD.count === 0`, se puede ocultar el renglón USD (solo hay pesos). No volver a un solo `$` mezclado.

Barras: proporción **por conteo** (o por monto **dentro de la misma moneda**). No uses un % sobre MXN+USD.

---

## Qué no hacer

- Sumar `row.requested_total` de `data[]` para las cards
- Prefijo `$` genérico sin moneda
- Un total único tipo `$1,046,414.40` con OC en USD y MXN
- Convertir con tipo de cambio

---

## Checklist Pollux

- [ ] Cards leen `response.stats`, no la página
- [ ] Cada monto muestra MXN y USD por separado
- [ ] Si no hay USD, se oculta el renglón USD (no se mezcla)
- [ ] Recargar stats con los mismos filtros del listado
