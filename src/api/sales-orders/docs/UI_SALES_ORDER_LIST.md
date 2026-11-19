# UI — Listado de órdenes de venta (razón social + sucursal)

Contrato para Pollux. **No mostrar ni filtrar por almacén.** Una OV puede tomar inventario de varios almacenes de la misma sucursal. El listado se agrupa por **razón social** y **sucursal**.

Modal **Crear Orden de Venta:** `src/api/sales-orders/docs/UI_SALES_ORDER_CREATE.md` (razón → sucursal, sin almacén).

**POS no cambia.** Crear/cobrar/surtir sigue usando `warehouse_id`. Este listado no aplica a Punto de Venta.

## 2026-11-10 — Razón social inicial

Al abrir el listado, **Razón social** y **Sucursal** quedan en la sucursal principal del usuario. Si la URL ya trae esos filtros, se respetan. Limpiar filtros vuelve a mostrar todas.

## 2026-11-02 — Permiso ViewStats

El bloque de arriba (Por Estado, Estado de Pago y la gráfica de 12 meses) solo se pinta con `sales_orders:ViewStats`.

Sin ese permiso no se llama `GET /tenant/sales-orders/sales-trend` (403) y no se muestran las tarjetas. El listado sigue con `sales_orders:Read`.

El rol Admin lo recibe en la migración. El resto se asigna en Roles.

```bash
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-list-view-stats-permissions.ts
```

## 2026-10-19 — Búsqueda en la URL del listado

El buscador de Órdenes de Venta se escribe en el query de la pantalla, igual que razón social, sucursal y cliente: `?search=rodolfo`. Si se borra, el param se quita. Al abrir esa URL el campo queda lleno y el GET del listado manda `search`.

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
| Columna **Tipo** | `sale_scope` | `Inventario` · `Servicios` · `Productos y servicios` |
| Filtro **Razón social** | `fiscal_configuration_id` | uuid o vacío = todas |
| Filtro **Sucursal** | `billing_branch_id` | uuid o vacío = todas |
| Filtro **Tipo de orden** | `sale_scope` | `inventory` · `services` · `combined` o vacío = todas |

Fallback de razón social: `fiscal_configuration.razon_social`.
Si `billing_branch` es `null`, mostrar `—`.

---

## 2.1 Origen del cobro (POS Caja vs cobrada manual)

No es lo mismo que `sales_order_type` (cómo se **creó** la OV) ni que `payment_status` (Pagado / Pendiente).

| `collection_channel` | Label | Cuándo |
|----------------------|-------|--------|
| `pos_cobranza` | `POS Caja` | Cobro en **POS Caja** (`POST /pos/sales/:id/collect`) |
| `manual` | `Cobrada manual` | Pagos registrados en el **detalle de la OV** (`POST /sales-orders/:id/payments`) |
| `mixed` | `POS Caja + Manual` | Anticipo en el detalle y el resto en POS Caja |
| `null` | — | Sin cobro todavía (pendiente / crédito sin pagos) |

### Columna Pago — no agregar columna nueva

Dentro de **Pago**, debajo o al lado de Pagado/Pendiente:

```
┌─────────┐  ┌──────────────┐
│ Pagado  │  │ POS Caja │
└─────────┘  └──────────────┘
  Efectivo

┌─────────┐  ┌────────────────┐
│ Pagado  │  │ Cobrada manual │
└─────────┘  └────────────────┘
  Transferencia

┌───────────┐  ┌─────────┐  ┌──────────────┐
│ Pendiente │  │ Crédito │  │ POS Caja │
└───────────┘  └─────────┘  └──────────────┘
```

| Chip | Binding | Color sugerido | Ocultar si |
|------|---------|----------------|------------|
| Pagado / Pendiente | `payment_status` | verde / rojo | nunca |
| Forma de pago | `payment_method_label` | texto, no chip | `null` → `Sin cobro` |
| Origen cobro | `collection_channel_label` | púrpura = POS Caja; gris/azul = Cobrada manual; ambos o chip combinado si `mixed` | `collection_channel` es `null` |
| Crédito | `is_credit` | púrpura | `is_credit !== true` |

No uses `sales_order_type === 'POS'` para este chip: una OV POS se puede cobrar en el detalle (queda `Cobrada manual`).

### Filtro — dropdown aparte de “Todos los pagos”

**Todos los pagos** sigue siendo `payment_status` (`Pendiente` / `Pagado`). No mezclar origen ahí.

Nuevo combo **Origen cobro**:

| UI | Query |
|----|-------|
| Todos los orígenes | no enviar `collection_channel` |
| POS Caja | `collection_channel=pos_cobranza` |
| Cobrada manual | `collection_channel=manual` |
| POS Caja + Manual | `collection_channel=mixed` |

```
GET /api/tenant/sales-orders?collection_channel=pos_cobranza
GET /api/tenant/sales-orders?payment_status=Pagado&collection_channel=manual
```

Contrato de pagos: `UI_SALES_ORDER_PAYMENTS.md`.

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
| `collection_channel` | `pos_cobranza` \| `manual` \| `mixed` | No | Todos los orígenes |
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
      "payment_method": "mixed",
      "payment_method_label": "Mixto",
      "payment_breakdown_label": "Efectivo + Tarjeta",
      "collection_channel": "pos_cobranza",
      "collection_channel_label": "POS Caja",
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
| Pago | `payment_status` + `payment_method_label` (`Efectivo`, `Mixto`, `Tarjeta`…) + chip **origen cobro** (`collection_channel_label`) + chip **Crédito** si `is_credit` |
| Fecha | `created_at` |

