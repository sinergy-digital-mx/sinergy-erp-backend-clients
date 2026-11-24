# Divino Dashboard — API

## Historial

- 2026-11-19: Contado vs financiado usa `sale_type` del contrato (no los meses de pago). `GET /summary` incluye `sale_mix[]` con los contratos del periodo para el detalle.

**Tenant:** `54481b63-5516-458d-9bb3-d4e5cb028864`  
**Base:** `/api/tenant/divino-dashboard`

## Query (todos los endpoints)

| Param | Tipo | Descripción |
|-------|------|-------------|
| `scope` | `period` \| `all_time` | Default `period` |
| `year` | number | Requerido si `scope=period` |
| `month` | number? | 1-12, solo con `scope=period` |
| `group_id` | uuid? | Grupo de proyecto del lote. Vacío = todos |

- All time: `?scope=all_time`
- Año: `?scope=period&year=2026`
- Mes: `?scope=period&year=2026&month=6`

### All time

- `/summary` incluye `yearly_breakdown[]` (KPIs por año)
- `/revenue-series` agrupa por año (`bucket`: `"2024"`, …); ignora `period` M/Q/S

## Endpoints

### `GET /summary`

KPIs: `avg_price_per_m2`, `total_sold_amount`, `total_sold_m2`, `lots_sold`, `avg_list_price`, `avg_close_price`, `list_vs_close_diff_amount`, `list_vs_close_diff_pct`, `max/min_price_per_m2`, `cash_pct`, `financed_pct`, `cash_count`, `financed_count`, `avg_down_payment`, `avg_monthly_payment`.

`cash_pct` / `financed_pct` salen de `contracts.sale_type`: `cash` es Contado aunque tenga abonos de enganche o `payment_months` en 0. Financiado con `down_payment_financed` es E + F; si no, es F. La mensualidad promedio solo cuenta financiados.

`sale_mix[]` son los mismos contratos del filtro, del más reciente al más antiguo:

| Campo | Uso |
|-------|-----|
| `contract_id` / `contract_number` | Abrir el contrato |
| `customer_name` / `property_code` | Cliente y lote |
| `contract_date` | Fecha de inicio |
| `total_price` / `currency` | Precio de cierre |
| `sale_type` | `cash` \| `financed` |
| `down_payment_financed` | true solo en E + F |
| `sale_label` / `sale_hint` | Contado, Financiado (E + F) o Financiado (F), y el texto del hover |
| `monthly_payment` / `payment_months` | 0 en contado |

### `GET /sellers`

`rows[]`: `seller_id`, `seller_name`, `lots_sold`, `revenue`, `m2_sold`, `tours_count`.

### `GET /lead-origins`

`rows[]`: `origin`, `count`, `revenue`, `pct_of_sales`.

### `GET /revenue-series`

Query extra: `period` = `monthly` | `quarterly` | `semiannual` | `annual`.

`series[]`: `bucket`, `revenue`, `lots_sold`.

## Campos de contrato relacionados

`list_price`, `lead_id`, `lead_group_id`, `seller_id`, `contract_date`.
