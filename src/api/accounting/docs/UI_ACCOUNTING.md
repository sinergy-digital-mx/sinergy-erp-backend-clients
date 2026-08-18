# UI — Cobranza / Contabilidad

Guía para Pollux: nuevo módulo **Cobranza / Contabilidad** con tres pestañas. Los filtros superiores replican el patrón del **Reporte de Ventas Zona Norte** (`zona_norte_custom_report`).

> **Estado backend:** API disponible en `/api/tenant/accounting/*`. Permiso: `Accounting:Read` + `ViewMenu`.

---

## Menú y permisos

| Item | Valor |
|------|-------|
| Módulo RBAC | `accounting` |
| Entidad | `Accounting` |
| Permisos mínimos | `ViewMenu`, `Read` |
| Ruta sugerida | `/accounting` o `/cobranza` |

---

## Layout general (aplica a las 3 tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cobranza / Contabilidad                                        │
├─────────────────────────────────────────────────────────────────┤
│  ⚠ Banner si unclosed_shift_alert (corte de día anterior)       │
├─────────────────────────────────────────────────────────────────┤
│  [ Hoy | Semana | Mes | Rango ▼ ]     Sucursal: [ dropdown ▼ ] │
│  (si Rango: [ Fecha inicio ] — [ Fecha fin ] )                  │
├─────────────────────────────────────────────────────────────────┤
│  [ Puntos de venta ] [ Cuentas por pagar ] [ Cuentas por cobrar ]│
├─────────────────────────────────────────────────────────────────┤
│  ... contenido de la tab activa ...                             │
└─────────────────────────────────────────────────────────────────┘
```

### Selector de periodo (igual que Reporte Ventas Zona Norte)

Reutilizar el **mismo componente** que ya usa el reporte de ventas Maderería Zona Norte.

| Opción UI | Query param `period` | Comportamiento |
|-----------|----------------------|----------------|
| Hoy | `today` | 00:00 – 23:59 del día actual |
| Semana | `week` | Lunes de esta semana – hoy |
| Mes | `month` | Día 1 del mes – hoy |
| Rango | `range` | Requiere `date_from` y `date_to` (ISO date `YYYY-MM-DD`) |

**Default:** `month`.

### Selector de sucursal

| Campo | Fuente |
|-------|--------|
| Dropdown | `GET /api/tenant/billing/branches` |
| Valor | `id` del branch (UUID) → enviar como `billing_branch_id` |
| Label | `display_name` o `{city} ({code})` |

**Obligatorio** en Tab 1 (Puntos de venta). Opcional en Tab 3 (Cuentas por cobrar).

Al cambiar periodo o sucursal → recargar la tab activa.

### Alerta: corte de un día anterior sin cerrar

El corte POS debe cerrarse **completo todos los días**. Si la sucursal seleccionada tiene un corte `open` con `shift_date` anterior a hoy, `GET pos-summary` incluye `unclosed_shift_alert` en la **raíz** (no depende del periodo del reporte).

**Mostrar** el banner en **todas** las tabs de Cobranza / Contabilidad, arriba de los filtros, mientras `unclosed_shift_alert !== null`.

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠  Corte del día anterior sin cerrar                           │
│  Quedó un corte abierto del 2026-08-14 sin cerrar.              │
│  Es necesario cerrarlo para continuar.                          │
│                                          [ Ir a POS Cobranza ]  │
└─────────────────────────────────────────────────────────────────┘
```

| Campo API | Uso UI |
|-----------|--------|
| `unclosed_shift_alert` | Si es `null`, no pintar banner |
| `unclosed_shift_alert.title` | Título |
| `unclosed_shift_alert.message` | Cuerpo (usar tal cual) |
| `unclosed_shift_alert.shift_date` | Fecha del corte pendiente |
| `unclosed_shift_alert.severity` | `blocking` → estilo warning/error, no info azul |
| `collection_terminal.open_daily_shift.is_previous_day` | Chip rojo en la card de corte abierto |

**CTA:** `Ir a POS Cobranza` → `/pos/cobranza` (si el usuario tiene acceso POS). Si no, el texto basta: hay que cerrar el corte en la terminal de cobranza.

El banner **no** bloquea ver CxP/CxC, pero sí indica que no se puede continuar el día POS hasta cerrar.

---

## Guía API — cómo leer la data (IMPORTANTE)

