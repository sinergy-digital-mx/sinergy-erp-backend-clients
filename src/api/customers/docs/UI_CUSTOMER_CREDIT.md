# UI — Crédito de cliente, cobro mixto, factura en POS y flag de crédito en OV

Contrato para Pollux. Backend ya guarda y valida todo esto.

---

## 1. Tab Crédito (detalle / editar cliente)

Ruta: `/customers/detail/:id` — tab **Credito**.

El crédito es **por razón social** (`fiscal_configuration_id`), no por almacén. Un cliente puede deber distinto monto en cada razón.

**Quitar el dropdown de almacenes** (Bodega, Racks, Mostrador, UUIDs). El cliente no lleva almacén: en Crear Cliente ese slot es razón social (`fiscal_razon_social`). Ver `src/api/customers/docs/UI_CUSTOMER_RAZON_SOCIAL.md`.

### Layout

Una card por cada ítem de `credits[]`. Label: `razon_social` + `rfc`. **No mostrar UUIDs.**

Si prefieren un select: opciones = razón social (value = `fiscal_configuration_id`). Nunca catálogo de almacenes.

```
┌─────────────────────────────────────────────┐
│ Maderería Zona Norte                        │
│ RFC ABC123456789                            │
│ Activar crédito          [========●]        │
│ Días de crédito          [ 30 ]             │
│ Monto de crédito         [ 15000 ]          │
│ Utilizado $3,200.50 / Límite $15,000.00     │
│ ████░░░░░░░░░░░░░░░░  21%                   │
│ Disponible $11,799.50 · 30 días             │
└─────────────────────────────────────────────┘
```

Switch **largo, delgado y elegante**. Color activo: púrpura de marca (`#4B3E8E` / `#6B46C1`).

| Estado | UI |
|--------|----|
| Off | Ocultar días, monto y barra. Mostrar “—” |
| On | Mostrar **Días de crédito**, **Monto de crédito** y barra de uso |

### Lectura

```http
GET /api/tenant/customers/:id
GET /api/tenant/customers/:id/credits
```

```json
{
  "credits": [
    {
      "fiscal_configuration_id": "uuid",
      "razon_social": "Maderería Zona Norte",
      "rfc": "MZN010101XXX",
      "fiscal_status": "active",
      "credit_enabled": true,
      "credit_days": 30,
      "credit_amount": 15000,
      "credit_used": 3200.5,
      "credit_available": 11799.5,
      "credit_usage_percent": 21.34
    }
  ]
}
```

`GET /customers/:id` incluye `credits[]` y también aplana `credit_enabled` en la raíz (la primera razón con crédito activo, o la de `?fiscal_configuration_id=`). POS actual puede seguir usando el campo de raíz.

Track gris claro, fill púrpura. Si `credit_usage_percent >= 90` → fill rojo/naranja.

### Guardar

No usar `PUT /customers/:id` para crédito.

```http
PUT /api/tenant/customers/:id/credits
```

```json
{
  "credits": [
    {
      "fiscal_configuration_id": "uuid-razon-social",
      "credit_enabled": true,
      "credit_days": 30,
      "credit_amount": 15000
    }
  ]
}
```

Se puede mandar una o varias razones. `400` si se activa sin monto, o si se desactiva una razón con saldo utilizado > 0.

Atajo mientras Pollux usa el tab viejo: `PUT /customers/:id` con `credit_enabled`, `credit_days` y `credit_amount` replica el crédito a **todas** las razones activas. `warehouse_id` **no** es crédito (solo almacén asignado).

Mostrador (`is_walk_in`) no puede tener crédito.

---

## 2. Toggle Generar factura (por cliente)

Mismo estilo de switch largo y fino. Label: **Generar factura**.

Ponerlo en **Información Fiscal** (debajo de los datos SAT) y reflejarlo en POS (sección 4).

| UI | Body |
|----|------|
| Generar factura | `auto_generate_invoice` | `true` / `false` |

Es una **preferencia**. Guardar el cliente no timbra nada.

El switch en ficha de cliente **sí se puede** dejar encendido aunque falten datos fiscales. En POS se deshabilita hasta que esté completo.

