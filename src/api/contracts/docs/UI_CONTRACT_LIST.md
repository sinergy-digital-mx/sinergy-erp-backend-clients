# UI — Listado de contratos: grupo de cliente y stats filtrados

## Historial

- 2026-11-19: El alta dice **Crear**. **Métricas** es texto junto al título, no un botón. El título de Contratos es del tamaño del resto de la barra.
- 2026-11-19: El badge del número es el tipo de venta: **Contado**, **Financiado E + F** o **Financiado F**. Ver `UI_CONTRACT_SALE_TYPE.md`. Enganche / Contrato queda solo en el siguiente pago.
- 2026-10-23: En **Siguiente pago** la UI pinta `next_payment_amount` y la fecha corta `dd/MM/yyyy`, tanto en fase contrato como enganche.
- 2026-10-23: Cada fila indica fase **Enganche** / **Contrato**. Si el siguiente pago es de enganche, se pinta distinto y se marca cuando es el último activo. La card **Vencidos** suma contrato + enganche y también los muestra aparte. El Excel lleva las mismas columnas y el desglose de vencidos. `hasOverdue` incluye vencidos de enganche.

Contrato para Pollux: el listado de **Contratos** filtra por **grupo de cliente** y las 4 cards de arriba se recalculan con **los mismos filtros** que la tabla (no con toda la organización).

Las cards ya existen. El cambio es: **refetch de stats cada vez que cambia un filtro**, incluyendo el nuevo grupo.

---

## Filtro Grupo de cliente

Junto a búsqueda / funnel. Dropdown, no un input.

**Opciones:** el catálogo de la sesión. Nunca un array hardcodeado ni UUIDs de Divino.

```
GET /api/tenant/customers/groups
Permiso: customers:Read
```

```json
[{ "id": "uuid", "name": "Mayoreo" }]
```

Cargar al abrir Contratos. Cachear solo en esa pantalla.

| UI | Query param | Valor |
|----|-------------|--------|
| Todos los grupos | omitir `group_id` | — |
| Un grupo | `group_id` | UUID del catálogo |

`group_id` filtra por el grupo del **cliente** o del **lote** (mismo catálogo).

No usar `customer_group_id`. En contratos el param es **`group_id`**.

---

## Endpoints — mismos params

Lista, stats y Excel comparten filtros. Al cambiar cualquiera: **lista + stats en paralelo**. Excel con los mismos params.

| Uso | Ruta |
|-----|------|
| Tabla | `GET /api/tenant/contracts` |
| Cards | `GET /api/tenant/contracts/stats` |
| Excel | `GET /api/tenant/contracts/export/excel` |

Query params (todos opcionales):

| Param | Tipo | Notas |
|-------|------|--------|
| `group_id` | uuid | Grupo de cliente |
| `search` | string | Número, cliente, lote, clave catastral |
| `status` | string | `activo` \| `completado` \| `cancelado` \| `suspendido` |
| `hasOverdue` | `true` | Solo con pagos vencidos. Omitir si no aplica |
| `downPaymentFinanced` | `true` | Solo con enganche financiado. Omitir si no aplica |
| `customerId` | number | Ya existía |
| `propertyId` | uuid | Ya existía |
| `page` / `limit` | number | Solo en la lista |

```
GET /api/tenant/contracts?group_id={uuid}&page=1&limit=20
GET /api/tenant/contracts/stats?group_id={uuid}
```

Con varios filtros:

```
GET /api/tenant/contracts/stats?group_id={uuid}&status=activo&search=CONT
```

`page`/`limit` no van en stats. Stats cubren **todo** el filtro, no la página.

Permiso: `Contract:Read`.

---

## Cards — leer el GET stats, no la tabla

No sumar `data[]`. La página está cortada.

Shape (igual que ahora, más moneda):

