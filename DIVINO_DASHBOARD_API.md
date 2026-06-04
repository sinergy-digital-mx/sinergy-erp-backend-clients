# Divino Dashboard API

**Tenant exclusivo:** `54481b63-5516-458d-9bb3-d4e5cb028864`  
**Módulo:** `divino_dashboard`  
**Permisos:** `DivinoDashboard:Read`, menú `divino_dashboard:ViewMenu`

Base: `/api/tenant/divino-dashboard`

## Filtro de periodo (todos los endpoints)

| Param | Tipo | Descripción |
|-------|------|-------------|
| `scope` | `period` \| `all_time` | Default `period`. `all_time` = histórico completo (sin `year`) |
| `year` | number | Requerido si `scope=period` (ej. 2026) |
| `month` | number? | 1-12. Solo con `scope=period`. Si se omite = año completo |

Modo UI:
- **All time** → `?scope=all_time` (no enviar `year`)
- **Mes** → `?scope=period&year=2026&month=6`
- **Año** → `?scope=period&year=2026`

### All time — respuesta extra en `/summary`

Incluye `yearly_breakdown[]`: mismos KPIs **por año** (`year` + todos los campos de `kpis`) para gráficas de tendencia.

`GET /revenue-series?scope=all_time` devuelve una barra por año (`bucket`: `"2024"`, `"2025"`, …); ignora `period` M/Q/S.

---

## GET `/summary`

KPIs generales del periodo.

```http
GET /api/tenant/divino-dashboard/summary?year=2026&month=3
GET /api/tenant/divino-dashboard/summary?scope=all_time
```

**Response `kpis`:**

| Campo | Descripción |
|-------|-------------|
| `avg_price_per_m2` | Precio promedio cierre / m² |
| `total_sold_amount` | Total vendido ($) |
| `total_sold_m2` | Total vendido (m²) |
| `lots_sold` | Lotes vendidos |
| `avg_list_price` | Precio lista promedio |
| `avg_close_price` | Precio cierre promedio |
| `list_vs_close_diff_amount` | Cierre − lista ($) |
| `list_vs_close_diff_pct` | % diferencia lista vs cierre |
| `max_price_per_m2` / `min_price_per_m2` | Rango $/m² |
| `cash_pct` / `financed_pct` | % contado vs financiado |
| `avg_down_payment` | Enganche promedio (financiados) |
| `avg_monthly_payment` | Mensualidad promedio (financiados) |

**Lista vs cierre:** `list_price` en contrato (snapshot del lote al vender) vs `total_price` (cierre).

---

## GET `/sellers`

Tabla vendedores (brokers).

```http
GET /api/tenant/divino-dashboard/sellers?year=2026&month=3
```

**`rows[]`:** `seller_id`, `seller_name`, `lots_sold`, `revenue`, `m2_sold`, `tours_count` (reuniones `meeting` completadas en leads).

---

## GET `/lead-origins`

Ventas por origen (`lead_group` del contrato o del lead vinculado).

```http
GET /api/tenant/divino-dashboard/lead-origins?year=2026
```

**`rows[]`:** `origin`, `count`, `revenue`, `pct_of_sales`

---

## GET `/revenue-series`

Serie temporal de revenue.

```http
GET /api/tenant/divino-dashboard/revenue-series?year=2026&period=quarterly
```

`period`: `monthly` | `quarterly` | `semiannual` | `annual`

---

## Contrato – campos nuevos

| Campo | Uso |
|-------|-----|
| `list_price` | Precio lista al vender (default: `property.list_price` o `property.total_price`) |
| `lead_id` | Lead asociado (opcional) |
| `lead_group_id` | Origen / grupo (opcional, `lead_groups` del tenant) |

**Property:** `list_price` opcional; si null usa `total_price`.

---

## Setup

```bash
npm run migration:run
npm run seed:divino-dashboard
```

Sidebar: módulo `divino_dashboard`, permiso `ViewMenu`.
