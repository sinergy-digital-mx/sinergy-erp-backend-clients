# UI — Stats de órdenes de compra (MXN / USD)

## 2026-11-24 — Pesos y dólares en cada carta

Cada carta muestra las dos monedas, una debajo de la otra. MXN siempre. USD también, aunque sea `$0.00`. No se suman y no se convierten.

Una orden es de una sola moneda. El conjunto del filtro puede traer las dos, así que Deuda (y el resto) siempre parten el monto. Si la sucursal no tiene órdenes en dólares, esa línea es `USD $0.00`. Sin deuda, la última columna sigue diciendo Sin deuda.

## 2026-11-23 — Franja como clientes

Una sola franja blanca, cinco columnas: Órdenes, Creadas, Recibidas, Pagadas y Deuda. Mismo alto y skeleton que el resumen de clientes. Web: 5 columnas. Tablet: 3. Móvil: 2.

El número grande es el conteo. La barra es el % de ese conteo sobre `stats.count`. Abajo va el monto, sin mezclar monedas. Sin deuda, la última columna dice Sin deuda.

Las cifras siguen saliendo de `stats` del listado. No se calculan con la página.

## 2026-11-02 — Permiso ViewStats

Las cards **Por estado** y **Estado de pago** solo se pintan con `purchase_orders:ViewStats`.

Sin ese permiso el `GET` del listado sigue igual (`data` y `total`) y **no trae `stats`**. No calcular el resumen con la página.

El rol Admin lo recibe en la migración. El resto se asigna en Roles.

```bash
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-list-view-stats-permissions.ts
```

---

Contrato para Pollux: las cards **Por Estado** y **Estado de Pago** no pueden sumar pesos y dólares. El listado trae `stats` partido por moneda solo si la sesión tiene el permiso. No hay endpoint extra.

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

## Cómo pintar la franja

Desde 2026-11-23 ya no son dos cards apiladas. Es una franja de cinco columnas. El total es la columna Órdenes (conteo + monto), no un header aparte. Deuda es la quinta columna.

Formato del monto, un renglón por moneda:

```
MXN $1,045,914.40
USD $500.00
```

USD `$0.00` se muestra. No volver a un solo `$` mezclado.

### Por estado

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
| Deuda | suma `Pendiente.count` | `MXN.by_payment.Pendiente.amount` | `USD.by_payment.Pendiente.amount` |

Si `USD.count === 0`, el renglón USD queda en `$0.00`. No ocultarlo y no volver a un solo `$` mezclado.

Barras: proporción **por conteo** (o por monto **dentro de la misma moneda**). No uses un % sobre MXN+USD.

---

## Qué no hacer

- Sumar `row.requested_total` de `data[]` para las cards
- Prefijo `$` genérico sin moneda
- Un total único tipo `$1,046,414.40` con OC en USD y MXN
- Convertir con tipo de cambio

---

## Checklist Pollux

- [ ] Cards solo con `purchase_orders:ViewStats`; si no, no se pintan
- [ ] Cards leen `response.stats`, no la página
- [ ] Cada monto muestra MXN y USD por separado, un renglón cada uno
- [ ] Si no hay USD, el renglón sigue en `USD $0.00` (no se mezcla)
- [ ] Recargar stats con los mismos filtros del listado
