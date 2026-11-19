# Suscripciones de servicio

Solo Vexia. Menú **Suscripciones**. En el detalle del cliente también salen las de ese cliente.

El listado acepta `customer_id` para traer solo las de un cliente.

Una suscripción es el cobro mensual de un servicio a un cliente, de un mes inicial a un mes final (máximo 12). Cada mes tiene su orden de venta y, cuando aplica, su factura.

## Alta

- Cliente, nombre del servicio, monto mensual sin IVA e IVA.
- Razón social, sucursal y un producto de tipo servicio con su unidad.
- Mes inicial y mes final.
- Día de cobro (1 a 28).
- Uso CFDI, forma de pago, método de pago y régimen del receptor. Por defecto G03, 99, PPD y 601.

Al guardar se crean los meses en pendiente.

## Cada mes

Historial:
- 2026-10-23 — la tabla de meses muestra **Pago**: Pagado / Pendiente / — (sin orden).

- **Generar orden**: crea la orden de venta de servicio con la fecha de ese mes. Si el mes es el actual, intenta timbrar la factura. Si el timbrado falla, la orden queda ligada y el mes muestra el motivo.
- **Generar todas**: recorre los meses pendientes, uno por uno, y muestra el avance.
- La orden de venta indica a qué suscripción y mes pertenece.
- En la orden, **Registrar factura existente** acepta el XML, el PDF o solo el UUID de un CFDI ya emitido. Queda en la pestaña de facturación. Si la orden es de un mes de suscripción, ese mes pasa a facturado.
- **Vincular orden**: usa una orden que ya existe de ese cliente. La fecha de la orden pasa al día de cobro del mes. Si esa orden ya tiene factura vigente, el mes queda facturado. La fecha del CFDI ya timbrado no cambia.
- **Facturar**: reintenta el timbrado de la orden ligada.
- **Omitir**: el mes no se cobra. Solo si no tiene orden.

El día de cobro, a las 6:00, el sistema genera solo el mes en curso de las suscripciones activas que sigan pendientes.

## Recordatorio de pago por WhatsApp

Historial:
- 2026-10-23 — el diálogo permite enviar a un **grupo** de WhatsApp (`group_id`) además del teléfono.
- 2026-10-21 — se agrega el botón **Enviar recordatorio** por mes.

- Aparece en cada mes que **ya tiene orden y no está pagado**, con el logo de WhatsApp. Requiere permiso de edición y que la empresa tenga WhatsApp conectado (Configuración → Comunicación → WhatsApp).
- Abre un diálogo: **Teléfono** (se precarga el del cliente, `customer_phone`) o **Grupo** (lista de `GET /api/tenant/whatsapp/groups`). Al pegar un teléfono se quitan espacios y guiones.
- Se envían dos mensajes seguidos (la cola de WhatsApp los separa unos segundos):
  1. **Foto** con el detalle del mes (mes, importe, estado, orden, folio, UUID, timbrado, SAT, fecha y total CFDI, igual que el PDF del resumen) y un texto de recordatorio.
  2. **Factura timbrada en PDF**, como documento adjunto. Solo si el mes ya tiene factura y su PDF está disponible.
- Importe del recordatorio: total del CFDI si hay factura; si no, mensualidad + IVA.

`POST /api/tenant/service-subscriptions/:id/periods/:periodId/whatsapp-reminder`

Body opcional: `{ "phone": "6641745294" }` o `{ "group_id": "120363…@g.us" }`. Si no hay `group_id` y se omite el teléfono, se usa el del cliente.

Respuesta: `{ "sent_to": "526641745294", "image_sent": true, "invoice_attached": true }`. En grupo, `sent_to` es el `…@g.us`. `image_sent: false` significa que solo salió el texto (el motor de imágenes no estaba disponible).

Errores (400): mes sin orden, mes ya pagado, sin teléfono/grupo, número o group id inválido, WhatsApp no conectado. 429 si se alcanzó el límite diario.

Cada mensaje queda en el historial de WhatsApp con `reference_type = service_subscription_period` y `reference_id` = id del mes.

El detalle de la suscripción ahora trae `customer_phone` y, en cada mes, `paid` (`true`, `false` o `null` sin orden).

## Renovación

**Renovar** abre otra suscripción del mismo cliente, servicio y monto, empezando el mes siguiente al fin (o el plazo que se indique). El plazo anterior no se alarga: es otra contratación.