### Setup común en todas las llamadas

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

Base URL: `/api/tenant/accounting/...`

**Permiso requerido:** el usuario debe tener `Accounting:Read` asignado en su rol (correr migración + asignar permiso).

### Flujo de carga recomendado

```
1. GET /api/tenant/billing/branches          → llenar dropdown sucursal
2. Usuario elige sucursal + periodo
3. Según tab activa, llamar el endpoint correspondiente (ver abajo)
4. Leer los paths JSON indicados — NO esperar otro wrapper
```

---

### Paso 0 — Obtener sucursales (antes de Tab 1)

```http
GET /api/tenant/billing/branches
```

**Respuesta:** array directo (no viene dentro de `data`):

```json
[
  {
    "id": "258008be-6173-4140-a0df-6f752d691f2c",
    "code": "MZN",
    "city": "Monterrey",
    "display_name": "MZN123456789 - MZN",
    "fiscal_configuration_id": "..."
  }
]
```

**UI:** guardar `branches[0].id` como `billing_branch_id` default si hay una sola sucursal.

---

### Tab 1 — Puntos de venta

#### 1A) Resumen (cargar al entrar a la tab)

```http
GET /api/tenant/accounting/pos-summary?billing_branch_id={uuid}&period=month
```

| Query param | Requerido | Valores |
|-------------|-----------|---------|
| `billing_branch_id` | **Sí** | UUID de sucursal |
| `period` | No (default `month`) | `today`, `week`, `month`, `range` |
| `date_from` | Solo si `period=range` | `2026-06-01` |
| `date_to` | Solo si `period=range` | `2026-06-25` |

**Qué leer en la respuesta:**

| UI | Path JSON |
|----|-----------|
| Tabla terminales venta | `response.sales_terminals[]` |
| Nombre terminal | `sales_terminals[i].terminal_name` |
| # ventas | `sales_terminals[i].sales_count` |
| Monto | `sales_terminals[i].amount_sold` |
| ID para drill-down | `sales_terminals[i].terminal_user_id` |
| Card cobranza — órdenes | `response.collection_terminal.orders_collected` |
| Card cobranza — monto | `response.collection_terminal.amount_collected` |
| Card cobranza — mostrador | `response.collection_terminal.walk_in_count` |
| Card cobranza — facturadas | `response.collection_terminal.invoiced_count` |
| Card cobranza — cortes globales | `response.collection_terminal.daily_shifts_count` |
| Card cobranza — cortes parciales | `response.collection_terminal.partial_shifts_count` |
| Card cobranza — corte abierto | `response.collection_terminal.open_daily_shift` |
| Corte atrasado (banner) | `response.unclosed_shift_alert` |
| Corte abierto es de otro día | `response.collection_terminal.open_daily_shift.is_previous_day` |
| Filtros aplicados (debug) | `response.filters_applied` |

**Respuesta vacía válida (sin error):**

```json
{
  "filters_applied": { "billing_branch_id": "...", "period": "month", "date_from": "...", "date_to": "..." },
  "unclosed_shift_alert": null,
  "sales_terminals": [],
  "collection_terminal": {
    "terminal_user_id": null,
    "terminal_name": null,
    "orders_collected": 0,
    "amount_collected": 0,
    "walk_in_count": 0,
    "invoiced_count": 0
  }
}
```

**Por qué puede venir vacío:**

| Síntoma | Causa |
|---------|-------|
| `sales_terminals: []` | No hay ventas POS en el periodo para esa sucursal, o las órdenes no tienen `terminal_user_id` |
| `orders_collected: 0` | No se cobró nada en el periodo (fecha del cobro = `pos_sale_collections.created_at`) |
| Error 400 | Falta `billing_branch_id` o periodo `range` sin fechas |
| Error 403 | Usuario sin permiso `Accounting:Read` |

**Datos que SÍ cuenta el backend para terminales venta:**
- `sales_order_type = 'POS'`
- `general_status != 'Cancelada'`
- `warehouse.billing_branch_id` = sucursal seleccionada
- `terminal_user.pos_user_type = 'VENTAS'`
- `created_at` dentro del periodo

#### 1B) Detalle al click en una terminal

