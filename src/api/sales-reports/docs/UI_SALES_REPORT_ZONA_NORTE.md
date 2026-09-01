# UI — Reporte de ventas (vendedor vs comisionado)

Un solo módulo, **dos vistas** con un toggle. No dupliques pantallas.

| Vista | Query `view` | Agrupa por | Qué responde |
|-------|----------------|------------|----------------|
| **Ventas** (default) | `sales` | Quien **vendió** (`seller_user_id`) | Volumen, ticket, meta |
| **Comisiones** | `commissions` | Quien **comisiona** (`assigned_seller_user_id`) | Comisión $ y avance vs meta |

En la OV son personas distintas: `src/api/sales-orders/docs/UI_SALES_ORDER_SELLER.md`.

---

## 1. Header profesional

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Reporte de ventas                                          [Excel ↓]    │
│  Zona Norte · Mes · 01/09/2026 — 01/09/2026                             │
│                                                                          │
│  [ Ventas ]  [ Comisiones ]          Hoy  Semana  Mes  Año  Rango        │
│  Razón social ▼   Sucursal ▼         Inicio ▢     Fin ▢                  │
└──────────────────────────────────────────────────────────────────────────┘
```

- Título fijo: **Reporte de ventas**. El subtítulo sale de `view_label` (`Ventas por vendedor` / `Comisiones por comisionado`) + `filters_applied.period_label`.
- Toggle **segmentado** (pills), no tabs del menú. Al cambiar `view`, mismo periodo y mismos combos; recargar.
- **Descargar Excel** a la derecha del título. Mismos query params que el GET. Spinner mientras baja.
- Periodo: **un solo** chip activo. `Mes` / `Semana` / `Año` / `Hoy` **no** mandan `date_from`/`date_to`. Solo **Rango** muestra fechas y manda `period=range`.
- Cascada: razón social → sucursal (igual que OV). Cambiar razón resetea sucursal.

Paleta: vista Ventas verde (`#1B7F5E`). Vista Comisiones púrpura (`#6B4C9A`). El chip activo del toggle usa ese color.

---

## 2. Endpoints

```
GET /api/tenant/sales-reports/by-seller
GET /api/tenant/sales-reports/by-seller/export/excel
GET /api/tenant/sales-reports/by-seller/orders
```

### Query (los tres)

| Param | Valores | Default |
|-------|---------|---------|
| `view` | `sales` \| `commissions` | `sales` |
| `fiscal_configuration_id` | uuid | todas |
| `billing_branch_id` | uuid | todas |
| `period` | `today` `week` `month` `year` `range` | `month` |
| `date_from` / `date_to` | ISO | solo si `period=range` |

**No enviar** `commission_rate`. El % sale de Metas (`GET /api/tenant/goals/settings`).

```
GET /api/tenant/sales-reports/by-seller?view=sales&period=month
GET /api/tenant/sales-reports/by-seller?view=commissions&fiscal_configuration_id={uuid}&billing_branch_id={uuid}&period=range&date_from=2026-09-01&date_to=2026-09-30
GET /api/tenant/sales-reports/by-seller/export/excel?view=commissions&period=month
```

Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Filename `reporte-ventas-YYYY-MM-DD.xlsx` o `reporte-comisiones-...`.

---

## 3. Cards KPI

Usar `summary.*`. Cuatro cards en fila (en móvil 2×2).

### Vista Ventas

| Card | Binding | Color |
|------|---------|-------|
| **Vendedores** | `people_count` + `people_label` | púrpura |
| **Ventas** | `total_sales_count` | verde |
| **Monto** | `total_amount` moneda | ámbar |
| **Ticket promedio** | `average_ticket` moneda | slate |

Chip extra si `summary.top`: `Líder: {top.name} · {top.amount}`.

### Vista Comisiones

| Card | Binding |
|------|---------|
| **Comisionados** | `people_count` |
| **Ventas** | `total_sales_count` |
| **Monto** | `total_amount` |
| **Comisión** | `total_commission` + `commission_rate`% |

En Ventas **no** pintar columna ni card de comisión (`commission_amount` / `total_commission` vienen `null`).

`summary.branches[]` (sucursal, ventas, monto): mini barras o sparkline bajo las cards si hay **más de una** sucursal. Si hay una sola, no hace falta.

---

## 4. Meta

Bloque `goals` igual que antes. En **Comisiones** es protagonista (progress gorda). En **Ventas** se queda como contexto (barra compacta o el mismo banner).

