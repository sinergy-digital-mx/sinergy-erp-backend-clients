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
| Lugar expedición | `data.header.billing_branch.postal_code` (CP SAT de la sucursal) | `cfdi:Comprobante/@LugarExpedicion` |
| Estado Finkok emisor | `data.header.fiscal_configuration.finkok_registration_status` | Validación UI |

Si `finkok_registration_status !== 'registered'` → bloquear timbrado y mostrar link a editar razón emisora.

### 2.2 Receptor (desde cliente de la OV)

| Campo UI | Origen en API | Uso CFDI |
|----------|---------------|----------|
| RFC receptor | `data.header.customer.fiscal_rfc` | `cfdi:Receptor/@Rfc` |
| Razón social | `data.header.customer.fiscal_razon_social` | `cfdi:Receptor/@Nombre` |
| Uso CFDI | Campo editable en wizard (catálogo SAT) | `cfdi:Receptor/@UsoCFDI` |
| Domicilio fiscal | `data.header.customer.fiscal_postal_code` | CFDI 4.0 `DomicilioFiscalReceptor` |
| Régimen receptor | Selector en wizard | CFDI 4.0 `RegimenFiscalReceptor` |

Si `fiscal_rfc` vacío → bloquear y link a editar cliente.  
Si `fiscal_postal_code` vacío o no son 5 dígitos → bloquear y link a Información Fiscal del cliente.

### 2.2.1 Domicilio en el XML (Finkok / SAT CFDI 4.0)

Finkok **no** pide calle, colonia ni municipio al timbrar. El PAC valida el XML CFDI 4.0: el domicilio del receptor es **solo el CP**.

| Atributo | Valor | De dónde |
|----------|--------|----------|
| `Comprobante/@LugarExpedicion` | 5 dígitos catálogo `c_CodigoPostal` | Sucursal: `header.billing_branch.postal_code` |
| `Receptor/@DomicilioFiscalReceptor` | 5 dígitos de la CSF del RFC | Cliente: `header.customer.fiscal_postal_code` |

No poner nodo `<cfdi:Domicilio>` (eso era 3.3). Calle/colonia/municipio del cliente van en ficha y PDF, **no** en el `xml` de stamp.

```xml
<cfdi:Comprobante LugarExpedicion="22040" ...>
  <cfdi:Receptor
    Rfc="SSS2410213X9"
    Nombre="SINERGY SW SOLUTIONS"
    DomicilioFiscalReceptor="22040"
    RegimenFiscalReceptor="601"
    UsoCFDI="G03"/>
```

Reglas que Finkok aplica:

- El CP del receptor debe ser el registrado para ese RFC.
- `Nombre` debe coincidir con la lista SAT (CFDI40144).
- `LugarExpedicion` debe existir en `c_CodigoPostal` (CFDI40126). No inventar `22000`.
- Público en general (`XAXX010101000`): `DomicilioFiscalReceptor` **igual** a `LugarExpedicion`; `Nombre` = `PUBLICO EN GENERAL`; régimen `616`; uso `S01`.

`RegimenFiscalReceptor` y `UsoCFDI` sí van en el XML (wizard; aún no están en el cliente).

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

**Siempre mostrar** Subtotal, Descuento, IVA y Total, aunque el valor sea `$0.00`. No ocultar filas en ceros. En líneas, columna Descuento también en `$0.00`.

Sugerencia UI:
- Si `payment_status === 'Pagado'` → default `MetodoPago = PUE`
- Si `Pendiente` (incluye venta a crédito) → default `PPD` o advertir al usuario

POS Cobranza: si el collect responde `invoice.requested === true`, abrir este wizard / `POST /invoices/stamp` de inmediato. Ver `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`.

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
| `environment` | `localhost` → `demo`; resto → `production` | body **siempre** (`demo` \| `production`) |
| `xml` | Generado en frontend **o** futuro endpoint backend | body obligatorio hoy |

---