```http
GET /api/tenant/accounting/pos-terminals/{terminal_user_id}/sales
  ?billing_branch_id={uuid}&period=month&page=1&limit=20
```

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Filas tabla | `response.data[]` |
| Folio | `data[i].folio` |
| ID para detalle OV | `data[i].id` |
| Cliente empresa | `data[i].customer_company_name` |
| Cliente persona | `data[i].customer_person_name` |
| Cliente (fallback 1 línea) | `data[i].customer_display_name` |
| Es mostrador | `data[i].is_walk_in` |
| Vendedor nombre | `data[i].seller_user.first_name` + `last_name` |
| Vendedor código | `data[i].seller_user.pos_user_code` |
| Total | `data[i].total` |
| Paginación | `response.total`, `response.page`, `response.totalPages` |

**Columna Cliente (2 líneas):**

```
┌─────────────────────┐
│ Sinergy             │  ← customer_company_name (si existe)
│ Juan Pérez          │  ← customer_person_name (name + lastname)
└─────────────────────┘
```

- Si hay `customer_company_name` → línea superior (negrita o primaria).
- Si hay `customer_person_name` → línea inferior (secundaria / más chica).
- Si solo uno de los dos existe → mostrar solo esa línea.
- Si `is_walk_in: true` → chip **Mostrador** (además o en lugar del nombre).
- Fallback legacy: `customer_display_name` (empresa o persona en una sola línea).

**Click folio** → `GET /api/tenant/sales-orders/{data[i].id}` → leer `response.data.header`, `response.data.line_items`.

---

### Tab 2 — Cuentas por pagar

**No usa** sucursal ni periodo.

#### 2A) Lista

```http
GET /api/tenant/accounting/accounts-payable?page=1&limit=20&search=madera
```

| Query param | Requerido | Notas |
|-------------|-----------|-------|
| `search` | No | Filtra `vendor.name`, `razon_social`, `company_name` |
| `page` | No (default 1) | |
| `limit` | No (default 20) | |

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Filas tabla | `response.data[]` |
| Nombre proveedor | `data[i].razon_social` ?? `data[i].company_name` ?? `data[i].vendor_name` |
| # OCs pendientes | `data[i].pending_order_count` |
| Monto debe | `data[i].amount_pending` |
| Progress bar | `data[i].progress_percentage` |
| ID para detalle | `data[i].vendor_id` |
| Totales header | `response.summary.total_vendors`, `response.summary.total_amount_pending` |
| Paginación | `response.total`, `response.page`, `response.totalPages` |

**Respuesta vacía válida:**

```json
{
  "summary": { "total_vendors": 0, "total_amount_pending": 0 },
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0
}
```

**Por qué puede venir vacío:**

| Causa |
|-------|
| No hay órdenes de compra con saldo pendiente (`payment_status = Pendiente` y `amount_pending > 0`) |
| Todas las OCs están `Pagado` o `Cancelada` |
| El `search` no coincide con ningún proveedor |

**Solo entran OCs con:** `payment_status = 'Pendiente'`, `general_status != 'Cancelada'`, y saldo real pendiente después de restar pagos registrados.

#### 2B) Detalle proveedor (click fila)

```http
GET /api/tenant/accounting/accounts-payable/vendors/{vendor_id}
```

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Info proveedor | `response.vendor` |
| Filas OC | `response.orders[]` |
| Folio OC | `orders[i].folio` |
| Pendiente | `orders[i].amount_pending` |
| ID para link | `orders[i].id` |

404 si ese proveedor ya no tiene saldo pendiente.

---

### Tab 3 — Cuentas por cobrar

#### 3A) Lista por razón social

```http
GET /api/tenant/accounting/accounts-receivable?page=1&limit=20&billing_branch_id={uuid}
```

| Query param | Requerido | Notas |
|-------------|-----------|-------|
| `billing_branch_id` | No | Filtra por sucursal del almacén de la OV |
| `search` | No | Razón social o RFC |
| `page`, `limit` | No | Paginación |

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Filas tabla | `response.data[]` |
| Razón social | `data[i].razon_social` |
| RFC | `data[i].fiscal_rfc` |
| # órdenes | `data[i].pending_order_count` |
| Adeudo | `data[i].amount_pending` |
| Totales | `response.summary.total_accounts`, `response.summary.total_amount_pending` |

**Respuesta vacía válida:** mismo patrón que CxP (`data: []`, summary en 0).

**Por qué puede venir vacío:**