Sin metas: banner muted con `goals.message` (`No hay metas activas para 09/2026`). El reporte **sigue** mostrando ventas.

Con `goals.branch_goal`:

```
Meta sucursal — $82.55 / $100,000  (0.08%)
[█░░░░░░░░░░░░░░░░░░░]
```

`metric_type = sales_count` → `# ventas` no `$`.

---

## 5. Tabla

Filas: `rows[]`. Orden del backend (Comisiones: competitividad; Ventas: monto).

Label de la persona: `{seller_name} ({seller_pos_user_code})` → `Jose Rivera (1974)`. Click → modal.

### Columnas Ventas (`view=sales`)

| Columna | Binding |
|---------|---------|
| Sucursal | `branch_name` + avatar `branch_initials` |
| Vendedor | `seller_name` + código (clickable) |
| Ventas | `total_sales_count` |
| Monto | `amount_sold` |
| Ticket | `average_ticket` |
| Meta | `goal` progress si `has_goal` |

### Columnas Comisiones (`view=commissions`)

| Columna | Binding |
|---------|---------|
| Sucursal | `branch_name` |
| Comisionado | `seller_name` + código (clickable) |
| Ventas | `total_sales_count` |
| Monto | `amount_sold` |
| Comisión | `{commission_percentage}%` · `{commission_amount}` |
| Meta | `goal` progress |

Empty state: ilustración + `Sin {view_label.toLowerCase()} en este periodo.` CTA: “Prueba otro rango” o “Todas las sucursales”.

---

## 6. Drill-down (modal)

```
GET /api/tenant/sales-reports/by-seller/orders
  ?view={view activo}
  &seller_id={rows[i].seller_id}
  &billing_branch_id={rows[i].billing_branch_id}
  &period=...
```

**Mismo `view`** que el reporte. Si no, mezclas vendedor con comisionado.

Título: `{seller.role_label} — {seller.name} ({seller.pos_user_code})`

| Columna | Binding |
|---------|---------|
| Folio | `folio` → detalle OV |
| Fecha | `created_at` |
| Cliente | `customer_company_name` / `customer_person_name` |
| Vendedor | `seller_name` |
| Comisionado | `assigned_seller_name` |
| Sucursal | `branch_name` |
| Total | `total` |
| Pago | `payment_status` |

En Comisiones, resaltar **Comisionado**. En Ventas, resaltar **Vendedor**.

---

## 7. Shape (campos nuevos)

```json
{
  "view": "sales",
  "view_label": "Ventas por vendedor",
  "summary": {
    "people_count": 3,
    "people_label": "Vendedores",
    "total_sales_count": 12,
    "total_amount": 15420.5,
    "average_ticket": 1285.04,
    "total_commission": null,
    "commission_rate": null,
    "top": { "id": "...", "name": "Jose Rivera", "pos_user_code": 1974, "amount": 8200, "sales_count": 5 },
    "branches": [{ "billing_branch_id": "...", "branch_name": "Tijuana (CENTRO)", "sales_count": 8, "amount": 10000 }]
  },
  "filters_applied": {
    "view": "sales",
    "period": "month",
    "period_label": "Mes · 01/09/2026 — 01/09/2026",
    "commission_rate": null
  },
  "goals": { "has_active_goals": false, "message": "No hay metas activas para 09/2026" },
  "rows": []
}
```

`total_sellers` sigue existiendo (= `people_count`) por compat.

---

## 8. Checklist Pollux

- [ ] Toggle **Ventas / Comisiones** (`view=sales` \| `commissions`)
- [ ] Default **Ventas**. Comisiones no es la home del reporte
- [ ] Subtítulo = `view_label` + `period_label`
- [ ] **Descargar Excel** → `GET .../by-seller/export/excel` con los mismos params
- [ ] Un solo chip de periodo; Rango es el único que manda fechas
- [ ] Cascada razón → sucursal
- [ ] Cards: 4 KPIs según vista; comisión **solo** en Comisiones
- [ ] Chip líder `summary.top` si hay datos
- [ ] Mini barras `summary.branches` si hay 2+ sucursales
- [ ] Columna persona: Vendedor vs Comisionado
- [ ] Click fila → orders con el **mismo** `view`
- [ ] Modal muestra las dos personas (vendedor y comisionado)
- [ ] Banner metas; progress gorda en Comisiones
- [ ] Empty state con copy de la vista activa
- [ ] Paleta verde (ventas) / púrpura (comisiones)
