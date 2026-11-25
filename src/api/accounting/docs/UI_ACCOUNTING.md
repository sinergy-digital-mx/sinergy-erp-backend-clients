# UI — Caja y cuentas

Guía para Pollux: módulo **Caja y cuentas** (menú Contabilidad). Los filtros superiores replican el patrón del **Reporte de Ventas Zona Norte** (`zona_norte_custom_report`).

> **Estado backend:** API disponible en `/api/tenant/accounting/*`. Permiso: `Accounting:Read` + `ViewMenu`.

## Historial

### 2026-11-25
El menú y el título de la vista pasan de **Cobranza** a **Caja y cuentas**. La pestaña del periodo pasa de **Cobros** a **Ventas cobradas** (las ventas ya cobradas, por fecha de cobro). **Caja del día** no cambia.

### 2026-11-24
La pestaña del día se llama **Caja del día** y la del periodo **Ventas cobradas**. Al pasar el cursor, cada pestaña explica qué lista. Sucursal, periodo y actualizar quedan a la misma altura y con el mismo borde en todas las vistas.

### 2026-11-23
La pestaña queda en la URL (`tab`). Al recargar se conserva, con el periodo (`period`, `from`, `to`), la búsqueda y los filtros de esa vista. Junto al periodo hay **Actualizar**.

Cobranza POS: `pq` búsqueda, `ctype` (`walk_in` | `invoiced`), `pay` (efectivo, tarjeta, transferencia, cheque, crédito), `ship=1` envío y `ppage`. Cuentas por pagar: `aq`, `acur`, `apage`. Cuentas por cobrar: `rq`, `rcur`, `rpage`. Rep. Vent. Cost. Prom.: `vq`, `vpage`. Flujo de deuda: `dq`, `dview`, `dperiod`, `dfrom`, `dto`, `dcust`, `dname`, `dpage`. Factura público en general: `month`.

Cobranza POS: las tarjetas de forma de pago muestran solo ventas y monto. Ya no muestran el ticket promedio.

### 2026-11-09
Cuentas por pagar y cuentas por cobrar filtran por nuestra razón social (`fiscal_configuration_id`). Vacío significa todas. El detalle y el Excel respetan esa razón. Flujo de deuda ya no usa sucursal.

Cuentas por cobrar: el clic en cualquier columna de la fila abre las órdenes de esa razón social. Antes solo abría el nombre.

### 2026-11-04
Cuentas por pagar vuelve a mostrar la **razón social** (el nombre comercial queda debajo si es distinto). Arriba está el selector de **Mes** y **Rango**. Al abrir se ve todo el saldo pendiente; al elegir mes o rango, la lista, el Excel y el detalle dejan solo las órdenes creadas en esas fechas.

### 2026-11-03
Flujo de deuda y Rep. Vent. Cost. Prom. leen la sucursal de `billing_branch_id`, la misma URL del resto de Cobranza. Cuentas por pagar no filtra por sucursal y no borra ese parámetro.

Cobranza POS abre en el mes actual (día 1 al día de hoy). Bajo el folio se indica si la venta es **Anticipo**, **Crédito** o **Contado** (`sale_kind`: `advance`, `credit`, `cash`). El Excel trae la columna Venta.

Cuentas por cobrar: el periodo solo ofrece **Mes** y **Rango**. Hoy y Semana no aparecen en esa pestaña.

Anticipo y crédito: el anticipo no usa el crédito del cliente. En Cobranza POS la fila de anticipo muestra en **Total** y en **Pendiente** lo que falta por cobrar, y en **Anticipo** lo ya cobrado. Solo una orden a crédito descuenta el disponible. En caja, cada anticipo del corte también muestra lo pendiente.

Cobranza POS: la pestaña vuelve a listar todas las ventas cobradas del periodo, con su forma de pago (efectivo, transferencia, tarjeta, cheque o mixto, y cuáles). De crédito solo entran los abonos ya cobrados; el cargo que sigue pendiente no sale. Arriba van las tarjetas de Transferencias, Efectivo, Tarjetas, Cheques y Crédito (ventas y monto). En la fila de Todas y Facturadas van Envío, Efectivo, Tarjeta, Transferencia, Cheque y Crédito, cada uno con su conteo y monto. Envío filtra `for_shipping`. Las ve quien abre Cobranza (`Accounting:Read`), sin otro permiso. `credit_scope=paid`. El detalle de la terminal en Puntos de venta sigue mostrando todos los cobros, incluido el cargo a crédito. `credit_only=true` queda para el filtro de clientes con crédito habilitado.

La pestaña de Cobranza se llama **Factura público en general**.

Facturas globales: sobre la lista se indica que son las órdenes que el cliente no facturó y que la factura a público en general se emite con todas.

Facturas globales: por sucursal y mes. El selector es la sucursal y **Generar facturas** timbra solo las órdenes sin facturar de esa sucursal. Una vigente por sucursal. Detalle en `UI_GLOBAL_INVOICES.md`.

Facturas globales: pestaña nueva en Cobranza. Por mes lista las órdenes de clientes sin factura de ingreso vigente (folio, fecha, cliente, estado, totales y forma de pago; si es mixto, las dos formas). Generar facturas timbra un solo CFDI a público en general. Mientras siga vigente no se puede emitir otra de esa sucursal. Al cancelarse, las órdenes vuelven y se puede timbrar otra. Detalle en `UI_GLOBAL_INVOICES.md`.

### 2026-11-02
Cobranza POS: junto a Todas, Público en General y Facturadas van filtros con ícono de Efectivo, Transferencia, Tarjeta, Cheque y Crédito (`payment_method`). Las columnas de arriba hacen el mismo filtro y Crédito entra en `summary.by_payment_method.credit` (ventas y monto). Un mixto cuenta en cada forma con importe. El Excel respeta el filtro.

Puntos de venta: `summary.orders_for_shipping`, `summary.amount_for_shipping` y `summary.orders_for_shipping_pending` cuentan las órdenes del día con `for_shipping`. Cada fila de `entered_orders` trae `for_shipping`. En Cobranza POS la fila y el Excel traen la misma bandera (`Para envío`: Sí / No).