| Causa |
|-------|
| No hay órdenes con `payment_status = 'Pendiente'` |
| Las pendientes son de **Público en General** (mostrador) — se excluyen a propósito |
| Las pendientes están `En cola` (aún no surtidas) |
| Todas las ventas POS ya se cobraron (`Pagado`) |
| Filtro de sucursal no coincide con el almacén de las órdenes |

**Nota:** las ventas POS pendientes de cobrar en caja (mostrador, `Surtida + Pendiente`) **no aparecen aquí**. Este tab es para clientes con crédito / razón social real que deben factura.

#### 3B) Detalle razón social (click fila)

```http
GET /api/tenant/accounting/accounts-receivable/by-razon-social/{encodeURIComponent(razon_social)}/orders
  ?billing_branch_id={uuid}
```

**Ejemplo:** razón social `CONSTRUCTORA ROMERO SA`:

```
GET /api/tenant/accounting/accounts-receivable/by-razon-social/CONSTRUCTORA%20ROMERO%20SA/orders
```

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Header razón social | `response.razon_social` |
| RFC | `response.fiscal_rfc` |
| Total debe | `response.amount_pending` |
| # órdenes | `response.pending_order_count` |
| Filas | `response.orders[]` |
| Folio | `orders[i].folio` |
| ID detalle | `orders[i].id` |
| Vendedor | `orders[i].seller_user` |

---

### Ejemplo TypeScript (Tab 1 completa)

```typescript
const headers = { Authorization: `Bearer ${token}` };

// 1. Sucursales
const branches = await fetch('/api/tenant/billing/branches', { headers }).then(r => r.json());
const billingBranchId = branches[0]?.id;
if (!billingBranchId) return; // sin sucursales, no llamar pos-summary

// 2. Resumen POS
const params = new URLSearchParams({
  billing_branch_id: billingBranchId,
  period: 'month',
});
const summary = await fetch(`/api/tenant/accounting/pos-summary?${params}`, { headers })
  .then(r => r.json());

const terminals = summary.sales_terminals ?? [];        // ← tabla terminales
const cobranza = summary.collection_terminal ?? {};    // ← card cobranza
const staleAlert = summary.unclosed_shift_alert;       // ← banner superior

if (staleAlert) {
  showTopBanner(staleAlert.title, staleAlert.message);
}

// 3. Drill-down terminal
if (terminals.length > 0) {
  const terminalId = terminals[0].terminal_user_id;
  const detailParams = new URLSearchParams({
    billing_branch_id: billingBranchId,
    period: 'month',
    page: '1',
    limit: '20',
  });
  const detail = await fetch(
    `/api/tenant/accounting/pos-terminals/${terminalId}/sales?${detailParams}`,
    { headers },
  ).then(r => r.json());

  const orders = detail.data ?? [];  // ← filas del modal/drawer
}

// 4. Drill-down cobranza (click en Órdenes cobradas / Público / Facturadas)
const collectionParams = new URLSearchParams({
  billing_branch_id: billingBranchId,
  period: 'month',
  customer_type: 'all', // o 'walk_in' | 'invoiced'
  page: '1',
  limit: '20',
});
const collections = await fetch(
  `/api/tenant/accounting/pos-collections?${collectionParams}`,
  { headers },
).then(r => r.json());
// collections.data[] → filas del modal de cobranza
```

### Errores comunes de integración

| Error | Solución |
|-------|----------|
| Lee `response.data.sales_terminals` | **Incorrecto.** En pos-summary la data está en la raíz: `response.sales_terminals` |
| No envía `billing_branch_id` | Tab 1 responde 400 |
| Usa `warehouse_id` en lugar de `billing_branch_id` | Debe ser el UUID de `billing/branches`, no del almacén |
| Ruta sucursales incorrecta | Es `/api/tenant/billing/branches`, no `billing-branches/all` |
| 403 Forbidden | Asignar `Accounting:Read` al rol del usuario |
| Tab 1 vacío con ventas viejas | Probar `period=range` con fechas amplias; verificar que las OVs tengan `terminal_user_id` y sucursal correcta |

---

## Tab 1 — Puntos de venta

### API

```
GET /api/tenant/accounting/pos-summary
  ?billing_branch_id={uuid}
  &period=today|week|month|range
  &date_from=2026-06-01   (solo si period=range)
  &date_to=2026-06-25     (solo si period=range)
```

### Respuesta (resumen)

