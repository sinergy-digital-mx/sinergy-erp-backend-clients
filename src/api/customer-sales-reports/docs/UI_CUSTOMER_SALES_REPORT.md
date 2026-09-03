# UI — Reporte de ventas clientes

Módulo **genérico**. Se habilita por organización. Hoy solo está activo en Madereria.

Top de clientes con **ventas** (número de órdenes surtidas) y **total comprado** (`SUM(so.total)`). Solo órdenes **Surtida**.

---

## 1. Header

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Reporte de ventas clientes                                 [Excel ↓]    │
│  Top de clientes por sucursal / razón social · Mes · 01/09/2026 — …     │
│                                                                          │
│  Razón social ▼   Sucursal ▼              Hoy  Semana  Mes  Año  Rango   │
└──────────────────────────────────────────────────────────────────────────┘
```

- Título fijo: **Reporte de ventas clientes**.
- Subtítulo: `view_label` + `filters_applied.period_label`.
- Periodo: el mismo `app-report-period-selector` del reporte de ventas. `Mes` / `Semana` / `Año` / `Hoy` **no** mandan `date_from`/`date_to`. Solo **Rango**.
- Cascada: razón social → sucursal. Cambiar razón resetea sucursal.
- **Descargar Excel** a la derecha. Mismos query params que el GET (el Excel trae hasta 2000 filas).

---

## 2. Endpoints

```
GET /api/tenant/customer-sales-reports
GET /api/tenant/customer-sales-reports/export/excel
```

| Param | Valores | Default |
|-------|---------|---------|
| `fiscal_configuration_id` | uuid | todas |
| `billing_branch_id` | uuid | todas |
| `period` | `today` `week` `month` `year` `range` | `month` |
| `date_from` / `date_to` | ISO | solo si `period=range` |
| `limit` | 1–200 | 50 (solo GET) |

Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Filename `reporte-ventas-clientes-YYYY-MM-DD.xlsx`.

---

## 3. Cards KPI

| Card | Binding |
|------|---------|
| **Clientes** | `summary.customers_count` |
| **Ventas** | `summary.total_sales_count` |
| **Total comprado** | `summary.total_amount` |
| **Ticket promedio** | `summary.average_ticket` |

Chip si `summary.top`: `Líder: {top.name} · {top.amount}`.

Barras por sucursal si `summary.branches.length > 1`.

---

## 4. Tabla

| Columna | Binding |
|---------|---------|
| # | `rank` |
| Cliente | `customer_name` |
| RFC | `customer_rfc` |
| Ventas | `total_sales_count` |
| Total comprado | `total_purchased` |
| Ticket | `average_ticket` |

Orden del API: total comprado desc.

---

## 5. Permisos

`customer_sales_report:ViewMenu` (menú) y `customer_sales_report:Read` (GET y Excel).
