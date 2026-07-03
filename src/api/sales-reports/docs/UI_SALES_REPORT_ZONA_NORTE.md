# UI — Reporte de Ventas Zona Norte

## Comisión (configurable por tenant)

La comisión **no se hardcodea en el reporte**. Se configura en **Metas**:

```
GET  /api/tenant/goals/settings     → { commission_rate: 1 }
PATCH /api/tenant/goals/settings    → { commission_rate: 1.5 }
```

El reporte la lee solo:

```
GET /api/tenant/sales-reports/by-seller
  ?fiscal_configuration_id=...
  &billing_branch_id=...
  &period=range
  &date_from=2026-06-01
  &date_to=2026-06-30
```

**No enviar** `commission_rate` en el query (si se envía, overridea la config del tenant — evitar en producción).

| Campo respuesta | Uso UI |
|-----------------|--------|
| `filters_applied.commission_rate` | % aplicado (viene de Metas) |
| `rows[i].commission_percentage` | Mismo % |
| `rows[i].commission_amount` | Monto comisión (`$X`) |

Default si nunca configuraron: **1%**.

---

## Vendedor = código POS (`seller_user_id`)

Las ventas se agrupan por el vendedor que capturó su código en POS (`seller_user_id`), no por la terminal.

| Campo | Descripción |
|-------|-------------|
| `seller_id` | UUID del vendedor |
| `seller_name` | Nombre |
| `seller_pos_user_code` | Código numérico POS (ej. 140696) |

Mostrar: `Vendedor Perez (140696)`.

---

## Metas y progress bars

La misma respuesta del reporte incluye bloque `goals` y progress por fila.

### Sin metas configuradas

```json
{
  "goals": {
    "has_active_goals": false,
    "message": "No hay metas activas para 06/2026",
    "branch_goal": null,
    "user_role_goal": null
  }
}
```

UI: mostrar banner informativo; el reporte de ventas sigue igual.

### Con meta de sucursal (arriba)

```json
"goals": {
  "has_active_goals": true,
  "message": null,
  "branch_goal": {
    "goal_id": "...",
    "billing_branch_id": "...",
    "branch_name": "Tijuana (CIMA...)",
    "metric_type": "amount",
    "target_value": 100000,
    "current_value": 82.55,
    "progress_percentage": 0.08
  },
  "user_role_goal": {
    "goal_id": "...",
    "role_name": "Vendedor",
    "metric_type": "sales_count",
    "target_value": 50
  }
}
```

**Progress bar superior (meta sucursal):**

```
Meta sucursal — $82.55 / $100,000  (0.08%)
[█░░░░░░░░░░░░░░░░░░░]
```

Si `metric_type = sales_count` → mostrar `# ventas` en lugar de `$`.

### Progress por vendedor (tabla, orden competitividad)

Cada fila:

```json
"goal": {
  "has_goal": true,
  "metric_type": "sales_count",
  "target_value": 50,
  "current_value": 6,
  "progress_percentage": 12
}
```

Las filas ya vienen **ordenadas por `progress_percentage` DESC** (competitividad). Sin meta individual, orden por monto.

```
VENDEDOR          TOTAL  COMISIÓN (1%)  MONTO    META
Vendedor Perez    6      $0.83          $82.55   [██░░░░] 12%
```

---

## Layout sugerido

```
┌─────────────────────────────────────────────────────┐
│ Meta sucursal (si goals.branch_goal)                │
│ [████████░░░░░░░░] 45% — $45,000 / $100,000         │
│ o banner: goals.message si !has_active_goals        │
├─────────────────────────────────────────────────────┤
│ Cards: Vendedores | Ventas | Monto total            │
├─────────────────────────────────────────────────────┤
│ Tabla ordenada por competitividad                   │
│ ... progress bar por fila (rows[i].goal)            │
└─────────────────────────────────────────────────────┘
```

Seleccionar **una sucursal** para ver la meta de sucursal arriba. Con “Todas” solo se muestra meta de sucursal si hay exactamente una meta branch activa en el periodo.

---

## Click en vendedor → sus ventas

Al hacer click en el nombre del vendedor (o en la fila), abrir modal con las órdenes de ese vendedor en el mismo periodo/filtros del reporte.

```http
GET /api/tenant/sales-reports/by-seller/orders
  ?seller_id={rows[i].seller_id}
  &billing_branch_id={rows[i].billing_branch_id}
  &fiscal_configuration_id=...   // mismos filtros del reporte
  &period=range
  &date_from=2026-06-01
  &date_to=2026-06-30
  &page=1&limit=50
```

| Query | Origen |
|-------|--------|
| `seller_id` | `rows[i].seller_id` (**obligatorio**) |
| `billing_branch_id` | `rows[i].billing_branch_id` (recomendado, para no mezclar sucursales) |
| resto | mismos filtros activos del reporte |

### Respuesta

```json
{
  "seller": {
    "id": "uuid",
    "name": "Vendedor Perez",
    "pos_user_code": 140696
  },
  "summary": {
    "total_sales_count": 6,
    "amount_sold": 82.55
  },
  "data": [
    {
      "id": "uuid-orden",
      "folio": "OSV-000010",
      "created_at": "2026-06-25T...",
      "total": 12.95,
      "payment_status": "Pagado",
      "customer_company_name": "Sinergy",
      "customer_person_name": "Rodolfo Rodriguez",
      "branch_name": "Tijuana (...)"
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Modal UI

```
┌─────────────────────────────────────────────────────────┐
│ Ventas — Vendedor Perez (140696)                   ✕   │
│ 6 ventas · $82.55 en el periodo                         │
├─────────────────────────────────────────────────────────┤
│ FOLIO       FECHA        CLIENTE           TOTAL  PAGO │
│ OSV-000010  25 jun 2026  Sinergy / Rodolfo $12.95 Pagado│
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

- Click en **folio** → detalle existente `GET /tenant/sales-orders/{id}`.
- Cliente en 2 líneas: `customer_company_name` / `customer_person_name`.

```typescript
async openSellerOrders(row: ReportRow) {
  const params = new URLSearchParams({
    seller_id: row.seller_id,
    billing_branch_id: row.billing_branch_id,
    period: this.period,
    page: '1',
    limit: '50',
  });
  if (this.fiscalConfigurationId) {
    params.set('fiscal_configuration_id', this.fiscalConfigurationId);
  }
  if (this.period === 'range') {
    params.set('date_from', this.dateFrom);
    params.set('date_to', this.dateTo);
  }
  const detail = await api.get(`/tenant/sales-reports/by-seller/orders?${params}`);
  // abrir modal con detail.data
}
```

---

## Checklist

- [ ] No enviar `commission_rate` (usa config de Metas)
- [ ] Columna comisión: `commission_percentage` + `commission_amount`
- [ ] Vendedor con `seller_name` + `seller_pos_user_code` (**clickable**)
- [ ] Modal drill-down `by-seller/orders` con mismas fechas/filtros
- [ ] Click folio → detalle de orden de venta
- [ ] Banner si `!goals.has_active_goals`
- [ ] Progress bar superior con `goals.branch_goal`
- [ ] Progress bar por fila con `rows[i].goal`
- [ ] Respetar orden del backend (competitividad)