```json
{
  "filters_applied": { "billing_branch_id": "...", "period": "month", "date_from": "...", "date_to": "..." },
  "unclosed_shift_alert": {
    "active": true,
    "daily_shift_id": "uuid",
    "shift_date": "2026-08-14",
    "today": "2026-08-17",
    "days_open": 3,
    "title": "Corte del día anterior sin cerrar",
    "message": "Quedó un corte abierto del 2026-08-14 sin cerrar. Es necesario cerrarlo para continuar.",
    "severity": "blocking"
  },
  "sales_terminals": [
    {
      "terminal_user_id": "uuid",
      "terminal_name": "Terminal Ventas 1",
      "sales_count": 8,
      "amount_sold": 45230.50
    }
  ],
  "collection_terminal": {
    "terminal_user_id": "uuid",
    "terminal_name": "Terminal Cobranza",
    "orders_collected": 15,
    "amount_collected": 89400.00,
    "walk_in_count": 9,
    "invoiced_count": 6,
    "daily_shifts_count": 3,
    "partial_shifts_count": 5,
    "open_daily_shift": {
      "id": "uuid",
      "shift_date": "2026-08-14",
      "status": "open",
      "is_previous_day": true,
      "partial_shifts_count": 1
    }
  }
}
```

### UI — Sección A: Terminales de venta

Tabla o cards, **solo terminales VENTAS** (cobranza va en la card azul `collection_terminal`):

| Columna | Campo | Notas |
|---------|-------|-------|
| Terminal | `terminal_name` | |
| # Ventas | `sales_count` | Órdenes POS creadas en el periodo |
| Monto vendido | `amount_sold` | MXN, formato moneda |
| Acción | Ver detalle → | `GET .../pos-terminals/{terminal_user_id}/sales` |

**Click en fila / botón "Ver detalle":**

```
GET /api/tenant/accounting/pos-terminals/{terminal_user_id}/sales
  ?billing_branch_id={uuid}
  &period=...
  &date_from=...
  &date_to=...
  &page=1&limit=20
```

Mostrar tabla paginada:

| Folio | Fecha | Cliente | Vendedor | Total | Estatus pago |
|-------|-------|---------|----------|-------|--------------|
| OV-001 | ... | Público en General | Juan Pérez | $1,200 | Pagado |

- **Cliente (2 líneas):**
  - Arriba: `customer_company_name` (solo si no es `null`).
  - Abajo: `customer_person_name` (`name` + `lastname`).
  - Si `is_walk_in: true` → chip **Mostrador**.
  - Fallback: `customer_display_name` si no usan los campos separados.
- **Vendedor:** `[seller_user.first_name] [seller_user.last_name]` + código `(seller_user.pos_user_code)` si existe.
- **Click en folio** → abrir el **detalle existente** de sales orders: `GET /api/tenant/sales-orders/{id}` (misma pantalla/modal que ya tienen).

### UI — Sección B: Terminal de cobranza

Card resumen debajo o al lado de las terminales de venta:

| Métrica | Campo | Descripción | Click |
|---------|-------|-------------|-------|
| Órdenes cobradas | `orders_collected` | Cobros registrados en el periodo | Abrir modal con `customer_type=all` |
| Total cobrado | `amount_collected` | Suma MXN de `pos_sale_collections` | (opcional) mismo modal `all` |
| Público en General | `walk_in_count` | Cobro a mostrador **sin** CFDI timbrado | Abrir modal con `customer_type=walk_in` |
| Facturadas | `invoiced_count` | Orden con CFDI timbrado (`stamp_status` stamped / cancel_pending / cancelled) | Abrir modal con `customer_type=invoiced` |
| Cortes globales | `daily_shifts_count` | Cortes del día abiertos/cerrados en el periodo | (opcional) link a historial POS |
| Cortes parciales | `partial_shifts_count` | Retiros parciales en el periodo | (opcional) link a historial POS |
| Corte abierto | `open_daily_shift` | Corte global actual de la sucursal | Chip si `status === 'open'`. Si `is_previous_day === true`, chip rojo “Sin cerrar desde {shift_date}” |

**Definición "facturada" vs "Público en General":**

| Tipo | Regla backend | `customer_type` |
|------|---------------|-----------------|
| Todas | Sin filtro de cliente | `all` |
| Público en General | Cliente mostrador **y** la orden **no** tiene CFDI timbrado | `walk_in` |
| Facturada | La orden tiene al menos un CFDI con `stamp_status` en `stamped`, `cancel_pending` o `cancelled` | `invoiced` |

