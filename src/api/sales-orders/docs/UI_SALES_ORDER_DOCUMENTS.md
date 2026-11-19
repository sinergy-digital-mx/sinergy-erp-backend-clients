# UI — Documentos de la orden de venta

Contrato para Pollux. Tab **Documentos** del detalle: `GET /api/tenant/sales-orders/:id` → `data.documents`.

Hay **tres tipos**. No son intercambiables. El PDF A4 de salida de mercancía es **ENTREGA**, no RECIBO.

| Tipo API | Qué es | Archivo típico |
|----------|--------|----------------|
| `DOCUMENTO_ORIGINAL` | PDF de la **orden** (título **ORDEN DE VENTA**). Snapshot al crear / al regenerar. Al pie: días para facturar, QR, enlace y folio público (el mismo del ticket). | `DOCUMENTO_ORIGINAL_OSV-000033_es.pdf` |
| `ENTREGA` | PDF de **entrega** (título **ENTREGA**). Contraparte de `RECEPCIÓN` en OC. | `ENTREGA_OSV-000033_es.pdf` |
| `TICKET / RECIBO` | Ticket térmico ESC/POS del cobro POS. No es el PDF A4. | `TICKET_RECIBO-OSV-000033.escpos` |

**No existe** tipo `RECIBO` en el PDF A4. Si el API aún manda `RECIBO`, es dato viejo: **Regenerar PDF Original**.

Label en tabla:

| `document_type_name` | Chip UI |
|----------------------|---------|
| `DOCUMENTO_ORIGINAL` | Original |
| `ENTREGA` | Entrega |
| `TICKET / RECIBO` | Ticket |

---

## Regenerar

```
POST /api/tenant/sales-orders/:id/regenerate-documento-original
{ "language": "es", "keep_previous": false }
```

Reescribe **los dos** PDFs A4 (`DOCUMENTO_ORIGINAL` + `ENTREGA`). No toca el ticket térmico.

Botón: **Regenerar PDF Original**.

Ticket POS: `POST /api/tenant/sales-orders/:id/reprint-ticket-recibo` (reimprime el guardado). Regenerar ticket es otro endpoint.

PDF del mismo ticket (80 mm, no reemplaza el ESC/POS):

```http
GET /api/tenant/sales-orders/:id/ticket-recibo/pdf
```

En la fila del ticket, iconos: PDF, ver, imprimir y regenerar. Si no hay ticket, la fila muestra el icono de generar. `GET .../ticket-recibo/pdf` crea el ticket si todavía no existe y luego devuelve el PDF. El PDF de 80 mm incluye el QR de autofactura (el mismo enlace del ticket), encima de la URL.

El ticket incluye **OBSERVACIONES** (`header.notes`) al cobrar o al regenerar. `PATCH /:id/notes` reescribe el ticket si ya existe.

---

## Checklist Pollux

- [ ] Chip **Entrega** para `ENTREGA` (nunca “Recibo” en el PDF A4)
- [ ] Chip **Original** para `DOCUMENTO_ORIGINAL`
- [ ] Chip **Ticket** para `TICKET / RECIBO`
- [ ] Si llega `RECIBO` (legado): tratarlo como Entrega y pedir regenerar
- [ ] `Regenerar PDF Original` llama `regenerate-documento-original`