```json
{
  "currency": "USD",
  "currencies": ["USD"],
  "total": { "count": 61, "value": 2913337.14 },
  "completed": { "count": 21, "value": 886902 },
  "pending": {
    "count": 40,
    "value": 2026435,
    "paid": 806734,
    "remaining": 1219701
  },
  "overdue": {
    "contracts_count": 16,
    "payments_count": 51,
    "value": 21995,
    "contract": { "contracts_count": 13, "payments_count": 45, "value": 18400 },
    "down_payment": { "contracts_count": 4, "payments_count": 6, "value": 3595 }
  }
}
```

| Card | Label | Valor | Sub |
|------|--------|--------|-----|
| 1 | TOTAL · Todos los contratos | `total.value` | `total.count` contratos |
| 2 | COMPLETADOS · Pagados en su totalidad | `completed.value` | `completed.count` |
| 3 | ACTIVOS · En proceso de pago | `pending.value` | Pagado `pending.paid` · Pendiente `pending.remaining` · `pending.count` |
| 4 | VENCIDOS · Con pagos atrasados | `overdue.value` (contrato + enganche) | Contratos `overdue.contracts_count` · Pagos `overdue.payments_count`. Aparte: Contrato `overdue.contract` · Enganche `overdue.down_payment` |

Montos según `currency` de cada fila / de stats (`USD` hoy). Vacío = 0 / `$0.00`. Ver `UI_CONTRACT_CURRENCY.md`.

Sin `status` en el query, `total` es activo + completado (igual que hoy). Con `status=activo`, las 4 cards quedan dentro de ese estatus (completados en 0).

---

## Relación en la fila

`customer.group` viene en el listado (`id`, `name`) si el cliente tiene grupo. Columna opcional: `customer.group?.name ?? '—'`.

**Precio Total** y **Saldo Pendiente**: badge `currency` (`USD` \| `MXN`). No `MX$`. Ver `UI_CONTRACT_CURRENCY.md`. El saldo no cambia de color.

| Campo | Uso |
|--------|-----|
| `sale_type` | `cash` \| `financed`. Badge **Contado** / **Financiado**. Con `down_payment_financed` la marca es **E + F** (hover: Enganche más financiamiento); si no, **F** |
| `payment_phase` | `down_payment` \| `contract`. Ya no es el badge del número. Sirve al siguiente pago |
| `next_payment_kind` | `down_payment` \| `contract` \| `null`. Colorea **Siguiente pago** |
| `next_payment_is_last_down_payment` | `true` si el siguiente es el último enganche activo |
| `next_payment_date` / `next_payment_amount` | Primero cuotas de enganche pendientes; si no, mensualidad |
| `overdue_payments_count` | Vencidos de contrato |
| `overdue_down_payment_count` | Vencidos de enganche |
| `has_overdue` | Cualquiera de los dos |

Excel: columnas **Tipo** (Contado / Financiado E+F / Financiado F), **Tipo Próximo Pago**, **Último Enganche**, **Vencidos Enganche**. Resumen: VENCIDOS (total) + VENCIDOS CONTRATO + VENCIDOS ENGANCHE.

---

## Qué no hacer

- Dejar las cards con el GET stats **sin** query params mientras la tabla sí está filtrada
- Calcular totals con `data[]`
- Hardcodear grupos o pegar el CRUD de Configuración (`/customer-groups`) en este dropdown
- Dropdown “Proyecto” ni `GET /tenant/property-groups` en Contratos
- Usar la palabra "tenant" en copy de UI

---

## Checklist Pollux

- [ ] Dropdown **Grupo de cliente** con `GET /tenant/customers/groups`
- [ ] `group_id` en lista, stats y Excel
- [ ] Al cambiar grupo / búsqueda / estatus / vencidos: refetch **lista + stats** juntos
- [ ] Cards leen `GET /tenant/contracts/stats?...mismos filtros` con `stats.currency` (USD)
- [ ] Precio Total / Saldo Pendiente con badge `data[].currency`
- [ ] “Todos los grupos” = no enviar `group_id`
- [ ] Skeletons en cards mientras carga; error no tumba la tabla