> **Importante:** ya no basta con que el cliente sea distinto de “Público en General”. **Facturada** = timbrado real en `electronic_invoices`.

> **Nota:** este conteo usa fecha de **cobro**, no de venta. Puede ser mayor que `# VENTAS` de una terminal (órdenes vendidas antes y cobradas en el periodo, u otras terminales).

#### 1C) Detalle al click en card de cobranza

```http
GET /api/tenant/accounting/pos-collections
  ?billing_branch_id={uuid}
  &period=range
  &date_from=2026-06-01
  &date_to=2026-06-30
  &customer_type=all
  &page=1&limit=20
```

| Query | Requerido | Valores |
|-------|-----------|---------|
| `billing_branch_id` | Sí | UUID sucursal |
| `period` | No (default `month`) | `today`, `week`, `month`, `range` |
| `date_from` / `date_to` | Si `period=range` | ISO date |
| `customer_type` | No (default `all`) | `all`, `walk_in`, `invoiced` |
| `page` / `limit` | No | Paginación |

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Título modal | `Cobranza — {terminal_name}` |
| Subtítulo | `{total} órdenes cobradas en el periodo` |
| Filas | `response.data[]` |
| Folio / ID orden | `data[i].folio` / `data[i].id` |
| Fecha venta | `data[i].created_at` |
| Fecha cobro | `data[i].collected_at` |
| Cliente empresa | `data[i].customer_company_name` |
| Cliente persona | `data[i].customer_person_name` |
| Es mostrador | `data[i].is_walk_in` |
| CFDI timbrado | `data[i].has_stamped_invoice` |
| Vendedor | `data[i].seller_user` |
| Cajero | `data[i].collected_by_user` |
| Método pago | `data[i].payment_method` |
| Total | `data[i].total` |
| Estatus pago | `data[i].payment_status` |

**Modal (mismo layout que detalle de terminal de venta):**

```
┌─────────────────────────────────────────────────────────────┐
│ Cobranza — POS Cobranza Terminal 1                     ✕   │
│ 7 órdenes cobradas en el periodo seleccionado               │
├─────────────────────────────────────────────────────────────┤
│ [ Todas (7) ]  [ Público en General (2) ]  [ Facturadas (5)]│
├─────────────────────────────────────────────────────────────┤
│ FOLIO      FECHA VENTA  FECHA COBRO  CLIENTE  TOTAL  PAGO  │
│ OSV-000010 25 jun 2026  25 jun 2026  Sinergy  $12.95 Pagado │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Filtros del modal (tabs o chips):**

| Chip UI | `customer_type` | Count desde resumen |
|---------|-----------------|---------------------|
| Todas | `all` | `orders_collected` |
| Público en General | `walk_in` | `walk_in_count` |
| Facturadas | `invoiced` | `invoiced_count` |

Al cambiar chip → volver a llamar `pos-collections` con el mismo periodo/sucursal y el nuevo `customer_type`.

**Columnas sugeridas:**

| Columna | Campo |
|---------|-------|
| Folio | `folio` (click → `GET /sales-orders/{id}`) |
| Fecha venta | `created_at` |
| Fecha cobro | `collected_at` (útil para ver por qué hay más cobros que ventas) |
| Cliente | 2 líneas: `customer_company_name` arriba, `customer_person_name` abajo; chip Mostrador si `is_walk_in` |
| Vendedor | `seller_user.first_name` + `last_name` + `(pos_user_code)` |
| Total | `total` |
| Estatus pago | `payment_status` |

**Función Pollux:**

```typescript
type CollectionCustomerType = 'all' | 'walk_in' | 'invoiced';

async function fetchPosCollections(opts: {
  billingBranchId: string;
  period: string;
  dateFrom?: string;
  dateTo?: string;
  customerType?: CollectionCustomerType;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams({
    billing_branch_id: opts.billingBranchId,
    period: opts.period,
    customer_type: opts.customerType ?? 'all',
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 20),
  });
  if (opts.dateFrom) params.set('date_from', opts.dateFrom);
  if (opts.dateTo) params.set('date_to', opts.dateTo);

  return api.get(`/tenant/accounting/pos-collections?${params}`);
}

