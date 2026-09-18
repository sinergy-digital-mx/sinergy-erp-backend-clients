# UI — Enviar factura por correo

Guía para Pollux. Cada factura timbrada de la OV se puede enviar por correo con PDF + XML. La plantilla es **una por organización** y se edita en el tab **Correo**.

**Permiso:** `electronic_invoices:Read` (mismo tab Facturación).  
**Correo:** requiere configuración activa de Resend en Sistema.  
No usar la palabra “tenant” en textos de UI.

---

## 1. Dónde va

### Tab Facturación

En cada card de factura, junto a PDF / XML, botón **Enviar correo**.

Solo si la factura está `stamped`, `cancel_pending` o `cancelled` y tiene UUID/XML.

Al clic → modal de composición.

### Tab Correo (detalle OV)

Nuevo tab al lado de Envío. Dos bloques:

1. **Plantilla** — asunto, HTML, variables, vista previa, Guardar / Restaurar predeterminada.
2. **Historial** — envíos de esa OV.

---

## 2. Modal Enviar factura

Layout de dos columnas: formulario a la izquierda, preview HTML a la derecha.

| Campo | Comportamiento |
|-------|----------------|
| Para | Prefill `to_email` del compose. Editable. |
| CC | Chips. Botón **Agregar CC** / **Agregar otro CC**. Quitar con ×. |
| Asunto | Prefill del template renderizado. Editable solo para ese envío. |
| Nota | Opcional. Se inyecta en `{{extra_message}}`. |
| Adjuntos | Chips solo lectura: PDF y XML. |

Footer: Cancelar · Enviar factura.

Si el cliente tiene `additional_email` distinto, mostrar hint “También tiene {email}” y botón para agregarlo como CC.

---

## 3. APIs

### Plantilla

```http
GET  /api/tenant/sales-orders/invoice-email-template
PATCH /api/tenant/sales-orders/invoice-email-template
```

GET crea la plantilla default si no existe.

PATCH body:

```json
{
  "subject": "Factura {{invoice_folio}} · {{issuer_name}}",
  "body_html": "<!DOCTYPE html>...",
  "reset_default": false
}
```

`reset_default: true` restaura asunto y HTML de fábrica.

Respuesta:

```json
{
  "id": "uuid",
  "subject": "...",
  "body_html": "...",
  "variables": [{ "key": "customer_name", "label": "Nombre del cliente" }],
  "sample_values": {},
  "sample_html": "...",
  "sample_subject": "...",
  "updated_at": "2026-09-04T...",
  "updated_by": { "id": "uuid", "display_name": "Rodolfo" }
}
```

### Compose (prefill + preview)

```http
GET /api/tenant/sales-orders/{orderId}/invoices/{invoiceId}/email-compose
```

```json
{
  "to_email": "cliente@correo.com",
  "additional_email": "contabilidad@correo.com",
  "customer_name": "Luis Gomez",
  "customer_company": "Grupo Ministop De Mexico",
  "subject": "Factura A-1 · Sinergy Sw Solutions",
  "preview_html": "<!DOCTYPE html>...",
  "body_html": "...",
  "values": { "customer_name": "Luis Gomez", "extra_message": "" },
  "attachments": [
    { "kind": "pdf", "fileName": "uuid.pdf" },
    { "kind": "xml", "fileName": "uuid.xml" }
  ],
  "can_send": true,
  "block_reason": null
}
```

### Enviar

```http
POST /api/tenant/sales-orders/{orderId}/invoices/{invoiceId}/send-email
```

```json
{
  "to_email": "cliente@correo.com",
  "cc": ["contador@correo.com"],
  "subject": "Factura A-1 · Sinergy Sw Solutions",
  "message": "Gracias por tu preferencia."
}
```

Adjunta PDF y XML. `to_email` opcional: si falta, usa el correo del cliente.

### Historial

```http
GET /api/tenant/sales-orders/{orderId}/invoice-emails
```

Array: `id`, `invoice_id`, `to_email`, `cc`, `subject`, `message`, `sent_at`, `sent_by.display_name`.

---

## 4. Variables de plantilla

| Token | Uso |
|-------|-----|
| `{{customer_name}}` | Nombre del cliente |
| `{{customer_company}}` | Empresa / razón social |
| `{{issuer_name}}` | Razón social emisora |
| `{{order_folio}}` | Folio OV |
| `{{invoice_folio}}` | Serie-folio factura |
| `{{uuid}}` | Folio fiscal |
| `{{total}}` / `{{subtotal}}` | Importes MXN |
| `{{stamped_at}}` | Fecha de timbrado |
| `{{extra_message}}` | Nota del envío (HTML ya escapado) |

En el editor, chips que insertan el token en el HTML.

Preview en vivo: reemplazar `{{key}}` en cliente con `values` / `sample_values`. Al cambiar la nota, inyectar un párrafo amber en `extra_message`.

---

## 5. Errores

| Mensaje | UI |
|---------|----|
| Cliente sin correo | Bloquear Enviar hasta capturar Para |
| Sin configuración de correo | Toast + ir a Sistema |
| Factura no timbrada | Ocultar botón o toast |
| Resend falló | Toast con el mensaje del API |