---

## 3. POS Cobranza — método Crédito

Solo si el cliente **registrado** tiene crédito **en la razón social de esa OV**.

`GET /customers/:id` → `credit_enabled === true` (y/o `pending.customer.credit_enabled`).

Si `credit_enabled === false`: no mostrar tab Crédito. El aviso *“Este cliente no tiene crédito activo”* es correcto hasta que activen el toggle, pongan días/monto y guarden.

Fuente de la razón: `fiscal_configuration_id` de la venta pendiente (no el almacén).

Pendientes ya traen:

```json
{
  "fiscal_configuration_id": "uuid-razon-social",
  "customer": {
    "credit_enabled": true
  }
}
```

`customer.credit_enabled` aquí es **solo esa razón**. Tab Crédito visible si es `true`.

Al elegir el cliente / abrir cobro:

```http
GET /api/tenant/customers/:id?fiscal_configuration_id={order.fiscal_configuration_id}
```

Esa respuesta aplana `credit_enabled`, `credit_used`, `credit_available`, etc. de **esa** razón. También trae `credits[]` completo.

### Tab / botón Crédito

Junto a Efectivo / Transferencia / Tarjeta / Mixto. Visible **solo** si `credit_enabled` de esa razón.

```
┌─────────────────────────────────────────────┐
│ Crédito · Maderería Zona Norte              │
│ Rodolfo Rodriguez                           │
│ Utilizado $3,200.50  ·  Disponible $11,799.50│
│ ████░░░░░░░░░░░░░░░░  21%                   │
│                                             │
│ [ Configurar crédito del cliente → ]        │
└─────────────────────────────────────────────┘
```

- Si `credit_available < por cobrar` → deshabilitar confirmar. Texto: *Crédito insuficiente*.
- Link **Configurar crédito del cliente** → `/customers/detail/{id}?tab=credit`. Al volver a POS, **refetch** `GET /customers/:id?fiscal_configuration_id=...`.

Payload:

```json
{
  "payment_method": "credit",
  "customer_id": 108,
  "amount_credit_mxn": 3.03
}
```

`amount_credit_mxn` puede omitirse: el backend usa el saldo pendiente.

Efecto:

- Sale de pendientes de cobranza.
- `payment_status` sigue **Pendiente** (el cliente debe).
- `is_credit: true` en la OV.
- No entra a efectivo/tarjeta/transfer del corte. `summary.credit_mxn` sí.
- El usado de **esa** razón social sube; las otras no.

Mostrador: no mostrar tab Crédito.

---

## 4. POS Cobranza — toggle Generar factura

En la card del cliente seleccionado (debajo del nombre), **el mismo switch largo y fino**.

Label: **Generar factura**.

| Condición | UI |
|-----------|----|
| Mostrador | Ocultar o deshabilitado |
| `fiscal_ready_for_invoice === false` | Switch **off y disabled**. Hint: *Completa RFC, razón social y CP (5 dígitos)* |
| `fiscal_ready_for_invoice === true` | Habilitado. Default = `auto_generate_invoice` del cliente |

Campos de `GET /customers/:id`:

```json
{
  "auto_generate_invoice": true,
  "fiscal_ready_for_invoice": true,
  "fiscal_missing_fields": []
}
```

`fiscal_missing_fields`: `fiscal_rfc` | `fiscal_razon_social` | `fiscal_postal_code`.

Al confirmar cobro, si el switch está on:

```json
{
  "generate_invoice": true,
  "customer_id": 108,
  "payment_method": "cash",
  "amount_cash_mxn": 3.03
}
```

Respuesta `invoice`:

```json
{
  "requested": true,
  "fiscal_ready": true,
  "fiscal_missing_fields": [],
  "stamp_path": "/tenant/sales-orders/{id}/invoices/stamp"
}
```

Si `invoice.requested === true`: abrir el flujo de timbrado existente (`POST .../invoices/stamp` con XML). El backend **no** arma el XML; igual que el tab Facturación de la OV.

`400` si mandan `generate_invoice: true` sin datos fiscales.

---