---

## 4. Combos de filtros

### Barra vs modal

No meter todos los filtros en una sola fila. La barra queda así:

| Afuera | Modal (control central, mismos valores) |
|--------|-----------------------------------------|
| Búsqueda por folio | Búsqueda |
| **Razón social** | Razón social |
| **Sucursal** | Sucursal |
| | Fecha, estado, tipo (`sale_scope`), pago, origen cobro, crédito |

El modal repite los de la barra: si eliges razón afuera, sale seleccionada adentro, y al revés. Cotizaciones: afuera folio + razón + sucursal; adentro también esos más fecha, estado y tipo POS/Manual. El badge cuenta solo los extras.

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

Orden visual: **Razón social → Sucursal → Cliente**.

| # | Card | Título UI | Texto grande | A qué pertenece (ids) |
|---|------|-----------|--------------|------------------------|
| 1 | **RAZÓN SOCIAL** | Razón social | `header.razon_social` | `header.fiscal_configuration_id` / `header.fiscal_configuration.id` |
| 2 | **SUCURSAL** | Sucursal | `header.sucursal` o `header.billing_branch.code` | `header.billing_branch_id` / `header.billing_branch.id` |
| 3 | CLIENTE | Cliente | `header.customer_display_name` | `header.customer.id` |

No mostrar card de Almacén. `warehouse` no viene en `header`.

En **FECHAS**, junto a Estado de pago, pintar **cómo se pagó**:

| UI | Campo |
|----|--------|
| Estado de pago | `header.payment_status` (`Pagado` / `Pendiente`) |
| Origen cobro | `header.collection_channel_label` (`POS Caja` / `Cobrada manual` / `POS Caja + Manual`) |
| Forma de pago | `header.payment_method_label` (`Efectivo`, `Tarjeta`, `Transferencia`, `Mixto`, `Crédito`) |
| Detalle mixto | `header.payment_breakdown_label` (`Efectivo + Tarjeta`) |
| Montos | `header.payment_display.lines` |

Si `payment_method_label` es null → `Sin cobro`. Contrato completo: `UI_SALES_ORDER_PAYMENTS.md`.

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
  "collection_channel": "pos_cobranza",
  "collection_channel_label": "POS Caja",
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
  collection_channel: listFilters.collection_channel,
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

- Cabecera: **Razón social**, **Sucursal**, **Origen cobro** (`POS Caja` / `Cobrada manual`)
- Detalle: **Razón social**, **Sucursal**, **Origen cobro** (después de Pago)

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
- [ ] Detalle: cards en orden **Razón social → Sucursal → Cliente**
- [ ] Detalle: card **Razón social** con `header.razon_social`
- [ ] Detalle: card **Sucursal** con `header.sucursal`
- [ ] Detalle: guardar ids `fiscal_configuration_id` y `billing_branch_id`
- [ ] Detalle: **Vendedor** vs **Comisionado** — `UI_SALES_ORDER_SELLER.md`
- [ ] Detalle y listado: **Forma de pago** (efectivo / mixto / tarjeta…) — `UI_SALES_ORDER_PAYMENTS.md`
- [ ] Columna Pago: chip **POS Caja** / **Cobrada manual** con `collection_channel_label`
- [ ] Filtro **Origen cobro** (`collection_channel`). No meterlo en “Todos los pagos”
- [ ] Excel: columna **Origen cobro** y columnas de factura CFDI — `UI_SALES_ORDER_EXPORT.md`
- [ ] Crear OV: ver `UI_SALES_ORDER_CREATE.md`
- [ ] POS sin cambios
- [ ] Fechas GET: `created_at` / `collected_at` UTC→local; `delivery_date` / `payment_date` calendario

---

## Fechas GET

Mismo contrato en OC, OV, inventario, historiales y POS.

| Valor API | Cómo pintar |
|-----------|-------------|
| `YYYY-MM-DD` o medianoche UTC (`T00:00:00Z`) | Día de calendario. No desplazar por zona. |
| `YYYY-MM-DD HH:mm:ss` sin zona | UTC. Pintar en hora local. |
| ISO con `Z` u offset | Instante. Pintar en hora local. |

Pollux: `apiDate` / `formatApiDate`. No usar el pipe `date` de Angular ni `new Date(valor)` directo.

---

## Gráfica de los últimos 12 meses

En el listado, arriba de la tabla, convive con las tarjetas **Por Estado** y **Estado de Pago**. Dos puntos arriba a la derecha cambian la vista cada 10 segundos. Un clic en un punto deja fija esa vista.

Permiso: `sales_orders:ViewStats`. Sin él no se pinta el bloque ni se llama este GET.

```http
GET /api/tenant/sales-orders/sales-trend
```

Mismos query params que el listado (`search`, `general_status`, `payment_status`, `fiscal_configuration_id`, `billing_branch_id`, `sale_scope`, `collection_channel`, `created_from`, `created_to`, etc.). No usa `page` ni `limit`.

Sin fechas, la ventana es móvil: mes actual en `America/Mexico_City` y 11 meses atrás. Si hay `created_from` / `created_to`, se cruzan con esa ventana. La respuesta siempre trae 12 puntos.

```json
{
  "currency": "MXN",
  "from": "2025-11",
  "to": "2026-10",
  "total": 16204.96,
  "orders_count": 293,
  "months": [
    { "month": "2025-11", "label": "nov 25", "total": 0, "orders_count": 0 }
  ]
}
```

`total` suma `sales_orders.total` de las órdenes que entran en los filtros. Incluye canceladas salvo que el filtro de estado las deje fuera.
