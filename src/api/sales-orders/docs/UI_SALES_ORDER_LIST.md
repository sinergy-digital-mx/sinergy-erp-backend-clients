# UI — Listado de órdenes de venta (razón social + sucursal)

Contrato para Pollux. **No mostrar ni filtrar por almacén.** Una OV puede tomar inventario de varios almacenes de la misma sucursal. El listado se agrupa por **razón social** y **sucursal**.

**POS no cambia.** Crear/cobrar/surtir sigue usando `warehouse_id`. Este cambio es solo listado, detalle (header) y Excel de OV.

---

## 1. Qué quitar

| Hoy | Acción |
|-----|--------|
| Filtro dropdown **Todos los almacenes** | Eliminar |
| Columna **Almacén** (Enrejado, CIMA MXL, etc.) | Eliminar |
| Query param `warehouse_id` en listado y Excel | Dejar de enviarlo |
| Catálogo `GET /api/tenant/warehouses` para este listado | No usarlo |

---

## 2. Qué poner

| UI | Campo API | Ejemplo |
|----|-----------|---------|
| Columna **Razón social** | `razon_social` | `Madereria Zona Norte` |
| Columna **Sucursal** | `sucursal` o `billing_branch.code` | `SUCURSAL BUENOS AIRES` |
| Filtro **Razón social** | `fiscal_configuration_id` | uuid o vacío = todas |
| Filtro **Sucursal** | `billing_branch_id` | uuid o vacío = todas |

Fallback de razón social: `fiscal_configuration.razon_social`.
Si `billing_branch` es `null`, mostrar `—`.

---

## 3. Listado

```
GET /api/tenant/sales-orders
```

### Query params

| Parámetro | Tipo | Obligatorio | Default visual |
|-----------|------|-------------|----------------|
| `fiscal_configuration_id` | uuid | No | Todas las razones sociales |
| `billing_branch_id` | uuid | No | Todas las sucursales |
| `search` | string | No | — |
| `general_status` | string / CSV / repetido | No | Todos los estados |
| `payment_status` | `Pendiente` \| `Pagado` | No | Todos |
| `is_credit` | `true` \| `false` | No | Todas |
| `sales_order_type` | `POS` \| `MANUAL` | No | Todos |
| `created_from` / `created_to` | date ISO | No | — |
| `page` | number | No | 1 |
| `limit` | number | No | 20 |
| `sort_by` | `created_at` \| `folio` \| `total` | No | `created_at` |
| `sort_order` | `ASC` \| `DESC` | No | `DESC` |

**Todas = no enviar el param.** No mandar `null` como string `"null"`.

```
GET /api/tenant/sales-orders?page=1&limit=20
GET /api/tenant/sales-orders?fiscal_configuration_id={uuid}
GET /api/tenant/sales-orders?fiscal_configuration_id={uuid}&billing_branch_id={uuid}
GET /api/tenant/sales-orders?billing_branch_id={uuid}
```

### Respuesta

```json
{
  "data": [
    {
      "id": "9b171377-9138-4d1e-90d5-bf8a94a77442",
      "folio": "OSV-000020",
      "general_status": "Creada",
      "payment_status": "Pendiente",
      "total": "13.92",
      "created_at": "2026-07-14 23:04:57",
      "customer": {
        "id": 14177,
        "name": "TIENDAS SORIANA"
      },
      "razon_social": "Madereria Zona Norte",
      "fiscal_configuration_id": "2a89da42-ba73-4247-9bf2-ac1c0d7ba23e",
      "fiscal_configuration": {
        "id": "2a89da42-ba73-4247-9bf2-ac1c0d7ba23e",
        "razon_social": "Madereria Zona Norte",
        "rfc": "XXX010101XXX"
      },
      "billing_branch_id": "f271bec8-2623-41d2-9f2e-eebd630cd1e8",
      "billing_branch": {
        "id": "f271bec8-2623-41d2-9f2e-eebd630cd1e8",
        "code": "SUCURSAL BUENOS AIRES",
        "address": "Blvd. Cuauhtémoc...",
        "city": "Tijuana",
        "state": "Baja California",
        "country": "México",
        "postal_code": "22000"
      }
    }
  ],
  "total": 21,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

**No viene `warehouse`.** Puede seguir `warehouse_id` (uuid interno). No usarlo en UI.

### Columnas de tabla

| Columna | Binding |
|---------|---------|
| Folio | `folio` |
| Cliente | `customer.company_name` o `customer.name` + `customer.lastname` |
| Razón social | `razon_social` |
| Sucursal | `sucursal` o `billing_branch?.code ?? '—'` |
| Estado | `general_status` |
| Total | `total` |
| Pago | `payment_status` + chip **Crédito** si `is_credit` |
| Fecha | `created_at` |

---

## 4. Combos de filtros

### Razón social

```
GET /api/tenant/fiscal-configurations?status=active&limit=100
```

Label: `data[i].razon_social`  
Value: `data[i].id`  
Opción extra: `{ value: null, label: 'Todas las razones sociales' }`

### Sucursal (recomendado: filtrada por razón)

Si hay razón seleccionada:

```
GET /api/tenant/fiscal-configurations/{fiscalConfigId}/branches
```

Label: `code` (ej. `SUCURSAL BUENOS AIRES`)  
Value: `id`

Si **no** hay razón (todas):

```
GET /api/tenant/billing/branches
```

Label: `code` o `display_name` (`RFC - SUCURSAL BUENOS AIRES`)  
Value: `id`

Opción extra: `{ value: null, label: 'Todas las sucursales' }`

### Cascada

1. Cambia razón social → resetear `billing_branch_id` a `null` y recargar sucursales de esa razón.
2. Cambia a “Todas las razones” → resetear sucursal y cargar `GET /api/tenant/billing/branches` (o dejar sucursal en todas).
3. Sucursal sola (sin razón) es válido: filtra esa sucursal en cualquier razón.

---

## 5. Detalle OV — drawer `#OSV-000020`

