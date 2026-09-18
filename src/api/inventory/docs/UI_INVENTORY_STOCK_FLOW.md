# UI — Existencia de inventarios (TRK-017 + TRK-018 + valuación)

Un reporte con selector de rangos y **tres vistas**.

| Vista | Query `view` | Qué responde |
|-------|--------------|--------------|
| **Resumen** | `summary` | Producto × sucursal: piezas + montos MXN |
| **Totalizado** | `totalized` | Solo por **sucursal** (todas las de la razón social) |
| **Flujo** | `ledger` | Kardex con costo/precio unitario y montos |

## Valuación (snapshot)

Al escribir cada movimiento del kardex se congela:

| Campo | Regla |
|-------|--------|
| `unit_cost_mxn` | Preferir `real_unit_cost_mxn` del tab costo real OC; si no, vendor × T.C. aduana (USD) o vendor MXN |
| `unit_sale_price_mxn` | Venta: `unit_price − discount_unit` de la OV. Entradas: precio de lista vigente |
| `cost_balance_after_mxn` | Valor de inventario a costo corrido (producto×almacén×UOM) |

Histórico previo al deploy: `npm run backfill:stock-ledger-valuation` (aproximación con costo/lista actuales del lote).

## Endpoints

```
GET /api/tenant/inventory/stock-flow
GET /api/tenant/inventory/stock-flow/export/excel
```

Permiso: `inventory:StockFlow`.

### Query

| Param | Notas |
|-------|--------|
| `fiscal_configuration_id` | **Obligatorio** |
| `billing_branch_id` | Opcional (`Todas` = todas las de la razón) |
| `vendor_id` | Opcional. Productos con costo/catálogo del proveedor o lotes de sus OC |
| `view` | `summary` \| `totalized` \| `ledger` |
| `period` | `today` \| `week` \| `month` \| `year` \| `range` |
| `page` | Página 1-based (default `1`) |
| `limit` | Filas por página (default `50`, máx. `100`) |

Sin `warehouse_id`.

### Respuesta (paginación)

Además de `summary` / `totalized` / `ledger`:

| Campo | Notas |
|-------|--------|
| `page` / `limit` | Eco de la página pedida |
| `total` | Total de filas de la **vista activa** |
| `total_pages` | `ceil(total / limit)` |
| `total_summary_rows` / `total_totalized_rows` / `total_ledger_rows` | Compat: igual a `total` según vista |

**Excel** ignora `page`/`limit` y exporta el universo filtrado completo.

## UI Pollux

Ruta: `/inventory/existencia`

- Toggle: Resumen / **Totalizado** / Flujo
- Razón social obligatoria; sucursal opcional
- **Proveedor:** buscador/dropdown (nombre o RFC), igual que crear OC. Opción **Todos**. No usar `<select>` plano
- Paginación servidor (`page`/`limit`) con control bajo la tabla
- Tabla con **cabecera de 2 filas** (grupo → Cant / Costo / Venta); una celda = un valor
- Totalizado: pie **Total global** (o **Subtotal página** si hay más de una página)
- En **Flujo** (y producto en Resumen): nombre de producto abre detalle; folio OSV/OC/etc. abre el documento (`reference_type` + `reference_id`)
- Columnas $ en MXN; Excel incluye todas las columnas de valuación
- Fechas: `occurred_at` del flujo = UTC (naive o `Z`) → hora/día local. Fila de apertura (`is_opening`) = día de calendario del rango, no desplazar.
