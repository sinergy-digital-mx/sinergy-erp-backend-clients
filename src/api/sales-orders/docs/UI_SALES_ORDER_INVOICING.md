# UI — Tab Facturación (CFDI) en detalle de orden de venta

Guía de implementación para Pollux. Una OV puede tener **varias facturas** timbradas.

**Prerequisito:** módulo `electronic_invoicing` habilitado para el cliente y permisos asignados al rol.

**Config Finkok por cliente:** ver `src/api/electronic-invoicing/docs/UI_FINKOK_CONFIGURATION.md` (sección global en Configuración Fiscal, no por razón emisora).

---

## 1. Dónde va en pantalla

### Detalle de orden de venta

Agregar tab **Facturación** en el detalle de OV, al mismo nivel que **Pagos**, **Documentos**, etc.

```
┌─────────────────────────────────────────────────────────────┐
│  OV #1042 · Cliente X · Total $1,160.00                    │
│  [General] [Líneas] [Pagos] [Documentos] [Facturación] ← NEW│
├─────────────────────────────────────────────────────────────┤
│  Resumen: 2 facturas · 1 vigente · 0 pendientes sync        │
│  [+ Nueva factura]                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ UUID          Serie-Folio  Total    Timbrado  SAT    │   │
│  │ 6C3C0C87…     A-1042       1160.00  ✓         Vigente│   │
│  │ [Sync SAT] [Cancelar] [Ver XML]                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

Al entrar al tab, cargar:

```http
GET /api/tenant/sales-orders/{id}/invoices
```

Permiso: `electronic_invoices:Read`

---

## 2. Datos que debe tomar de la orden (preview / wizard)

Al abrir **Nueva factura**, usar el detalle OV ya cargado (`GET /api/tenant/sales-orders/{id}`) para mostrar un **resumen de facturación** (solo lectura) antes de timbrar.

### 2.1 Emisor (desde la OV)

| Campo UI | Origen en API | Uso CFDI |
|----------|---------------|----------|
| Razón social emisora | `data.header.fiscal_configuration.razon_social` o `fiscal_razon_social` | `cfdi:Emisor/@Nombre` |
| RFC emisor | `data.header.fiscal_configuration.rfc` | `cfdi:Emisor/@Rfc` |
| Régimen fiscal | `data.header.fiscal_configuration.fiscal_regime` | `cfdi:Emisor/@RegimenFiscal` |
| Lugar expedición | `data.header.warehouse` → `zip_code` o sucursal fiscal del almacén | `cfdi:Comprobante/@LugarExpedicion` |
| Estado Finkok emisor | `data.header.fiscal_configuration.finkok_registration_status` | Validación UI |

Si `finkok_registration_status !== 'registered'` → bloquear timbrado y mostrar link a editar razón emisora.

### 2.2 Receptor (desde cliente de la OV)

| Campo UI | Origen en API | Uso CFDI |
|----------|---------------|----------|
| RFC receptor | `data.header.customer.fiscal_rfc` | `cfdi:Receptor/@Rfc` |
| Razón social | `data.header.customer.fiscal_razon_social` | `cfdi:Receptor/@Nombre` |
| Uso CFDI | Campo editable en wizard (catálogo SAT) | `cfdi:Receptor/@UsoCFDI` |
| Domicilio fiscal | `data.header.customer.fiscal_zip_code` (si existe) | CFDI 4.0 `DomicilioFiscalReceptor` |
| Régimen receptor | Selector en wizard | CFDI 4.0 `RegimenFiscalReceptor` |

Si `fiscal_rfc` vacío → bloquear y link a editar cliente.

### 2.3 Totales (desde header OV)

| Campo UI | Origen | Uso CFDI |
|----------|--------|----------|
| Subtotal | `data.header.subtotal` | `@SubTotal` |
| Descuento | `data.header.discount_total` | `@Descuento` |
| IVA total | `data.header.iva_total` | Impuestos traslados |
| IEPS total | `data.header.ieps_total` | Impuestos (si aplica) |
| Total | `data.header.total` | `@Total` |
| Moneda | `MXN` (default) | `@Moneda` |
| Forma de pago | Selector wizard (`01` efectivo, `03` transferencia, etc.) | `@FormaPago` |
| Método de pago | `PUE` o `PPD` según `payment_status` | `@MetodoPago` |

Sugerencia UI:
- Si `payment_status === 'Pagado'` → default `MetodoPago = PUE`
- Si `Pendiente` → default `PPD` o advertir al usuario

### 2.4 Conceptos (desde líneas)

Por cada `data.line_items[]`:

| Campo UI | Origen | Uso CFDI |
|----------|--------|----------|
| Clave prod/serv | `line_item.product.sat_clave` | `@ClaveProdServ` |
| Cantidad | `line_item.quantity` | `@Cantidad` |
| Clave unidad | UOM del producto (catálogo SAT) | `@ClaveUnidad` |
| Unidad | `line_item.uom_name` | `@Unidad` |
| Descripción | `line_item.product.name` | `@Descripcion` |
| Valor unitario | `line_item.unit_price` | `@ValorUnitario` |
| Importe | `qty × price − descuento línea` | `@Importe` |
| Descuento línea | calcular de `discount_percentage` / `discount_unit` | `@Descuento` |
| IVA % | `line_item.iva_percentage` | Traslados |
| IEPS % | `line_item.ieps_percentage` | Traslados |
| Objeto impuesto | `02` si tiene IVA/IEPS, `01` si no | `@ObjetoImp` |

Mostrar tabla editable solo para campos que el usuario pueda ajustar antes de timbrar (serie, folio, uso CFDI, forma/método pago). Los conceptos vienen de la OV.

### 2.5 Campos editables en wizard (POST body)

| Campo | Default | Envío |
|-------|---------|-------|
| `series` | vacío o config fiscal | body |
| `folio` | `data.header.folio` | body |
| `certificate_serial` | `fiscal_configuration.certificate_serial_number` | body (opcional) |
| `xml` | Generado en frontend **o** futuro endpoint backend | body obligatorio hoy |

---

## 3. Validaciones antes de timbrar (checklist UI)

Ejecutar en este orden; si falla alguna, deshabilitar **Timbrar** y mostrar mensaje + acción:

| # | Validación | Cómo verificar |
|---|------------|----------------|
| 1 | Módulo activo | Cliente tiene `electronic_invoicing` en módulos |
| 2 | Permiso Stamp | Rol tiene `electronic_invoices:Stamp` |
| 3 | Credenciales Finkok | `GET /api/tenant/billing/finkok-configuration` → no null, `is_active = 1` |
| 4 | Ambiente | Si `environment === 'demo'` → banner amarillo |
| 5 | Razón emisora Finkok | `fiscal_configuration.finkok_registration_status === 'registered'` |
| 6 | Cliente con RFC | `customer.fiscal_rfc` presente |
| 7 | OV no cancelada | `general_status !== 'Cancelada'` |
| 8 | XML listo | Campo `xml` construido (fase actual) |

Opcional: al abrir el tab, prefetch `GET .../finkok-configuration` y cachear en contexto del módulo fiscal.

---

## 4. Endpoints del tab

Base: `/api/tenant/sales-orders/{id}`

| Acción | Método | Ruta | Permiso |
|--------|--------|------|---------|
| Listar facturas | `GET` | `/invoices` | `electronic_invoices:Read` |
| Timbrar | `POST` | `/invoices/stamp` | `electronic_invoices:Stamp` |
| Cancelar | `POST` | `/invoices/{invoiceId}/cancel` | `electronic_invoices:Cancel` |
| Sync SAT | `POST` | `/invoices/{invoiceId}/sync-sat` | `electronic_invoices:SyncSat` |
| Ver PDF timbrado | `GET` | `/invoices/{invoiceId}/pdf` | `electronic_invoices:Read` |
| **Vista previa PDF (demo)** | `GET` | `/invoices/{invoiceId}/pdf?preview=true` | `electronic_invoices:Read` |

### PDF timbrado

```http
GET /api/tenant/sales-orders/{id}/invoices/{invoiceId}/pdf
```

Solo si `stamp_status` es `stamped`, `cancel_pending` o `cancelled`. Respuesta: `{ signedUrl, fileName, s3Key }`.

### Vista previa PDF (ambiente demo Finkok)

Para ver el layout **sin timbrar** (p. ej. `stamp_error`):

```http
GET /api/tenant/sales-orders/{id}/invoices/{invoiceId}/pdf?preview=true
```

Requisitos:
- Finkok con `stamping_environment === 'demo'`
- `stamp_status` = `stamp_error` o `pending_stamp`
- La factura debe tener `xml_unsigned` (se guarda al intentar timbrar)

Respuesta incluye `"preview": true`. El PDF lleva banner amarillo *"VISTA PREVIA — no válido ante el SAT"* y no genera QR SAT.

**UI Pollux:** en filas con error de timbrado y banner demo activo, mostrar acción **"Vista previa PDF"** que llame con `?preview=true` y abra `signedUrl`.

### Timbrar

```http
POST /api/tenant/sales-orders/{id}/invoices/stamp
Content-Type: application/json
```

```json
{
  "xml": "<cfdi:Comprobante Version=\"4.0\" ...>",
  "series": "A",
  "folio": "1042",
  "certificate_serial": "30001000000400002434"
}
```

> **Fase actual:** el backend aún no genera el XML; el frontend debe armarlo con los datos del §2 o subir XML validado. En fase 2 el backend expondrá generación automática.

### Respuesta timbrado exitoso

Refrescar listado. Campos clave: `uuid`, `stamp_status = stamped`, `stamped_at`, `xml_stamped`.

### Error

`stamp_status = stamp_error` → mostrar `stamp_error_message` y `metadata.finkok_incidencias[]`.

### Cancelar

Modal con select motivo `01`–`04`. Si `01`, campo UUID sustituto obligatorio.

```json
{ "motivo": "02", "folio_sustitucion": "" }
```

### Sync SAT

Botón por fila → spinner 2–5 s → actualizar `sat_status`, `sat_es_cancelable`, `sat_last_sync_at`.

Badge sugeridos:
- `Vigente` → verde
- `Cancelado` → rojo
- `cancel_pending` / stamp → amarillo
- `stamp_error` / `cancel_error` → rojo con tooltip

---

## 5. Resumen en header del detalle OV

Opcional pero recomendado: chip junto al total.

```
Facturas: 2 · Vigentes: 1
```

Calcular desde `GET .../invoices` al cargar detalle (lazy al abrir tab también es válido).

---

## 6. Permisos y módulo

| Permiso | UI |
|---------|-----|
| `electronic_invoicing:ViewMenu` | Mostrar tab Facturación (entity = module code) |
| `electronic_invoices:Read` | Ver listado (entity = recurso API) |
| `electronic_invoices:Stamp` | Botón Nueva factura / Timbrar |
| `electronic_invoices:Cancel` | Cancelar |
| `electronic_invoices:SyncSat` | Sync SAT |

Si el módulo no está habilitado para el cliente → ocultar tab.

---

## 7. Flujo completo usuario

```
1. Admin configura Finkok (Config Fiscal → Integración Finkok)
2. Admin registra razón emisora en Finkok (modal editar razón → Registrar)
3. Usuario abre OV surtida/pagada
4. Tab Facturación → Nueva factura
5. Wizard muestra datos emisor/receptor/conceptos de la OV
6. Usuario confirma → POST stamp
7. Lista muestra UUID timbrado
8. Sync SAT manual o automático (cada 30 min) actualiza estatus
```

---

## 8. Errores comunes

| Mensaje backend | Acción UI |
|-----------------|-----------|
| No hay credenciales Finkok | Link → Config Fiscal → Integración Finkok |
| Razón emisora no registrada | Link → editar razón → Registrar en Finkok |
| Cliente sin RFC | Link → editar cliente |
| Debe enviar XML | Completar generador XML en wizard |
| Error 307 Finkok | UUID duplicado — mostrar factura existente |

---

## 9. Docs relacionados

- Config Finkok por cliente: `src/api/electronic-invoicing/docs/UI_FINKOK_CONFIGURATION.md`
- Módulo core / sync background: `src/api/electronic-invoicing/docs/UI_ELECTRONIC_INVOICING.md`