```
GET /api/tenant/sales-orders/:id
```

Usar **`data.header`**.

Folio público del ticket (`MZN-CTR-INV-000033`): `src/api/sales-orders/docs/UI_SALES_ORDER_PUBLIC_FOLIO.md`.

### Cards de arriba (hoy vs nuevo)

| Card hoy | Card nuevo | Título UI | Texto grande | A qué pertenece (ids) |
|----------|------------|-----------|--------------|------------------------|
| CLIENTE | CLIENTE | Cliente | `header.customer_display_name` | `header.customer.id` |
| **ALMACÉN** (N/A) | **SUCURSAL** | Sucursal | `header.sucursal` o `header.billing_branch.code` | `header.billing_branch_id` / `header.billing_branch.id` |
| **FISCAL** | **RAZÓN SOCIAL** | Razón social | `header.razon_social` | `header.fiscal_configuration_id` / `header.fiscal_configuration.id` |

No mostrar card de Almacén. `warehouse` no viene en `header` (por eso hoy sale N/A).

### Binding

```ts
// Card 1 — Cliente (sin cambio)
title: 'Cliente'
value: header.customer_display_name
id: header.customer?.id

// Card 2 — Sucursal (reemplaza Almacén)
title: 'Sucursal'
value: header.sucursal ?? header.billing_branch?.code ?? '—'
id: header.billing_branch_id
// opcional: ciudad
subtitle: [header.billing_branch?.city, header.billing_branch?.state].filter(Boolean).join(', ')

// Card 3 — Razón social (antes "Fiscal")
title: 'Razón social'
value: header.razon_social ?? header.fiscal_configuration?.razon_social ?? '—'
id: header.fiscal_configuration_id
subtitle: header.fiscal_configuration?.rfc  // opcional
```

### Shape de `data.header` (campos de ubicación)

```json
{
  "razon_social": "Madereria Zona Norte",
  "sucursal": "SUCURSAL BUENOS AIRES",
  "fiscal_configuration_id": "2a89da42-ba73-4247-9bf2-ac1c0d7ba23e",
  "fiscal_configuration": {
    "id": "2a89da42-ba73-4247-9bf2-ac1c0d7ba23e",
    "razon_social": "Madereria Zona Norte",
    "rfc": "XXX010101XXX"
  },
  "billing_branch_id": "f271bec8-2623-41d2-9f2e-eebd630cd1e8",
  "billing_branch": {
    "id": "f271bec8-2623-41d2-9f2e-eebd630cd1e8",
    "code": "SUCURSAL BUENOS AIRES",
    "address": "Blvd. Cuauhtémoc...",
    "city": "Tijuana",
    "state": "Baja California",
    "country": "México",
    "postal_code": "22000"
  }
}
```

Si el chevron de la card abre ficha:

- Razón social → detalle de `fiscal_configuration_id`
- Sucursal → detalle de `billing_branch_id` (sucursal de esa razón)

---

## 6. Excel (mismos filtros)

| Tipo | Ruta |
|------|------|
| Cabecera | `GET /api/tenant/sales-orders/export/excel/headers` |
| Detalle | `GET /api/tenant/sales-orders/export/excel/details` |

Reutilizar filtros del listado. **No** `warehouse_id`.

```ts
const filters = {
  search: listFilters.search,
  general_status: listFilters.general_status,
  payment_status: listFilters.payment_status,
  sales_order_type: listFilters.sales_order_type,
  fiscal_configuration_id: listFilters.fiscal_configuration_id || undefined,
  billing_branch_id: listFilters.billing_branch_id || undefined,
  customer_id: listFilters.customer_id,
  created_from: listFilters.created_from,
  created_to: listFilters.created_to,
};
```

Si `fiscal_configuration_id` / `billing_branch_id` son `null` o `''`, **no** los pongas en el query.

Columnas nuevas en el xlsx:

- Cabecera: **Razón social**, **Sucursal** (ya no Almacén)
- Detalle: **Razón social**, **Sucursal** (después de Cliente)

Detalle sigue exigiendo `created_from` + `created_to`.

---

## 7. POS — no tocar

| Flujo | Sigue igual |
|-------|-------------|
| Crear venta POS | `warehouse_id` + `fiscal_configuration_id` en el body |
| Cobranza | Sucursal de la terminal |
| Inventario / selección | Almacenes de la sucursal |

Este cambio **no** aplica a Punto de Venta.

---

## 8. Checklist Pollux

- [ ] Quitar filtro Almacén
- [ ] Quitar columna Almacén
- [ ] Combo Razón social (todas = no enviar param)
- [ ] Combo Sucursal (todas = no enviar param)
- [ ] Cascada: al cambiar razón, resetear sucursal
- [ ] Columnas Razón social + Sucursal
- [ ] Excel manda `fiscal_configuration_id` y `billing_branch_id`
- [ ] Detalle: card **Sucursal** (antes Almacén) con `header.sucursal`
- [ ] Detalle: card **Razón social** (antes Fiscal) con `header.razon_social`
- [ ] Detalle: guardar ids `fiscal_configuration_id` y `billing_branch_id`
- [ ] POS sin cambios