## 5. Mixto — elegir tipos

Tab Mixto **no** muestre siempre los 3 montos. Primero chips/checks:

`[ ] Efectivo    [ ] Transferencia    [ ] Tarjeta`

Mínimo **dos**. Al marcar, aparece el input de ese tipo (mismos campos que el tab individual: USD/cambio en efectivo, referencia en transferencia).

| Selección | `payment_method` |
|-----------|------------------|
| 1 tipo | No es mixto: usar `cash` / `transfer` / `card` |
| 2 o 3 tipos | `mixed` |

```json
{
  "payment_method": "mixed",
  "amount_cash_mxn": 500,
  "received_cash_mxn": 500,
  "amount_transfer_mxn": 330.50,
  "transfer_reference": "SPEI-789"
}
```

La suma debe igualar `amount_pending`. Mixto **no** incluye crédito. Crédito es tab aparte por el 100% del saldo.

---

## 6. Detalle de orden y listados

`is_credit` y `invoice_requested` vienen en:

- `GET /api/tenant/sales-orders` (cada fila)
- `GET /api/tenant/sales-orders/:id` → `header.is_credit`, `header.invoice_requested`
- `data.header.pos_collection.payment_method` = `credit` si se cobró así
- `data.header.pos_collection.amount_credit_mxn`

### Tabla OV del detalle de cliente (screenshot)

Columnas actuales + **Crédito**:

| Columna | Binding |
|---------|---------|
| Folio | `folio` |
| Almacén / sucursal | según listado actual |
| Estado | `general_status` |
| Total | `total` |
| Pago | `payment_status` + chip **Crédito** si `is_credit` + chip origen (`collection_channel_label`) |
| Fecha | `created_at` |

Chip: si `is_credit` → badge púrpura **Crédito**. Si además `payment_status === 'Pendiente'` → *Crédito / Pendiente de cobro*. Si ya pagaron después → *Crédito / Pagado*.

Mismo chip en listado general de OV y en detalle de la orden (junto al estatus de pago).

Filtro opcional: `GET /api/tenant/sales-orders?is_credit=true`.

---

## 7. Excel descargable de OV

Sin cambio de endpoints. Nueva columna **Crédito** (`Sí` / `No`) en cabeceras y detalle.

Modal de export: nada extra, salvo opcionalmente reusar `is_credit` del filtro del listado.

Excel de clientes: columna **Crédito por razón social** (no un solo monto global).

---

## 8. Errores POS

| HTTP | Cuándo | UI |
|------|--------|----|
| 400 | Crédito inactivo en esa razón / mostrador | “Este cliente no tiene crédito activo con esta razón social” |
| 400 | Disponible < total | “Crédito insuficiente. Disponible: $X” |
| 400 | Mixto con < 2 tipos | “Selecciona al menos dos formas de pago” |
| 400 | `generate_invoice` sin fiscal | “Completa RFC, razón social y CP del cliente” |
| 409 | Ya cobrada (incluye ya puesta a crédito) | “Esta orden ya fue cobrada” |

---

## Checklist Pollux

- [ ] **Quitar almacenes del tab Crédito.** Opciones = razones sociales (`razon_social` + `rfc`)
- [ ] Una card (o select) por `credits[]`; guardar con `PUT /customers/:id/credits`
- [ ] Toggle largo/fino **Activar crédito** por razón social
- [ ] Barra utilizado / disponible / % en ficha (por razón) y en POS
- [ ] Link POS → `/customers/detail/:id?tab=credit` y honorar `?tab=credit`
- [ ] Tab Crédito en cobro solo si `credit_enabled` de `fiscal_configuration_id` de la OV
- [ ] POS refetch: `GET /customers/:id?fiscal_configuration_id=`
- [ ] Mixto con checks Efectivo / Transfer / Tarjeta
- [ ] Toggle largo/fino **Generar factura** en ficha fiscal y en card de cliente POS
- [ ] Tras collect con `invoice.requested`, abrir timbrado
- [ ] Chip **Crédito** en detalle OV, listado OV y tabla de OV del cliente
- [ ] Excel OV muestra columna Crédito