// Click en "Órdenes cobradas"
openCollectionsModal('all');

// Click en "Público en General"
openCollectionsModal('walk_in');

// Click en "Facturadas"
openCollectionsModal('invoiced');
```

---

## Tab 2 — Cuentas por pagar

No usa filtro de fecha ni sucursal (saldo global del tenant).

### API lista

```
GET /api/tenant/accounting/accounts-payable
  ?search=proveedor
  &page=1&limit=20
```

### UI

```
┌──────────────────────────────────────────┐
│  🔍 Buscar por nombre o razón social     │
├──────────────────────────────────────────┤
│  Proveedor          Debe        Progreso │
│  Maderas del Norte  $45,000     ████░░   │
│  Ferretería XYZ     $12,300     ██░░░░   │
└──────────────────────────────────────────┘
```

| Columna | Campo | Notas |
|---------|-------|-------|
| Proveedor | `vendor_name` / `razon_social` / `company_name` | Mostrar el más descriptivo disponible |
| # OC pendientes | `pending_order_count` | |
| Monto adeudado | `amount_pending` | MXN |
| Progress bar | `progress_percentage` | Ver abajo |

**Progress bar:**

- Si el proveedor tiene `credit_limit` → `amount_pending / credit_limit * 100`
- Si no → `amount_pending / total_committed * 100` (pendiente vs total comprometido en OCs abiertas)
- Color sugerido: verde < 50%, amarillo 50–80%, rojo > 80%

**Search:** filtra por `name`, `razon_social` o `company_name` del proveedor (debounce 300ms).

### Detalle proveedor (drawer o modal)

Click en fila:

```
GET /api/tenant/accounting/accounts-payable/vendors/{vendorId}
```

Tabla de órdenes de compra pendientes:

| Folio OC | Fecha | Entrega esperada | Pagado | Pendiente | Estatus |
|----------|-------|------------------|--------|-----------|---------|

Link folio → pantalla existente de Purchase Orders (`/purchase-orders/{id}`).

---

## Tab 3 — Cuentas por cobrar

**Vista única: por razón social** (no listar órdenes sueltas en el nivel principal).

Opcional: filtrar por sucursal con el mismo dropdown superior (`billing_branch_id`).

### API lista

```
GET /api/tenant/accounting/accounts-receivable
  ?billing_branch_id={uuid}   (opcional)
  &search=ROMR960614
  &page=1&limit=20
```

### UI

```
┌────────────────────────────────────────────────────────┐
│  🔍 Buscar por razón social o RFC                      │
├────────────────────────────────────────────────────────┤
│  Razón social              RFC           # Órdenes  Debe │
│  CONSTRUCTORA ROMERO SA    ROMR9606149GA   3      $28,500│
│  FERRETERIA LA ESQUINA     FEL850101ABC    1       $4,200│
└────────────────────────────────────────────────────────┘
```

| Columna | Campo |
|---------|-------|
| Razón social | `razon_social` |
| RFC | `fiscal_rfc` |
| # Órdenes | `pending_order_count` |
| Adeudo | `amount_pending` |

**Search:** filtra por razón social o RFC.

**Excluidos del listado:** clientes mostrador (`Público en General` / `VENTA DE MOSTRADOR`) y órdenes canceladas o en cola.

### Detalle por razón social (drawer)

Click en fila:

```
GET /api/tenant/accounting/accounts-receivable/by-razon-social/{encodeURIComponent(razon_social)}/orders
  ?billing_branch_id={uuid}   (opcional, mismo filtro superior)