Cobranza POS: cada fila separa **fecha de pago** (`payment_date`, día del abono) y **fecha de cobro** (`collected_at`, cuándo se cobró en caja). Si la orden es a crédito y todavía no tiene abono, la fecha de pago va vacía. El Excel trae la columna Fecha pago.

Cobranza POS: si el cobro tiene importe, el ojo junto al folio abre el ticket de venta. Vendedor y cajero muestran solo el nombre, sin código. El Excel igual.

Cobranza POS: el cheque en dólares entra al monto de cheque ya convertido con el tipo de cambio del cobro, igual que el efectivo en USD.

Cobranza POS: en cada línea, un cobro mixto de POS Caja muestra las formas usadas (`payment_breakdown_label`, p. ej. `Efectivo + Tarjeta`, `Tarjeta + Cheque`). El Excel usa el mismo texto en Método de pago.

La sucursal queda en la URL (`billing_branch_id`) y la leen todas las pestañas: Puntos de venta, Cobranza POS, Cuentas por cobrar, Flujo de deuda, Rep. Vent. Cost. Prom. y Factura público en general. `all` significa Todas. Cuentas por pagar no filtra por sucursal, pero no borra la de la URL. Flujo de deuda, si quedó en Todas, guarda la razón social en `fiscal_configuration_id`.

### 2026-10-28
Rep. Vent. Cost. Prom: el folio de una cotización (anticipo o nota) abre la cotización, igual que el folio de una orden abre la orden. La fila trae `quotation_id`.

### 2026-10-26
Cuentas por cobrar: la razón social queda más compacta y el RFC va debajo, en un badge. Ya no hay columna RFC.

Cobranza POS: `summary.by_payment_method` trae **Ventas / Monto / Ticket** por efectivo, transferencia, tarjeta y cheque. Un cobro mixto suma el importe en cada forma usada. El efectivo y el cheque en USD se convierten con el tipo de cambio del cobro.

Cuentas por pagar: columna y cards **Saldo a favor** (`credit_balance_mxn` / `credit_balance_usd`, `summary.total_credit_balance_mxn` / `total_credit_balance_usd`). Un proveedor sin OC pendientes pero con crédito sí aparece. El Excel trae la misma columna. El clic sigue abriendo las OC pendientes.

### 2026-10-22
Cobranza POS: la columna Cliente se estrecha (nombre negro en una línea) y el espacio extra pasa a Vendedor / cajero para que se lean nombre y código.

### 2026-10-21
Rep. Vent. Cost. Prom: al abrir la pestaña siempre se selecciona el **mes actual** (rango día 1 → hoy, botón Mes activo). Al volver a Puntos de venta el periodo regresa a Hoy.

Rep. Vent. Cost. Prom: la tabla muestra las 12 columnas a todos los usuarios con `Accounting:Read`; no hay columnas por permiso. En pantallas chicas o con zoom la tabla tiene scroll horizontal. Ahora la barra horizontal queda visible (alto máximo con scroll), el encabezado y la columna Cliente quedan fijos, y el ancho mínimo bajó de 1500 px a 1310 px.

### 2026-10-19
Cuentas por pagar (lista, detalle y Excel) toma el adeudo del **total factura** cuando la OC tiene costo real: mercancía + gastos con casilla Factura, en la moneda de pago. Sin costo real sigue el total de catálogo (recibido si está Recibida; si no, el solicitado). A ese total se le restan los pagos ya registrados.

Click en un proveedor abre un **modal** en Cobranza con sus OC pendientes (`GET /accounts-payable/vendors/{vendorId}`). El folio abre el detalle de la orden encima, sin ir al listado de compras. En Pesos o Dólares el modal solo muestra esa moneda.

### 2026-10-14
Cobranza POS filtra por **fecha de cobro** (`date_basis=collected`), no por la fecha del corte. Cada fila trae `billing_branch` (sucursal de la venta) y `shift_date`. `summary` alimenta los chips con el mismo criterio; `filtered_amount` es el monto de la lista. El modal de Puntos de venta sigue en `date_basis=shift`.

Pestaña **Rep. Vent. Cost. Prom** (`average-cost`). Reporte de ventas a costo promedio por sucursal y periodo: cliente, documento, fecha, tipo, estatus, importe, descuento, impuesto, total de venta, total de costo y margen. `GET /tenant/accounting/average-cost-report` y Excel en `.../export/excel`.

> **2026-10-14 — Cuentas por pagar por moneda.** Cada proveedor separa adeudo y OC pendientes en MXN y USD. La lista acepta `currency=all|mxn|usd`. El Excel (`GET /accounts-payable/export/excel`) en `all` trae dos hojas (pesos y dólares); `mxn` y `usd` descargan una sola lista.

> **2026-10-14 — Total en pesos y tipo de cambio del día.** La lista y las tarjetas agregan `exchange_rate`, `exchange_rate_date` y el total en pesos (`amount_pending_total_mxn` / `summary.total_amount_pending_total_mxn`): pesos + dólares × TC del día. Sin TC y con dólares, el total llega `null`. El Excel de `all` abre en la hoja **Ambos** (pesos, dólares y total al tipo de cambio del sistema). Arriba de cada hoja va ese tipo de cambio.

> **2026-10-14 — Cuentas por cobrar por moneda.** La lista acepta `currency=all|mxn|usd` y separa el adeudo en MXN y USD. El total en pesos usa el tipo de cambio del sistema. Excel: `GET /accounts-receivable/export/excel`. En `all` abre en la hoja **Ambos** y sigue con pesos y dólares; arriba va el tipo de cambio del sistema.

> **2026-10-14 — Hoja Ambos detallado.** En `currency=all`, el Excel de cuentas por cobrar y de cuentas por pagar agrega la hoja **Ambos detallado** justo después de Ambos. Una fila por orden pendiente, agrupada por razón social y ordenada por fecha: folio, factura, tipo de pago, moneda y monto.

---

## Menú y permisos

| Item | Valor |
|------|-------|
| Módulo RBAC | `accounting` |
| Entidad | `Accounting` |
| Permisos mínimos | `ViewMenu`, `Read` |
| Ruta sugerida | `/accounting` o `/cobranza` |
| Flujo de deuda | `/accounting/flujo-deuda` — antigüedad de saldos y kardex de abonos. Ver `UI_DEBT_FLOW.md`. |

---

