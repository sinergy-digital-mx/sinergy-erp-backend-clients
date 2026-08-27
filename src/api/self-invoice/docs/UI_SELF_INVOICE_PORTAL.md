# UI — Portal de autofactura del cliente

Guía para Pollux. El cliente factura **después** de la compra, sin login del ERP.

**Decisión:** la **página/formulario vive en Pollux** (ruta pública, **sin JWT**). Este backend arma el XML, timbra Finkok, genera el QR del ticket y expone APIs públicas.

---

## 1. Ruta pública (obligatorio sin auth)

Excluir de `JwtAuthGuard` / redirect a login:

| Qué | Valor |
|-----|--------|
| Path | `/facturar` y `/facturar/:code` |
| Auth | **Ninguna**. No Bearer, no sesión ERP |
| Query | `email` (opcional; viene del QR si el cliente del ticket ya tenía correo) |

Dominio del QR (configurable en backend):

```
SELF_INVOICE_PORTAL_BASE_URL=https://facturacion.sinergydigital.mx
```

El QR y el link del ticket apuntan a:

```
https://facturacion.sinergydigital.mx/facturar/MZN-CENT-INV-000012?email=ana%40empresa.com
```

Si no hay correo en el cliente del ticket, el QR **no** lleva `?email=`.

CORS: `*.sinergydigital.mx` ya está permitido. Si el portal usa **otro dominio**, ponlo en `SELF_INVOICE_PORTAL_BASE_URL` (el API agrega ese origin).

---

## 2. Folio del recibo (único entre empresas)

No usar `OV-0001` / `INV-0001` solos. El ticket imprime:

```
{PREFIJO_RAZON}-{PREFIJO_SUCURSAL}-INV-000012
```

Ejemplo: `MZN-CENT-INV-000012`

Origen:

| Segmento | Campo |
|----------|--------|
| `MZN` | `fiscal_configurations.prefix` |
| `CENT` | `billing_branches.prefix` |
| `INV-000012` | secuencia numérica del folio interno (`OSV-000012` → `000012`) |

Si falta prefix, el backend deriva letras del nombre. Configurar prefix en razón social y sucursal (mismo campo que lotes de OC).

En el ticket: **Recibo No** = este folio público (no el `OSV-…` interno).

---

## 3. Ticket POS — Pollux no pinta el QR

Tras cobro, `receipt.escpos_base64` **ya trae**:

1. Texto `FACTURA TU COMPRA`
2. URL completa (fuente chica)
3. **QR ESC/POS** (Bixolon 80mm)
4. `Folio: MZN-CENT-INV-000012`

Imprimir RAW igual que hoy. No generar QR en el frontend del POS.

JSON extra (pantalla / reimpresión):

```ts
receipt.public_invoice_code // "MZN-CENT-INV-000012"
receipt.self_invoice_url    // URL del QR (con email si aplica)
```

Tickets viejos sin QR: **Regenerar ticket** en cobranza. Reimpresión del buffer viejo no agrega QR.

---

## 4. Flujo de la página pública

```
Escanea QR  →  /facturar/:code?email=…
   o
Abre el sitio → pide folio completo → GET preview
        │
        ▼
Paso 1: correo + teléfono (email prellenado si venía en el QR)
        │
        ▼
POST identify
        │
        ├── matched=true  → formulario fiscal autofill
        └── matched=false → formulario fiscal vacío
        │
        ▼
Paso 2: RFC, razón social CSF, CP, domicilio (para el PDF),
        Uso CFDI, régimen, forma/método de pago
        │
        ▼
POST stamp → PDF + UUID  (o already_invoiced → descargar)
```

### 4.1 Landing / folio

Si **no** hay `:code` en la URL, primer campo:

- Label: **Número de recibo**
- Placeholder: `MZN-CENT-INV-000012`
- Hint: *Cópialo del ticket, incluye las letras de la sucursal.*
- Al continuar: `GET /api/public/self-invoice/{code}`

Si el GET es `404`, toast: *Recibo no encontrado. Revisa el folio completo.*

### 4.2 Preview (siempre, con o sin QR)

`GET /api/public/self-invoice/{code}` — **sin auth**.

Mostrar **antes** de pedir datos fiscales:

| UI | Campo |
|----|--------|
| Empresa | `issuer_name` |
| Sucursal | `branch_name` |
| Total | `total` (MXN) |
| Folio | `code` |

Si `already_invoiced === true`:

- No pedir RFC.
- Botones **Descargar PDF** / **Descargar XML**.
- PDF: abrir `invoice.pdf_url` o `GET .../invoice/pdf` → `signedUrl`.
- XML: `GET /api/public/self-invoice/{code}/invoice/xml` (blob download).

### 4.3 Paso 1 — Correo y teléfono

Aunque el QR traiga email, **pedir teléfono siempre**. El identify exige los dos.

```
┌─────────────────────────────────────────┐
│ Recibo MZN-CENT-INV-000012              │
│ Total $1,160.00                         │
│                                         │
│ Correo      [ ana@empresa.com        ]  │
│ Teléfono    [ 6641234567             ]  │
│              [ Continuar ]              │
└─────────────────────────────────────────┘
```

```http
POST /api/public/self-invoice/{code}/identify
Content-Type: application/json

{ "email": "ana@empresa.com", "phone": "6641234567" }
```

Respuesta:

```json
{
  "matched": true,
  "total": 1160,
  "fiscal": {
    "fiscal_rfc": "SSS2410213X9",
    "fiscal_person_type": "moral",
    "fiscal_razon_social": "SINERGY SW SOLUTIONS",
    "fiscal_postal_code": "22040",
    "fiscal_country": "MEX",
    "fiscal_street": "CALLE ESPANA",
    "fiscal_exterior_number": "736",
    "fiscal_interior_number": null,
    "fiscal_colonia": "JUAREZ",
    "fiscal_localidad": null,
    "fiscal_municipio": "Tijuana",
    "fiscal_state": "Baja California"
  },
  "suggested": {
    "uso_cfdi": "G03",
    "regimen_fiscal_receptor": "601",
    "forma_pago": "01",
    "metodo_pago": "PUE"
  }
}
```

`matched: false` → `fiscal: null` → formulario vacío. **No** digas “no existe el cliente”.

Match: **correo y teléfono** (últimos 10 dígitos). Un solo dato no basta.

### 4.4 Paso 2 — Datos fiscales (misma CSF que el ERP)

Copiar layout de **Editar Cliente → Información Fiscal**. Campos SAT en MAYÚSCULAS.

Obligatorios para timbrar:

| UI | Body |
|----|------|
| RFC | `fiscal_rfc` |
| Razón social / Nombre | `fiscal_razon_social` (exacto CSF) |
| Código postal | `fiscal_postal_code` (5 dígitos) |
| Uso CFDI | `uso_cfdi` (catálogo del GET `catalogs.uso_cfdi`) |
| Régimen fiscal | `regimen_fiscal_receptor` (`catalogs.regimen_fiscal_receptor`) |
| Forma de pago | `forma_pago` |
| Método de pago | `metodo_pago` (`PUE` si la venta está pagada; default en `suggested`) |

Para el **PDF** (no van en el XML 4.0, sí en representación impresa):

| UI | Body |
|----|------|
| País | `fiscal_country` default `MEX` |
| Calle | `fiscal_street` |
| No. exterior / interior | `fiscal_exterior_number` / `fiscal_interior_number` |
| Colonia | `fiscal_colonia` |
| Localidad | `fiscal_localidad` opcional |
| Municipio | `fiscal_municipio` |
| Estado | `fiscal_state` |
| Tipo de persona | `fiscal_person_type` `fisica` \| `moral` \| `otro` |

Hint bajo razón social: *Exacto CSF, MAYÚSCULAS SAT.*

Total de la compra **solo lectura** (el del GET). No dejar editar montos ni partidas.

Catálogos: usar `catalogs` del GET, no hardcodear.

```http
POST /api/public/self-invoice/{code}/stamp
Content-Type: application/json
```

```json
{
  "email": "ana@empresa.com",
  "phone": "6641234567",
  "fiscal_rfc": "SSS2410213X9",
  "fiscal_person_type": "moral",
  "fiscal_razon_social": "SINERGY SW SOLUTIONS",
  "fiscal_postal_code": "22040",
  "fiscal_country": "MEX",
  "fiscal_street": "CALLE ESPANA",
  "fiscal_exterior_number": "736",
  "fiscal_colonia": "JUAREZ",
  "fiscal_municipio": "Tijuana",
  "fiscal_state": "Baja California",
  "uso_cfdi": "G03",
  "regimen_fiscal_receptor": "601",
  "forma_pago": "01",
  "metodo_pago": "PUE"
}
```

Éxito:

```json
{
  "code": "MZN-CENT-INV-000012",
  "uuid": "6C3C0C87-...",
  "stamp_status": "stamped",
  "total": 1160,
  "pdf_url": "https://s3...",
  "pdf_file_name": "...pdf",
  "invoice_id": "uuid"
}
```

Pantalla final: UUID, botón PDF (`pdf_url`), botón XML (`GET .../invoice/xml`).

`400` + `message` SAT (ej. `CFDI40144`): quedarse en el form, toast con `message`. No inventar factura.

`400` *Este recibo ya tiene una factura vigente*: ir a descargas.

---

## 5. Endpoints (todos públicos, prefix `/api`)

Base: `/api/public/self-invoice/{code}`

| Acción | Método | Ruta |
|--------|--------|------|
| Preview + catálogos + total | `GET` | `/` |
| Buscar fiscal | `POST` | `/identify` |
| Timbrar | `POST` | `/stamp` |
| PDF | `GET` | `/invoice/pdf` |
| XML | `GET` | `/invoice/xml` |

`{code}` = folio público, case-insensitive. **No** JWT.

El XML CFDI lo genera el **backend**. Pollux no arma XML.

Ambiente Finkok: en local `demo`; en producción `production`. Override: `SELF_INVOICE_FINKOK_ENVIRONMENT=demo|production`.

---

## 6. Checklist Pollux

- [ ] Ruta `/facturar` y `/facturar/:code` **fuera** del layout autenticado
- [ ] Leer `code` del path y `email` de `searchParams`
- [ ] GET preview → mostrar total / empresa
- [ ] Si `already_invoiced`, solo descargas
- [ ] Formulario correo + teléfono → identify
- [ ] Autofill si `matched`; si no, form CSF vacío
- [ ] Stamp con domicilio para PDF
- [ ] Errores SAT en toast, no navegar a “éxito”
- [ ] POS: seguir imprimiendo `escpos_base64` (el QR ya va dentro)

---

## 7. Relacionado

- Folio público en detalle OV: `src/api/sales-orders/docs/UI_SALES_ORDER_PUBLIC_FOLIO.md`
- Tab fiscal cliente: `src/api/customers/docs/UI_CUSTOMER_FISCAL.md`
- Timbrado staff OV: `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`
- Ticket POS: `src/api/pos-shifts/docs/UI_POS_FLOW.md` (Parte 11)
