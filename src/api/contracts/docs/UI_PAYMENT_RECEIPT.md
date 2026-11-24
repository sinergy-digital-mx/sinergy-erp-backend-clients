# UI — Recibo de pago

## Historial

- 2026-11-20: El recibo dice manzana y número de lote. Ya no pone el código del lote ni el nombre del lote como proyecto.
- 2026-11-03: El PDF y el correo se arman al descargar o al enviar. No hay un recibo guardado. Si el contrato tiene razón social, esa es la que sale. Un correo ya enviado conserva el nombre de ese momento.
- 2026-10-23: **Razón social y logo del recibo** ya no va en Pagos ni en Enganche. Queda en **Editar** (razón social del contrato + logo del recibo).
- 2026-10-23: El PDF y el correo toman logo y nombre de `contract.fiscal_configuration_id`. La razón social de la plantilla queda como respaldo de contratos sin esa asignación.
- 2026-10-13: El recibo deja elegir la razón social y subir su logo. Ese logo y ese nombre salen en el PDF de enganches y de pagos.
- 2026-10-12: El PDF y el correo indican el número de cuota y el mes (`due_date`) en enganches y pagos.

En cada fila de pagos del contrato:

- **Descargar recibo PDF**
- **Enviar recibo por correo** abre un modal con vista previa, destinatario, CC y nota. El PDF va adjunto.

La plantilla es una por organización. En el modal, **Editar plantilla** muestra asunto, HTML, variables y la vista previa de ejemplo. Guardar o restaurar la predeterminada.

El emisor del recibo es la **razón social del contrato** (`fiscal_configuration_id`). De ahí salen logo, nombre y RFC. Ver `UI_CONTRACT_FISCAL.md`.

La razón social se elige en **Editar**. El logo del recibo también se sube ahí. Enganches y pagos del mismo contrato usan esa razón social. Si el contrato no tiene una, se usa la de la plantilla; si tampoco, la marcada como logo del sistema.

La razón social y el RFC salen de esa configuración efectiva. Si no hay razón social, se usa el nombre de la organización.

El recibo dice a qué cuota corresponde: **Pago 12 · octubre de 2026** o **Enganche 2 · marzo de 2026**. El mes sale de la fecha de vencimiento. En el PDF va en el texto y en la línea del contrato. En el correo, variable `payment_reference` (y `payment_month`). Las plantillas ya guardadas lo reciben aunque no tengan la variable.

## Endpoints

```http
GET   /api/tenant/contracts/{contractId}/payments/receipt-template
PATCH /api/tenant/contracts/{contractId}/payments/receipt-template
POST  /api/tenant/contracts/{contractId}/payments/receipt-template/logo
GET   /api/tenant/contracts/{contractId}/payments/{paymentId}/receipt.pdf
GET   /api/tenant/contracts/{contractId}/payments/{paymentId}/receipt/compose
POST  /api/tenant/contracts/{contractId}/payments/{paymentId}/receipt/send
```

PATCH:

```json
{ "subject": "Recibo {{payment_number}}", "body_html": "<!DOCTYPE html>...", "reset_default": false, "fiscal_configuration_id": "uuid-o-null" }
```

POST logo: `multipart/form-data` con `file` y `fiscal_configuration_id`. Guarda el archivo en esa razón social y la deja seleccionada para el recibo. La respuesta es la misma del GET.

POST:

```json
{ "to_email": "cliente@correo.com", "cc": [], "extra_message": "Gracias" }
```

El correo usa la configuración activa de Resend en Sistema.
