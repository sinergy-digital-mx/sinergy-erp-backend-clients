# UI — Enviar factura por WhatsApp

**2026-11-02.** En la pestaña Facturación de la orden, junto a **Enviar correo**, botón **Enviar por WhatsApp**.

Solo si la factura está timbrada (`stamped`, `cancel_pending` o `cancelled`) y tiene UUID o XML. La empresa debe tener WhatsApp conectado en Configuración.

## Diálogo

- **Teléfono**: se precarga el del cliente. Al pegar se quitan espacios y guiones. 10 dígitos se toman como México.
- **Grupo**: lista de `GET /api/tenant/whatsapp/groups`.

**2026-11-02 — foto.** El primer mensaje es una imagen: «Tu pago está pendiente» o «Tu factura ya está pagada», con total, folio, orden, fecha, UUID y razón social. Después van el PDF y el XML.

Se envían hasta tres mensajes:

1. Foto del aviso, con un texto corto.
2. PDF de la factura.
3. XML del CFDI, si existe. Si el motor de imágenes no está disponible, la foto no sale y el texto va con el PDF.

```
GET  /api/tenant/sales-orders/:id/invoices/:invoiceId/whatsapp-compose
POST /api/tenant/sales-orders/:id/invoices/:invoiceId/send-whatsapp
```

Body: `{ "phone": "6641745294" }` o `{ "group_id": "120363…@g.us" }`. Si no hay grupo y se omite el teléfono, se usa el del cliente.

Respuesta: `{ "sent_to": "526641745294", "image_sent": true, "pdf_sent": true, "xml_sent": true }`. En grupo, `sent_to` es el `…@g.us`.

Cada mensaje queda en el historial de WhatsApp con `reference_type = sales_order_invoice` y `reference_id` = id de la factura.