## 3. Validaciones antes de timbrar (checklist UI)

Ejecutar en este orden; si falla alguna, deshabilitar **Timbrar** y mostrar mensaje + acción:

| # | Validación | Cómo verificar |
|---|------------|----------------|
| 1 | Módulo activo | Cliente tiene `electronic_invoicing` en módulos |
| 2 | Permiso Stamp | Rol tiene `electronic_invoices:Stamp` |
| 3 | Credenciales Finkok **del ambiente del toggle** | `GET /api/tenant/billing/finkok-configuration` → `environments[toggle].is_active = 1` y `has_password` |
| 4 | Ambiente | Si toggle = `demo` → banner amarillo “Factura de prueba (Finkok Demo)” |
| 5 | Razón emisora Finkok | `fiscal_configuration.finkok_registration_status === 'registered'` |
| 6 | Cliente con RFC | `customer.fiscal_rfc` presente |
| 7 | CP receptor | `customer.fiscal_postal_code` 5 dígitos |
| 8 | CP expedición | `header.billing_branch.postal_code` 5 dígitos |
| 9 | OV no cancelada | `general_status !== 'Cancelada'` |
| 10 | XML listo | Campo `xml` construido (fase actual) |

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
| Descargar XML | `GET` | `/invoices/{invoiceId}/xml` | `electronic_invoices:Read` |

### PDF timbrado

Botón **PDF** junto a XML, si hay `uuid` y `stamp_status` es `stamped` | `cancel_pending` | `cancelled`.

```http
GET /api/tenant/sales-orders/{id}/invoices/{invoiceId}/pdf
```

Respuesta JSON:

```json
{ "signedUrl": "https://...", "fileName": "uuid.pdf", "s3Key": "..." }
```

Pollux: abrir `signedUrl` en pestaña nueva o `<a href={signedUrl} target="_blank">`. No uses el título `OV_FACTURA_....pdf` como archivo: es solo label.

Si no hay PDF en S3, el API lo genera en ese GET. `?regenerate=true` fuerza uno nuevo.

El PDF anterior falló porque el XML venía `&lt;cfdi:` (mismo bug que Chrome). Ya se desescapa; el primer **PDF** debe armarlo.

### XML timbrado

```http
GET /api/tenant/sales-orders/{id}/invoices/{invoiceId}/xml
```

Respuesta: archivo `application/xml` (attachment). **No** abrir `xml_stamped` del JSON en una pestaña: Finkok a veces lo deja con `&lt;` y Chrome muestra *Start tag expected*.