## Layout general (aplica a las 4 tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cobranza / Contabilidad                                        │
├─────────────────────────────────────────────────────────────────┤
│  Sucursal: [ dropdown ]     [ Hoy | Otro día ]                  │
├─────────────────────────────────────────────────────────────────┤
│  Entraron (n · monto)   Cobrado   Por cobrar                    │
├─────────────────────────────────────────────────────────────────┤
│  [ Caja del día ] [ Cobros ] [ CxP ] [ CxC ]                    │
│                                          [ Flujo de deuda ]     │
├─────────────────────────────────────────────────────────────────┤
│  Órdenes que entraron                          Card de cobranza │
└─────────────────────────────────────────────────────────────────┘
```

### Selector de periodo (igual que Reporte Ventas Zona Norte)

Reutilizar el **mismo componente** que ya usa el reporte de ventas Maderería Zona Norte.

| Opción UI | Query param `period` | Comportamiento |
|-----------|----------------------|----------------|
| Hoy | `today` | Día calendario `America/Tijuana`, de 00:00 a 23:59. No usa el día UTC del servidor ni `new Date('YYYY-MM-DD')`. |
| Semana | `week` | Lunes de esa misma zona – hoy |
| Mes | `month` | Día 1 del mes – hoy, en esa misma zona |
| Rango / Otro día | `range` | `date_from` y `date_to` como `YYYY-MM-DD` de calendario. En Caja del día ambos son el mismo día. |

En **Cuentas por cobrar** la barra solo muestra Mes y Rango.

**Default:** `month`.

### Selector de sucursal

| Campo | Fuente |
|-------|--------|
| Dropdown | `GET /api/tenant/billing/branches` |
| Valor | `id` del branch (UUID) → enviar como `billing_branch_id` |
| Label | `display_name` o `{city} ({code})` |

**Obligatorio** en Tab 1 (Caja del día), Cobros y Rep. Vent. Cost. Prom. Opcional en Cuentas por cobrar.

Al cambiar periodo o sucursal → recargar la tab activa.

La sucursal elegida se guarda en la query de la página (`billing_branch_id`). Un UUID vuelve a dejar esa sucursal al recargar en todas las pestañas que filtran por sucursal, incluido Flujo de deuda y Rep. Vent. Cost. Prom. `all` es Todas. Si el parámetro no viene, se usa la sucursal de la sesión o la única sucursal, salvo en Flujo de deuda: ahí Todas no hereda la de la sesión. Con Todas, el flujo guarda `fiscal_configuration_id` para la razón social.

### Alerta: corte de un día anterior sin cerrar

El corte POS debe cerrarse **completo todos los días**. Si la sucursal seleccionada tiene un corte `open` con `shift_date` anterior a hoy, `GET pos-summary` incluye `unclosed_shift_alert` en la **raíz** (no depende del periodo del reporte).

**Mostrar** el banner en **todas** las tabs de Cobranza / Contabilidad, arriba de los filtros, mientras `unclosed_shift_alert !== null`.

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠  Corte del día anterior sin cerrar                           │
│  Quedó un corte abierto del 2026-08-14 sin cerrar.              │
│  Es necesario cerrarlo para continuar.                          │
│                                          [ Ir a POS Caja ]  │
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

**CTA:** `Ir a POS Caja` → `/pos/cobranza` (si el usuario tiene acceso POS). Si no, el texto basta: hay que cerrar el corte en la terminal de caja.

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

### Tab 1 — Caja del día

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
| Resumen — órdenes que entraron | `response.summary.orders_entered` |
| Resumen — monto de esas órdenes | `response.summary.amount_entered` |
| Resumen — cobrado | `response.summary.amount_collected` |
| Resumen — por cobrar | `response.summary.amount_pending` |
| Resumen — órdenes para envío | `response.summary.orders_for_shipping` |
| Resumen — monto de esas órdenes | `response.summary.amount_for_shipping` |
| Resumen — de envío que siguen por cobrar | `response.summary.orders_for_shipping_pending` |
| Lista de órdenes del día (caja y sucursal) | `response.entered_orders[]` |
| Es para envío | `entered_orders[i].for_shipping` |
| Origen | `entered_orders[i].channel` → `caja` \| `branch` |
| Folio | `entered_orders[i].folio` |
| Cliente | `entered_orders[i].customer_display_name` |
| Terminal | `entered_orders[i].terminal_name` |
| Total de la orden | `entered_orders[i].total` |
| Ya cobrado de esa orden | `entered_orders[i].amount_collected` |
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
| `orders_collected: 0` | No hay cobros en un corte cuya `shift_date` cae en el periodo |
| Error 400 | Falta `billing_branch_id` o periodo `range` sin fechas |
| Error 403 | Usuario sin permiso `Accounting:Read` |

**Datos que SÍ cuenta el backend para terminales venta:**
- `sales_order_type = 'POS'`
- `general_status != 'Cancelada'`
- `billing_branch_id` de la orden o, si falta, el del almacén = sucursal seleccionada
- Día de `created_at` en calendario de Tijuana, no el día UTC del servidor

**Órdenes del día (`entered_orders`):** POS (`channel = caja`) y manuales de la sucursal (`channel = branch`). Misma sucursal y mismo día. Canceladas no entran. También entra una orden cobrada en un corte de ese día aunque `created_at` caiga en otro.

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

#### 1D) Consultar cortes globales y parciales

```http
GET /api/tenant/accounting/pos-daily-shifts?billing_branch_id={uuid}&period=month
GET /api/tenant/accounting/pos-daily-shifts/{id}
```

Click en **Cortes globales** / **Cortes parciales** / **Corte abierto** de la card Cobranza. El listado es de consulta (no cierra el corte). **Ver corte** abre el detalle con historial de parciales.

---

### Tab 2 — Cuentas por pagar

**No filtra por sucursal.** El periodo es **Mes** o **Rango** (`period=month|range`). Sin `period`, el saldo pendiente completo.

#### 2A) Lista

```http
GET /api/tenant/accounting/accounts-payable?page=1&limit=20&search=madera&currency=all&period=range&date_from=2026-11-01&date_to=2026-11-04
```

| Query param | Requerido | Notas |
|-------------|-----------|-------|
| `search` | No | Filtra `vendor.name`, `razon_social`, `company_name` |
| `currency` | No (default `all`) | `all` pesos y dólares, `mxn` solo pesos, `usd` solo dólares |
| `period` | No | `month` o `range`. Sin valor, no recorta por fecha |
| `date_from` / `date_to` | Si `period=range` | `YYYY-MM-DD`. La orden entra por su fecha de alta |
| `page` | No (default 1) | |
| `limit` | No (default 20) | |

**Vistas UI:** Ambos / Pesos / Dólares. Cada una tiene su botón **Descargar Excel**.

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Filas tabla | `response.data[]` |
| Razón social | `data[i].razon_social` ?? `data[i].company_name` ?? `data[i].vendor_name`. El nombre comercial va debajo si es distinto |
| Monto adeudado MXN + badge OC | `data[i].amount_pending_mxn`, `data[i].pending_order_count_mxn` |
| Monto adeudado USD + badge OC | `data[i].amount_pending_usd`, `data[i].pending_order_count_usd` |
| Barra MXN | `data[i].progress_percentage_mxn` |
| Barra USD | `data[i].progress_percentage_usd` |
| Tipo de cambio del día | `response.summary.exchange_rate` (misma cifra en cada fila). Fecha: `summary.exchange_rate_date` |
| Total en pesos | `data[i].amount_pending_total_mxn`. Tarjeta: `summary.total_amount_pending_total_mxn` |
| Saldo a favor | `data[i].credit_balance_mxn`, `data[i].credit_balance_usd`. Tarjetas: `summary.total_credit_balance_mxn`, `summary.total_credit_balance_usd` |
| ID para detalle | `data[i].vendor_id` |
| Totales | `response.summary.total_vendors`, `total_amount_pending_mxn`, `total_amount_pending_usd`, `total_pending_orders_mxn`, `total_pending_orders_usd`, `total_amount_pending_total_mxn` |
| Paginación | `response.total`, `response.page`, `response.totalPages` |

En **Ambos** van las dos columnas de monto (cada una con su badge de OC), la columna **Tipo de cambio**, **Total en pesos** y dos barras de progreso. En **Pesos** o **Dólares** solo esa moneda, más tipo de cambio y total.

**Total en pesos:** en Ambos es `MXN + USD × exchange_rate`. En Pesos es solo el adeudo MXN. En Dólares es `USD × exchange_rate`. Si hay dólares y no hay tipo de cambio del día, el total es `null` (la UI muestra —).

**Excel (misma búsqueda y vista, sin paginación):**

```http
GET /api/tenant/accounting/accounts-payable/export/excel?currency=all&search=madera
```

| `currency` | Archivo |
|------------|---------|
| `all` | `cuentas-por-pagar-YYYY-MM-DD.xlsx` con hojas **Ambos**, **Ambos detallado**, **Pesos MXN** y **Dólares USD** |
| `mxn` | `cuentas-por-pagar-mxn-YYYY-MM-DD.xlsx` |
| `usd` | `cuentas-por-pagar-usd-YYYY-MM-DD.xlsx` |

Arriba de cada hoja, en amarillo: **Tipo de cambio del sistema** (el del día que tiene el sistema) y su fecha. La hoja **Ambos** trae Adeudado en pesos, Adeudado en dólares y Total en pesos (`MXN + USD × TC`), más una fila Total. **Ambos detallado** lista cada OC pendiente: razón social, fecha, folio, factura del proveedor, tipo de pago, moneda y por pagar. Pesos y Dólares conservan Proveedor, OC pendientes, Monto adeudado, Total en pesos y Progreso.

**Respuesta vacía válida:**

```json
{
  "summary": {
    "currency": "all",
    "total_vendors": 0,
    "total_amount_pending": 0,
    "total_amount_pending_mxn": 0,
    "total_amount_pending_usd": 0,
    "total_pending_orders_mxn": 0,
    "total_pending_orders_usd": 0,
    "exchange_rate": 16.8,
    "exchange_rate_date": "2026-10-14",
    "total_amount_pending_total_mxn": 0
  },
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

**De dónde sale el monto (2026-10-19):** con costo real, `amount_pending` es el total factura de la moneda de pago menos lo pagado. Sin costo real, es el total de catálogo (recibido si la OC está Recibida; solicitado si no) menos lo pagado. El costo final (gastos operativos incluidos) no es el adeudo.

#### 2B) Detalle proveedor (modal, click fila)

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
| Moneda | `orders[i].payment_currency` |
| ID para el detalle de la OC | `orders[i].id` |

404 si ese proveedor ya no tiene saldo pendiente.

El click no navega a Órdenes de compra. El modal se queda en Cobranza. En la vista Pesos solo se listan OC en MXN; en Dólares, solo USD.

---

### Tab 3 — Cuentas por cobrar

#### 3A) Lista por razón social

```http
GET /api/tenant/accounting/accounts-receivable?page=1&limit=20&billing_branch_id={uuid}&currency=all
```

| Query param | Requerido | Notas |
|-------------|-----------|-------|
| `billing_branch_id` | No | Filtra por sucursal del almacén de la OV |
| `search` | No | Razón social o RFC |
| `currency` | No (default `all`) | `all` pesos y dólares, `mxn` solo pesos, `usd` solo dólares |
| `page`, `limit` | No | Paginación |

**Vistas UI:** Ambos / Pesos / Dólares. Cada una tiene **Descargar Excel**.

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Filas tabla | `response.data[]` |
| Razón social | `data[i].razon_social`. El RFC (`fiscal_rfc`) va debajo, en badge |
| RFC | `data[i].fiscal_rfc` |
| Por cobrar MXN + badge OV | `data[i].amount_pending_mxn`, `data[i].pending_order_count_mxn` |
| Por cobrar USD + badge OV | `data[i].amount_pending_usd`, `data[i].pending_order_count_usd` |
| Tipo de cambio del día | `response.summary.exchange_rate`. Fecha: `summary.exchange_rate_date` |
| Total en pesos | `data[i].amount_pending_total_mxn`. Tarjeta: `summary.total_amount_pending_total_mxn` |
| Totales | `summary.total_accounts`, `total_amount_pending_mxn`, `total_amount_pending_usd`, `total_pending_orders_mxn`, `total_pending_orders_usd` |

En **Ambos** el total es `MXN + USD × exchange_rate`. En **Pesos** es solo MXN. En **Dólares** es `USD × exchange_rate`. Sin tipo de cambio y con dólares, el total es `null`.

**Excel:**

```http
GET /api/tenant/accounting/accounts-receivable/export/excel?currency=all
```

| `currency` | Archivo |
|------------|---------|
| `all` | `cuentas-por-cobrar-YYYY-MM-DD.xlsx` con hojas **Ambos**, **Ambos detallado**, **Pesos MXN** y **Dólares USD** |
| `mxn` | `cuentas-por-cobrar-mxn-YYYY-MM-DD.xlsx` |
| `usd` | `cuentas-por-cobrar-usd-YYYY-MM-DD.xlsx` |

Arriba de cada hoja va el tipo de cambio del sistema. La hoja **Ambos** trae por cobrar en pesos, por cobrar en dólares y total en pesos, más una fila Total. **Ambos detallado** lista cada orden pendiente: razón social, fecha, folio, factura, tipo de pago, moneda y por cobrar.

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
| Total debe MXN | `response.amount_pending_mxn` |
| Total debe USD | `response.amount_pending_usd` |
| # órdenes | `response.pending_order_count`, `pending_order_count_mxn`, `pending_order_count_usd` |
| Filas | `response.orders[]` |
| Moneda de la OV | `orders[i].currency` (`MXN` o `USD`). El `total` está en esa moneda |
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

## Tab 1 — Caja del día

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
| Crédito | `credit_count` | Cobros con importe a crédito | El chip Crédito del modal manda `payment_method=credit` |
| Cortes globales | `daily_shifts_count` | Cortes del día abiertos/cerrados en el periodo | Click → listado consultable (`GET pos-daily-shifts`) |
| Cortes parciales | `partial_shifts_count` | Retiros parciales en el periodo | Click → listado de parciales; **Ver corte** abre el detalle |
| Corte abierto | `open_daily_shift` | Corte `open` cuya `shift_date` cae en el día o rango consultado. Un corte abierto de otro día no se pinta aquí | Click → mismo listado y abre el detalle. Si `is_previous_day === true`, chip rojo “Sin cerrar desde {shift_date}” |

**Definición "facturada" vs "Público en General":**

| Tipo | Regla backend | `customer_type` |
|------|---------------|-----------------|
| Todas | Sin filtro de cliente | `all` |
| Público en General | Cliente mostrador **y** la orden **no** tiene CFDI timbrado | `walk_in` |
| Facturada | La orden tiene al menos un CFDI con `stamp_status` en `stamped`, `cancel_pending` o `cancelled` | `invoiced` |

> **Importante:** ya no basta con que el cliente sea distinto de “Público en General”. **Facturada** = timbrado real en `electronic_invoices`.

> **Nota:** el total cobrado es del **corte de ese día** (`pos_daily_shifts.shift_date`). Un cobro hecho después de medianoche sobre el corte de ayer sigue en el corte de ayer y no entra en Hoy. La hora de la orden se muestra en `America/Tijuana`. `YYYY-MM-DD` no se parsea con `new Date`, porque en esta zona eso cae en el día anterior.

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
| `payment_method` | No | `cash`, `transfer`, `card`, `check`, `credit` |
| `page` / `limit` | No | Paginación |

**Qué leer:**

| UI | Path JSON |
|----|-----------|
| Título modal | `Cobranza — {terminal_name}` |
| Subtítulo | `{total} órdenes cobradas en el periodo` |
| Filas | `response.data[]` |
| Folio / ID orden | `data[i].folio` / `data[i].id` |
| Fecha venta | `data[i].created_at` |
| Fecha pago | `data[i].payment_date` | Día del abono (`YYYY-MM-DD`). `null` si aún no hay pago |
| Fecha cobro | `data[i].collected_at` |
| Cliente empresa | `data[i].customer_company_name` |
| Cliente persona | `data[i].customer_person_name` |
| Es mostrador | `data[i].is_walk_in` |
| CFDI timbrado | `data[i].has_stamped_invoice` |
| Vendedor | `data[i].seller_user` |
| Cajero | `data[i].collected_by_user` |
| Método pago | `data[i].payment_method` |
| Etiqueta método | `data[i].payment_method_label` | `Efectivo`, `Tarjeta`, `Mixto` |
| Detalle mixto | `data[i].payment_breakdown_label` | `Efectivo + Tarjeta`. Igual al label si es una sola forma |
| Total | `data[i].total` |
| Estatus pago | `data[i].payment_status` |

**Modal (mismo layout que detalle de terminal de venta):**

```
┌─────────────────────────────────────────────────────────────┐
│ Cobranza — POS Caja Terminal 1                     ✕   │
│ 7 órdenes cobradas en el periodo seleccionado               │
├─────────────────────────────────────────────────────────────┤
│ [ Todas (7) ]  [ Público en General (2) ]  [ Facturadas (5)]│
├─────────────────────────────────────────────────────────────┤
│ FOLIO      FECHA VENTA  FECHA PAGO   FECHA COBRO  CLIENTE  TOTAL  PAGO  │
│ OSV-000010 25 jun 2026  25 jun 2026  25 jun 2026  Sinergy  $12.95 Pagado │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Filtros del modal (tabs o chips):**

| Chip UI | `customer_type` | Count desde resumen |
|---------|-----------------|---------------------|
| Todas | `all` | `orders_collected` |
| Público en General | `walk_in` | `walk_in_count` |
| Facturadas | `invoiced` | `invoiced_count` |
| Crédito | `payment_method=credit` | `collection_terminal.credit_count` |

Crédito no reemplaza el tipo de cliente: se puede ver, por ejemplo, facturadas a crédito. El ícono va en cada chip. Al cambiar chip de cliente → volver a llamar `pos-collections` con el mismo periodo/sucursal y el nuevo `customer_type`.

**Columnas sugeridas:**

| Columna | Campo |
|---------|-------|
| Folio | `folio` (click → `GET /sales-orders/{id}`). Si `total` > 0, el ojo abre `GET /sales-orders/{id}/ticket-recibo` |
| Fecha venta | `created_at` |
| Fecha pago | `payment_date` (último abono; vacío si la orden sigue sin pago) |
| Fecha cobro | `collected_at` (útil para ver por qué hay más cobros que ventas) |
| Cliente | 2 líneas: `customer_company_name` arriba, `customer_person_name` abajo; chip Mostrador si `is_walk_in` |
| Vendedor | `seller_user.first_name` + `last_name` (sin código) |
| Cajero | `collected_by_user.first_name` + `last_name` (sin código) |
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

## Tab — Cobros (todas las órdenes por sucursal)

Vista de listado (no modal). Sucursal obligatoria, **Descargar Excel**. El periodo se aplica a la **fecha de cobro** (`America/Tijuana`), no a la fecha del corte: un cobro del 5 de octubre no entra en el rango del 29 aunque el corte siga abierto desde ese día. `shift_date` viaja en la fila para mostrarlo cuando no coincide con el cobro.

```
GET /api/tenant/accounting/pos-collections
  ?billing_branch_id={uuid}
  &period=range
  &date_from=2026-09-29
  &date_to=2026-09-29
  &date_basis=collected
  &customer_type=all
  &credit_scope=paid
  &search=OV-000123
  &page=1&limit=20
```

| Query | Requerido | Notas |
|-------|-----------|-------|
| `billing_branch_id` | Sí | Sucursal del corte donde se cobró |
| `period` | No (default `month`) | `today`, `week`, `month`, `range` |
| `date_from` / `date_to` | Si `period=range` | ISO date |
| `date_basis` | No (default `shift`) | En esta pestaña enviar `collected`. `shift` queda para el modal de Puntos de venta |
| `customer_type` | No | `all`, `walk_in`, `invoiced` |
| `payment_method` | No | `cash`, `transfer`, `card`, `check`, `credit`. Se combina con el tipo de cliente |
| `credit_scope` | No | `paid` en esta pestaña: todas las ventas cobradas y, de crédito, solo abonos. Sin el parámetro el listado sigue trayendo también el cargo a crédito |
| `for_shipping` | No | `true` deja solo ventas marcadas para envío. `summary.shipping_count` y `summary.shipping_amount` no cambian con ese filtro |
| `search` | No | Folio, cliente, nombre/RFC de mostrador |
| `page` / `limit` | No | Paginación |

`summary` (ignora chip y búsqueda): `orders_collected`, `amount_collected`, `walk_in_count`, `invoiced_count`, `by_payment_method`. `filtered_amount` respeta chip y búsqueda. `filters_applied.date_from` / `date_to` es el rango que aplicó el servidor. `data[i].billing_branch`: `{ id, code, city, label }` de la venta (si no hay, almacén y luego sucursal del corte).

`by_payment_method` (2026-11-23, `credit_scope=paid`): `{ cash, transfer, card, check, credit }`. Cada uno: `orders` y `amount` (MXN). Ya no trae `ticket`. Efectivo, transferencia, tarjeta y cheque suman el importe de esa forma, incluidos los abonos pagados así. Un mixto reparte el monto. Crédito cuenta solo abonos ya cobrados (el mismo importe también está en la forma con que se pagó). El cargo a crédito sin abono no entra. Las tarjetas las muestra la pestaña a quien tiene `Accounting:Read`.

`payment_method` (opcional): `cash | transfer | card | check | credit`. Filtra la lista, `filtered_amount` y el Excel. `summary` no cambia: las columnas y los conteos de los chips siguen siendo del periodo completo. Sin valor, entran todas las formas. Volver a pulsar la forma activa la quita.

**UI:** tarjetas de Efectivo, Transferencia, Tarjeta, Cheque y Crédito (Ventas y Monto) y chips Todas / Público en General / Facturadas. Pulsar una tarjeta filtra `payment_method`; volver a pulsarla lo quita. Buscador y tabla: folio, fechas, sucursal, cliente, vendedor y cajero, pago con badge. Si es mixto, debajo van las formas (`payment_breakdown_label`). Si la fila es un abono, lleva la etiqueta Abono y `total` es el importe de ese pago; `id` es el pago y `sales_order_id` abre la orden. Click folio → detalle de OV. Si `total` es mayor a 0, el ojo abre el ticket. `payment_date` del abono es el día de ese pago.

Pago (2026-11-02): el badge usa `payment_method_label`. Si el cobro de POS Caja es mixto, debajo va `payment_breakdown_label` (`Efectivo + Tarjeta`, `Tarjeta + Cheque`, `Tarjeta + Tarjeta`, etc.). Una sola forma no repite el texto. El Excel escribe ese detalle en Método de pago.

**Excel (mismos filtros, sin paginación):**

```
GET /api/tenant/accounting/pos-collections/export/excel
  ?billing_branch_id={uuid}&period=month&customer_type=all
```

Respuesta: `.xlsx` (`cobranza-pos-YYYY-MM-DD.xlsx`). Columnas: Folio, Venta (Anticipo, Crédito o Contado), Sucursal, Fecha venta, Fecha pago, Fecha cobro, Fecha corte, Cliente, RFC ticket, Tipo, Vendedor, Cajero, Método de pago, Total, Anticipo, Pendiente, Estatus pago, Para envío. En un abono, Método de pago lleva `Abono ·` más la forma (`Abono · Efectivo`) y Total es el importe de ese pago. Un mixto usa el desglose (`Efectivo + Tarjeta`). La pestaña manda `credit_scope=paid`.

---

## Tab 2 — Cuentas por pagar

No filtra por sucursal. Mes y Rango recortan las órdenes pendientes por su fecha de alta. Sin `period`, el saldo es el completo.

### API lista

```
GET /api/tenant/accounting/accounts-payable
  ?search=proveedor
  &currency=all
  &period=month
  &page=1&limit=20
```

`currency`: `all` (default), `mxn` o `usd`. `period`: `month` o `range` (`date_from`, `date_to`).

### UI

Tres vistas, una a la vez: **Ambos**, **Pesos**, **Dólares**. Cada una descarga su Excel.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [ Ambos | Pesos | Dólares ]                      [ Descargar Excel ]│
├──────────────────────────────────────────────────────────────────────┤
│  Razón social  Adeudado MXN    Adeudado USD    TC      Total MXN   Progreso │
│  Maderas SA    $45,000  3 OC   US$1,200  1 OC  16.80   $65,160     MXN ██   │
└──────────────────────────────────────────────────────────────────────┘
```

Tarjetas: proveedores con saldo, adeudado en pesos, adeudado en dólares y **Total en pesos** (con el TC del día).

| Columna | Campo | Notas |
|---------|-------|-------|
| Razón social | `razon_social` / `company_name` / `vendor_name` | Click abre las OC pendientes del periodo. El nombre comercial va debajo |
| Monto adeudado en pesos | `amount_pending_mxn` | Badge `pending_order_count_mxn` OC. Solo en Ambos y Pesos |
| Monto adeudado en dólares | `amount_pending_usd` | Badge `pending_order_count_usd` OC. Solo en Ambos y Dólares |
| Tipo de cambio | `summary.exchange_rate` | TC USD→MXN del día. Misma cifra en todas las filas |
| Total en pesos | `amount_pending_total_mxn` | Ambos: MXN + USD × TC. Pesos: solo MXN. Dólares: USD × TC |
| Progreso | `progress_percentage_mxn` / `progress_percentage_usd` | Ambos: dos barras. Pesos o Dólares: una barra |

**Progress bar:**

- MXN: si el proveedor tiene `credit_limit` → `amount_pending_mxn / credit_limit * 100`. Si no → `amount_pending_mxn / total_committed_mxn * 100`
- USD: `amount_pending_usd / total_committed_usd * 100`. El límite de crédito no tiene moneda, así que no se usa en dólares
- Color: verde < 50%, amarillo 50–80%, rojo > 80%

**Search:** filtra por `name`, `razon_social` o `company_name` del proveedor (debounce 300ms). La descarga respeta la búsqueda, la vista activa y el periodo.

**Excel:**

```
GET /api/tenant/accounting/accounts-payable/export/excel?currency=all
```

En `all`, la primera hoja es **Ambos** (pesos, dólares y total al tipo de cambio del sistema) y siguen **Pesos MXN** y **Dólares USD**. En `mxn` o `usd`, una sola hoja. Arriba de cada hoja va el tipo de cambio del sistema y su fecha.

### Detalle proveedor (modal)

Click en fila abre un modal en la misma pantalla de Cobranza:

```
GET /api/tenant/accounting/accounts-payable/vendors/{vendorId}
```

Tabla de órdenes de compra pendientes:

| Folio OC | Fecha | Entrega esperada | Moneda | Pagado | Pendiente | Estatus |
|----------|-------|------------------|--------|--------|-----------|---------|

Link folio → modal de detalle de la orden de compra (no cambia de ruta).

---

## Tab 3 — Cuentas por cobrar

**Vista única: por razón social** (no listar órdenes sueltas en el nivel principal).

Opcional: filtrar por sucursal con el mismo dropdown superior (`billing_branch_id`).

### API lista

```
GET /api/tenant/accounting/accounts-receivable
  ?billing_branch_id={uuid}   (opcional)
  &search=ROMR960614
  &currency=all
  &page=1&limit=20
```

`currency`: `all` (default), `mxn` o `usd`.

### UI

El buscador va en la barra superior, **a la izquierda de Sucursal**. En la pestaña: **Ambos / Pesos / Dólares** y **Descargar Excel**. No hay enlace a flujo de deuda en esta vista: esa sección es la pestaña **Flujo de deuda**.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [ Ambos | Pesos | Dólares ]                      [ Descargar Excel ]│
├──────────────────────────────────────────────────────────────────────┤
│  Razón social              Pesos          Dólares     TC    Total  │
│  ROMERO SA                $28,500  2 OV  US$100  1 OV 16.80 $30,180│
│  [ROMR960614]                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

Tarjetas: cuentas con saldo, por cobrar en pesos, por cobrar en dólares y **Total en pesos** (con el TC del sistema).

| Columna | Campo | Notas |
|---------|-------|-------|
| Razón social | `razon_social` | Texto compacto. El clic en cualquier columna de la fila abre las OV pendientes |
| RFC | `fiscal_rfc` | Badge debajo de la razón social. Sin RFC: «Sin RFC» |
| Por cobrar en pesos | `amount_pending_mxn` | Badge `pending_order_count_mxn` OV. Solo en Ambos y Pesos |
| Por cobrar en dólares | `amount_pending_usd` | Badge `pending_order_count_usd` OV. Solo en Ambos y Dólares |
| Tipo de cambio | `summary.exchange_rate` | TC USD→MXN del sistema |
| Total en pesos | `amount_pending_total_mxn` | Ambos: MXN + USD × TC. Pesos: solo MXN. Dólares: USD × TC |

**Search:** filtra por razón social o RFC. La descarga respeta la búsqueda, la sucursal y la vista activa.

**Excel** `GET /tenant/accounting/accounts-receivable/export/excel?currency=all`. En `all`, la primera hoja es **Ambos**, sigue **Ambos detallado** y después **Pesos MXN** y **Dólares USD**. Arriba de cada hoja va el tipo de cambio del sistema.

**Ambos detallado** (también en cuentas por pagar): razón social, fecha, folio, factura, tipo de pago, moneda y monto. Las órdenes de la misma razón social van juntas, de la más antigua a la más reciente. En cobrar, la factura es el folio fiscal timbrado y el tipo de pago sale de los cobros (o Crédito / Pendiente). En pagar, la factura es el número de factura del proveedor y el tipo de pago sale de los abonos de la OC.

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
- Adeudo MXN (`amount_pending_mxn`) y USD (`amount_pending_usd`)
- Cantidad de órdenes por moneda

Tabla de órdenes:

| Folio | Fecha | Cliente | Vendedor | Moneda | Total | Entrega |
|-------|-------|---------|----------|--------|-------|---------|

`orders[i].currency` es `MXN` o `USD`. `orders[i].total` está en esa moneda.

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
| POS cobranza Excel | `GET /tenant/accounting/pos-collections/export/excel` | Accounting:Read |
| POS cortes sucursal | `GET /tenant/accounting/pos-daily-shifts` | Accounting:Read |
| POS detalle corte | `GET /tenant/accounting/pos-daily-shifts/:id` | Accounting:Read |
| CxP lista | `GET /tenant/accounting/accounts-payable` | Accounting:Read |
| CxP Excel | `GET /tenant/accounting/accounts-payable/export/excel` | Accounting:Read |
| CxP detalle | `GET /tenant/accounting/accounts-payable/vendors/:vendorId` | Accounting:Read |
| CxC lista | `GET /tenant/accounting/accounts-receivable` | Accounting:Read |
| CxC Excel | `GET /tenant/accounting/accounts-receivable/export/excel` | Accounting:Read |
| CxC detalle | `GET /tenant/accounting/accounts-receivable/by-razon-social/:razonSocial/orders` | Accounting:Read |
| Ventas a costo promedio | `GET /tenant/accounting/average-cost-report` | Accounting:Read |
| Ventas a costo promedio Excel | `GET /tenant/accounting/average-cost-report/export/excel` | Accounting:Read |
| Sucursales | `GET /tenant/billing/branches` | FiscalConfiguration:Read |
| Detalle OV | `GET /tenant/sales-orders/:id` | SalesOrders existente |

---

## Rep. Vent. Cost. Prom

Pestaña `average-cost`. Título corto en el menú: **Rep. Vent. Cost. Prom**. Usa la sucursal y el periodo de Cobranza (hoy, semana, mes o rango).

Una fila por documento de venta cobrado o a crédito. El costo es la salida del kardex de esa orden, al costo del lote. Si el kardex no trae costo unitario, se usa el costo del lote (costo real en pesos, o el costo de compra). Si el lote tampoco tiene costo, se usa el costo promedio del producto en pesos. Si la orden está cancelada, el reporte deja el documento original y agrega la cancelación: el importe sigue positivo y el impuesto, el total de venta y el costo van en negativo.

| Tipo | Documento |
|------|-----------|
| 1 | Recibo. Venta de contado sin factura timbrada |
| 2 | Dev. efectivo. Reservado; este reporte no lo emite |
| 3 | Cancelación de recibo |
| 5 | Recibo a crédito, sin factura timbrada |
| 6 | Factura. Hay CFDI de ingreso timbrado (también si después se canceló) |
| 7 | Nota de crédito. El importe, el impuesto y el total van en negativo |
| 8 | Cancelación de factura |
| 9 | Cancelación de nota de crédito. Revierte la nota |
| 18 | Apartado. Reservado; este reporte no lo emite |
| 19 | Abono o anticipo. CFDI de anticipo, sin costo de inventario |

| Estatus | Significado |
|---------|-------------|
| 1 | Contado |
| 2 | Crédito, saldo abierto |
| 3 | Cancelado |
| 4 | Pagado. Era crédito y ya se liquidó |
| 5 | Devolución. Nota de crédito |

| Columna | Origen |
|---------|--------|
| Cliente | Razón social de la orden, o el nombre de mostrador |
| Documento | Folio de la orden. En nota y anticipo, serie y folio del CFDI |
| Fecha | Día de la venta en America/Tijuana. La cancelación usa el día en que se canceló |
| Importe | Subtotal, antes de descuento e impuesto |
| Descto | Descuento de línea más descuento global |
| Impuesto | IVA + IEPS |
| Moneda | Moneda original. `MXN`, o `USD` con el tipo de cambio de esa venta |
| Total venta | Total del documento, convertido a pesos con el tipo de cambio de esa venta |
| Total costo | Costo MXN del kardex (`sale` o `sale_reversal`). Si el snapshot viene en cero, costo del lote; si el lote no tiene costo, costo promedio del producto en pesos |
| Margen | Precio sin impuesto − costo. `margin_amount` en pesos y `margin_percent` sobre ese precio. Null si el precio sin impuesto es 0 |

La utilidad del resumen es total de venta − impuesto − costo. `summary.margin_percent` es esa utilidad sobre el precio sin impuesto. Importe, descuento, impuesto, total, costo y margen van en pesos. `source_currency` y `exchange_rate` dicen si el documento nació en dólares y con qué tasa se convirtió. Si la venta en dólares no trae tasa, se usa la del día de esa venta. Sin tasa, el importe se queda en dólares y el resumen marca `has_foreign_currency`.

| Acción | Endpoint |
|--------|----------|
| Lista | `GET /tenant/accounting/average-cost-report?billing_branch_id&period&date_from&date_to&page&limit&search` |
| Excel | `GET /tenant/accounting/average-cost-report/export/excel` con los mismos filtros |

---

## Checklist implementación UI

- [ ] Entrada de menú con permiso `Accounting:ViewMenu`
- [ ] Componente periodo reutilizado de Reporte Ventas Zona Norte
- [ ] Dropdown sucursal con `billing-branches/all`
- [ ] Tab 1: tabla terminales + card cobranza + drill-down ventas y órdenes cobradas (`pos-collections` con filtro `customer_type`)
- [ ] Tab Cobranza POS: listado de todas las órdenes cobradas por sucursal + periodo + **Descargar Excel**
- [ ] Tab CxP: vistas Ambos / Pesos / Dólares, badge de OC en el monto, dos barras en Ambos y Excel por vista
- [ ] Tab CxC: lista por razón social + drawer con órdenes pendientes
- [ ] Detalle sales order: mostrar `seller_user`, `terminal_user`, `collected_by_user`
- [ ] Reporte ventas: validar columna vendedor post-fix backend
- [ ] POS ventas: confirmar envío de `seller_user_id` en create

---

## Cambios — 2026-10-14

Cuentas por cobrar: el buscador quedó a la izquierda de la sucursal. Se quitó el enlace «Ver flujo de deuda» de esa vista; la pestaña superior ya abre el flujo.

Rep. Vent. Cost. Prom: la pestaña de Cobranza lista ventas a costo promedio (cliente, documento, fecha, tipo, estatus, importe, descuento, impuesto, total de venta y costo). Ya no es el listado de artículos con pedimento.

Rep. Vent. Cost. Prom: cada línea trae `margin_amount` y `margin_percent` (precio sin impuesto − costo). El tipo y el estatus se muestran como badge. Si el kardex no tiene costo unitario, el costo sale del lote; si el lote tampoco tiene, del costo promedio del producto en pesos.

Rep. Vent. Cost. Prom: la columna Moneda muestra `MXN` o `USD` con el tipo de cambio de esa venta. Importe, descuento, impuesto, total, costo y margen van convertidos a pesos.
