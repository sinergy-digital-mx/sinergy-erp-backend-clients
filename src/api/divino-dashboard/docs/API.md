# Divino Dashboard — API

**Tenant:** `54481b63-5516-458d-9bb3-d4e5cb028864`  
**Base:** `/api/tenant/divino-dashboard`

## Query (todos los endpoints)

| Param | Tipo | Descripción |
|-------|------|-------------|
| `scope` | `period` \| `all_time` | Default `period` |
| `year` | number | Requerido si `scope=period` |
| `month` | number? | 1-12, solo con `scope=period` |

- All time: `?scope=all_time`
- Año: `?scope=period&year=2026`
- Mes: `?scope=period&year=2026&month=6`

### All time

- `/summary` incluye `yearly_breakdown[]` (KPIs por año)
- `/revenue-series` agrupa por año (`bucket`: `"2024"`, …); ignora `period` M/Q/S

## Endpoints

### `GET /summary`

KPIs: `avg_price_per_m2`, `total_sold_amount`, `total_sold_m2`, `lots_sold`, `avg_list_price`, `avg_close_price`, `list_vs_close_diff_amount`, `list_vs_close_diff_pct`, `max/min_price_per_m2`, `cash_pct`, `financed_pct`, `avg_down_payment`, `avg_monthly_payment`.

### `GET /sellers`

`rows[]`: `seller_id`, `seller_name`, `lots_sold`, `revenue`, `m2_sold`, `tours_count`.

### `GET /lead-origins`

`rows[]`: `origin`, `count`, `revenue`, `pct_of_sales`.

### `GET /revenue-series`

Query extra: `period` = `monthly` | `quarterly` | `semiannual` | `annual`.

`series[]`: `bucket`, `revenue`, `lots_sold`.

## Campos de contrato relacionados

`list_price`, `lead_id`, `lead_group_id`, `seller_id`, `contract_date`.