Pollux: `fetch` con Bearer → `blob()` → `URL.createObjectURL` → `<a download="{uuid}.xml">`. No `window.open` del JSON ni del string escapado.

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
  "environment": "demo"
}
```

`environment` es **`demo` | `production`**. **Siempre enviarlo** (el toggle del wizard). El API usa las credenciales Finkok de ese ambiente (usuario, password y WSDL). Si se omite, cae al ambiente activo global (`stamping_environment`).

`certificate_serial` es opcional. El API lo toma del XML timbrado (`NoCertificado`) al cancelar.

La respuesta incluye `metadata.finkok_environment` con el ambiente real usado. Pintar badge **DEMO** / **PROD** en cada card.

> **Fase actual:** el backend aún no genera el XML; el frontend debe armarlo con los datos del §2 o subir XML validado. En fase 2 el backend expondrá generación automática.

### Respuesta timbrado exitoso (`201`)

Solo se persiste factura si Finkok sella. Refrescar listado. Campos clave: `uuid`, `stamp_status = stamped`, `stamped_at`, `xml_stamped`.

### Error de timbrado (`400`) — no se crea fila ni PDF

Si Finkok/SAT rechaza el XML, el API **no** inserta `electronic_invoices` ni sube archivos. Respuesta Nest:

```json
{
  "statusCode": 400,
  "message": "CFDI40144: El campo Nombre del receptor, debe encontrarse en la lista de RFC inscritos no cancelados en el SAT.",
  "error": "Bad Request"
}
```

**Pollux:**

1. Quedarse en el wizard / modal. **No** refrescar el tab como si hubiera factura nueva.
2. Toast/alert **error** con `error.response.data.message` (texto SAT, p. ej. CFDI40144).
3. **No** pintar cards “FACTURA / DEMO / Error de timbrado”, UUID vacío, ni “Vista previa PDF”. Eso no es CFDI.
4. El usuario corrige receptor (nombre legal CSF, CP, régimen) o XML y vuelve a **Timbrar**.
5. En `GET .../invoices`, **ocultar** filas históricas `stamp_error` / `pending_stamp` (intentos viejos). Mostrar solo `stamped`, `cancel_pending`, `cancelled`, `cancel_error`.

En la terminal del API: `WARN Finkok Sign_Stamp rechazado [CFDI40144]: ...`

### Cancelar

Mostrar **Cancelar** solo si `stamp_status` es `stamped` o `cancel_pending` **y** hay `uuid`.

Modal con select motivo `01`–`04`. Si `01`, campo UUID sustituto obligatorio.

```json
{ "motivo": "02", "folio_sustitucion": "" }
```

### Sync SAT

Botón **Sincronizar SAT** en cada card con `uuid` y `stamp_status` `stamped` | `cancel_pending` | `cancelled` | `cancel_error`.  
Permiso: `electronic_invoices:SyncSat`. Sin permiso → ocultar.

```http
POST /api/tenant/sales-orders/{orderId}/invoices/{invoiceId}/sync-sat
```

Body vacío. Respuesta `200`: la factura actualizada.

| Pintar | Campo |
|--------|--------|
| Badge SAT | `sat_status` (`Vigente` / `Cancelado` / `No Encontrado` / `Desconocido`) |
| ¿Cancelable SAT? | `sat_es_cancelable` |
| Estatus cancel. SAT | `sat_estatus_cancelacion` |
| Cód. estatus SAT | `sat_codigo_estatus` |
| Verificación SAT | `sat_last_sync_at` |

Si SAT confirma `Cancelado` → `stamp_status` pasa a `cancelled` (el badge sistema deja de ser “Cancelación pendiente”).

Caso de la pantalla: sistema `cancel_pending` + SAT `Vigente` es normal tras `sign_cancel` 201. El botón consulta Finkok `get_sat_status` (y si falla, WS SAT). En **demo** el SAT productivo a veces no ve el UUID (`No Encontrado`); no es un bug de Pollux.

Spinner 2–5 s. `400` si no hay UUID.

Badge sugeridos:
- `Vigente` → verde
- `Cancelado` → rojo
- `cancel_pending` → amarillo
- `cancel_error` → rojo con tooltip

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
6. Usuario elige Demo/Prod (default por hostname) → POST stamp con `environment`
7. Lista muestra UUID timbrado
8. Sync SAT manual o automático (cada 30 min) actualiza estatus
```

---

## 8. Errores comunes

| Mensaje backend | Acción UI |
|-----------------|-----------|
| No hay credenciales Finkok | Link → Config Fiscal → Integración Finkok |
| `No hay credenciales Finkok activas para el ambiente demo/production` | El toggle apunta a un ambiente sin credenciales. Link → Integración Finkok. |
| Razón emisora no registrada | Link → editar razón → Registrar en Finkok |
| Cliente sin RFC | Link → editar cliente |
| Debe enviar XML | Completar generador XML en wizard |
| `400` + `CFDI40144` (u otro CFDI40xxx) | Toast con el `message`. Corregir XML/receptor (nombre SAT exacto, CP, régimen). No hay fila que cancelar. |
| Solo se pueden cancelar facturas timbradas | No mostrar Cancelar si no hay UUID. |
| Error 307 Finkok | UUID duplicado — mostrar factura existente |

---