```

Header del drawer:

- Razón social
- RFC
- Total adeudado (`amount_pending`)
- Cantidad de órdenes (`pending_order_count`)

Tabla de órdenes:

| Folio | Fecha | Cliente | Vendedor | Total | Entrega |
|-------|-------|---------|----------|-------|---------|

- **Click folio** → detalle sales order existente.

---

## Cambios en Reporte de Ventas Zona Norte

### Problema

El reporte agrupaba por `created_by` (usuario de la **terminal POS** logueada), no por el **vendedor** que capturó su código numérico.

### Solución backend (ya aplicada)

`GET /api/tenant/sales-reports/by-seller` ahora agrupa por:

```
COALESCE(seller_user_id, created_by)
```

| Tipo orden | Campo vendedor |
|------------|----------------|
| POS | `seller_user_id` — quien ingresó su `pos_user_code` |
| MANUAL | `created_by` — quien creó la orden |

### Cambio UI requerido

**Ningún cambio de contrato** en query params ni shape de respuesta. Solo verificar que la columna **Vendedor** (`seller_name`) muestre el nombre correcto tras el fix.

Si el UI cacheaba datos, invalidar cache al desplegar.

---

## Cambios en detalle de Sales Orders

### Backend — ya captura y expone el vendedor

Al crear venta POS, el frontend **debe** enviar `seller_user_id` (resultado de `POST /api/tenant/pos/validate-seller-code`).

En detalle:

```
GET /api/tenant/sales-orders/{id}
```

Respuesta incluye en `data.header`:

```json
{
  "seller_user": {
    "id": "uuid",
    "first_name": "Juan",
    "last_name": "Pérez",
    "pos_user_code": 123456,
    "pos_user_type": null
  },
  "terminal_user": {
    "id": "uuid",
    "first_name": "Terminal",
    "last_name": "Ventas 1",
    "pos_user_code": null,
    "pos_user_type": "VENTAS"
  },
  "collected_by_user": { "...": "..." }
}
```

### UI — agregar en detalle de orden

Sección **Información POS** (solo si `sales_order_type === 'POS'`):

| Label | Campo | Ejemplo |
|-------|-------|---------|
| Vendedor | `header.seller_user` | Juan Pérez (123456) |
| Terminal | `header.terminal_user` | Terminal Ventas 1 |
| Cobró | `header.collected_by_user` | María López (solo si Pagado) |

**Formato vendedor:**

```typescript
function formatSeller(user: SellerUser | null): string {
  if (!user) return '—';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return user.pos_user_code ? `${name} (${user.pos_user_code})` : name;
}
```

**No confundir:**

| Campo | Quién es |
|-------|----------|
| `seller_user` | Vendedor con código numérico |
| `terminal_user` | Cuenta POS de la computadora |
| `collected_by_user` | Cajero de cobranza que registró el pago |
| `created_by` (interno) | Mismo que terminal en POS — **no mostrar como vendedor** |

### UI POS Ventas — verificar captura

Flujo obligatorio antes de crear orden:

1. Cajero/vendedor ingresa código → `POST /api/tenant/pos/validate-seller-code` `{ "code": 123456 }`
2. Guardar `seller.id` del response
3. Al crear orden → `POST /api/tenant/sales-orders` incluir `"seller_user_id": "{seller.id}"`

Si no se envía `seller_user_id`, el backend responde 400.

---

## Resumen de endpoints

| Tab | Endpoint | Permiso |
|-----|----------|---------|
| POS resumen | `GET /tenant/accounting/pos-summary` | Accounting:Read |
| POS detalle terminal | `GET /tenant/accounting/pos-terminals/:id/sales` | Accounting:Read |
| POS órdenes cobradas | `GET /tenant/accounting/pos-collections` | Accounting:Read |
| CxP lista | `GET /tenant/accounting/accounts-payable` | Accounting:Read |
| CxP detalle | `GET /tenant/accounting/accounts-payable/vendors/:vendorId` | Accounting:Read |
| CxC lista | `GET /tenant/accounting/accounts-receivable` | Accounting:Read |
| CxC detalle | `GET /tenant/accounting/accounts-receivable/by-razon-social/:razonSocial/orders` | Accounting:Read |
| Sucursales | `GET /tenant/billing/branches` | FiscalConfiguration:Read |
| Detalle OV | `GET /tenant/sales-orders/:id` | SalesOrders existente |

---

## Checklist implementación UI

- [ ] Entrada de menú con permiso `Accounting:ViewMenu`
- [ ] Componente periodo reutilizado de Reporte Ventas Zona Norte
- [ ] Dropdown sucursal con `billing-branches/all`
- [ ] Tab 1: tabla terminales + card cobranza + drill-down ventas y órdenes cobradas (`pos-collections` con filtro `customer_type`)
- [ ] Tab 2: search proveedores + progress bar + detalle OCs
- [ ] Tab 3: lista por razón social + drawer con órdenes pendientes
- [ ] Detalle sales order: mostrar `seller_user`, `terminal_user`, `collected_by_user`
- [ ] Reporte ventas: validar columna vendedor post-fix backend
- [ ] POS ventas: confirmar envío de `seller_user_id` en create