## 9. Toggle Demo / Producción al timbrar (obligatorio)

El ambiente Finkok **ya no es solo global**. En el wizard **Nueva factura** hay un switch **Demo / Producción** por factura. No llama `PATCH /stamping-environment`: es override de ese timbrado.

Config Fiscal sigue teniendo credenciales **demo** y **production** por separado (`GET /api/tenant/billing/finkok-configuration`). El toggle elige cuál se usa.

### 9.1 Default del toggle (solo frontend)

```ts
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const defaultEnvironment: 'demo' | 'production' = isLocal ? 'demo' : 'production';
```

| Host UI | Default toggle |
|---------|----------------|
| `localhost` / `127.0.0.1` | **Demo** |
| cualquier otro (staging/prod) | **Producción** |

El usuario **puede cambiarlo** en localhost (timbrar prod de verdad) y en prod (hacer una de prueba en demo).

Si el default no tiene credenciales (`environments[default]` es `null`, `is_active !== 1` o `!has_password`): dejar el toggle en ese valor, **deshabilitar Timbrar** y mensaje + link a Config Fiscal. No cambiar el default en silencio.

### 9.2 UI del wizard

```
┌─ Nueva factura ─────────────────────────────────────────────┐
│  Ambiente Finkok                                            │
│  [ Demo ● ]  [ Producción ○ ]                               │
│                                                             │
│  ⚠ Factura de prueba — PAC demo, sin validez fiscal         │  ← solo si Demo
│  ⚠ CFDI real ante el SAT                                    │  ← solo si Prod
│                                                             │
│  Usará: usuario Finkok “madera” (demo)                      │
│  [Timbrar]                                                  │
└─────────────────────────────────────────────────────────────┘
```

| Elemento | Comportamiento |
|----------|----------------|
| Segmented control / switch | Valores `demo` \| `production`. Editable siempre. |
| Opción sin credenciales | Deshabilitar esa opción **o** dejarla seleccionable pero bloquear Timbrar. Texto: “Faltan credenciales Finkok de Demo/Producción”. Link → Config Fiscal → Integración Finkok. |
| Banner Demo | Amarillo. “Factura de prueba (Finkok Demo). No tiene validez fiscal.” |
| Banner Producción | Naranja/rojo suave. “Se timbrará un CFDI real ante el SAT.” |
| Confirm extra | Si host es `localhost` **y** el usuario pasa a **Producción**: `confirm('Esto timbrará un CFDI real con Finkok producción. ¿Continuar?')`. |
| Confirm extra | Si host **no** es localhost **y** pasa a **Demo**: no bloquear; el banner basta. |
| POST | Siempre mandar `environment` del toggle. **No** persistir el toggle con `PATCH /stamping-environment`. |

Prefetch al abrir el tab / wizard:

```http
GET /api/tenant/billing/finkok-configuration
```

Usar `environments.demo` y `environments.production` para saber si hay usuario/password. `stamping_environment` es el default **global** de Config Fiscal; **no** usarlo como default del toggle (el default es por hostname).

### 9.3 Listado / cards

Badge según `invoice.metadata.finkok_environment`:

| Valor | Badge |
|-------|-------|
| `demo` | amarillo **DEMO** |
| `production` | verde **PROD** |
| ausente (facturas viejas) | no pintar o “—” |

Cancelar y Sync SAT no envían ambiente: el API reusa el de `metadata.finkok_environment`.

### 9.4 Errores del toggle

| Mensaje backend | Acción UI |
|-----------------|-----------|
| `No hay credenciales Finkok activas para el ambiente demo/production` | Toast + link a Integración Finkok. Quedarse en el wizard. |

---

## 10. Docs relacionados

- Config Finkok por cliente: `src/api/electronic-invoicing/docs/UI_FINKOK_CONFIGURATION.md`
- Módulo core / sync background: `src/api/electronic-invoicing/docs/UI_ELECTRONIC_INVOICING.md`
