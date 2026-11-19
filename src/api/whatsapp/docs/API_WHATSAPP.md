# API — WhatsApp (`/api/tenant/whatsapp`)

Envío de mensajes por WhatsApp desde el ERP. Hay **un solo servidor [WAHA](https://waha.devlike.pro/)** compartido y **una sesión por organización**: cada empresa escanea su propio QR y envía con su número. La API key de WAHA vive solo en el backend; el navegador nunca la ve.

## Historial

- 2026-10-23: `GET /groups` entiende el mapa de NOWEB (`{ "id@g.us": {…} }`) y, si /groups viene vacío, lista los `…@g.us` de `/chats`.
- 2026-10-23: Grupos de WhatsApp. `GET /groups` lista los de la sesión (`id` = `…@g.us`). Envío de texto/archivo y `sendBuffer` aceptan `group_id` (se salta la verificación de número).
- 2026-10-21: Guía de implementación de WAHA directo en otro proyecto (autenticación, backend, frontend, producción): [WAHA_DIRECT_IMPLEMENTATION.md](./WAHA_DIRECT_IMPLEMENTATION.md).
- 2026-10-21: Guía para usar WhatsApp desde otro proyecto (API de Pollux con usuario de servicio o WAHA directo): [EXTERNAL_INTEGRATION_GUIDE.md](./EXTERNAL_INTEGRATION_GUIDE.md). También disponible en Configuración → WhatsApp → Guía de integración.
- 2026-10-21: Aviso en pantalla y en el error «El número no tiene WhatsApp»: un número de 10 dígitos se toma como México (+52); para otro país hay que escribirlo con su código (`+1…`).
- 2026-10-21: Los módulos del ERP pueden enviar archivos generados (foto o PDF) con `WhatsappMessageService.sendBuffer`, sin URL pública. Las imágenes salen como foto (`/api/sendImage`). Primer uso: recordatorio de pago de suscripciones.
- 2026-10-21: El webhook `session.status` confirma el estado real en WAHA antes de guardarlo (evita que un `FAILED` viejo reintentado deje la sesión como fallida).
- 2026-10-20: Módulo inicial. Sesión por organización, QR, código por teléfono, cola de envío, historial y confirmaciones de entrega/lectura por webhook.

## Cómo funciona el aislamiento

- La sesión de WAHA se llama `erp_<id de la organización sin guiones>`. Siempre se calcula en el servidor a partir del JWT; el cliente nunca manda ni elige el nombre de sesión.
- `whatsapp_sessions` tiene `UNIQUE(tenant_id)` y `UNIQUE(session_name)`. Todo mensaje se guarda con `tenant_id` y todas las consultas filtran por él.
- El webhook de WAHA resuelve la organización por el nombre de sesión y valida la firma HMAC. La llave HMAC es **distinta por sesión** (`HMAC-SHA256(WAHA_WEBHOOK_SECRET, session_name)`) y no se guarda en BD. Una firma válida de una sesión no sirve para otra.

## Servidor WAHA: una o varias sesiones

- **WAHA 2026.6.1 o posterior**: todo lo que era Plus (sesiones ilimitadas, multimedia) está en Core y es gratis. Aunque `GET /api/server/version` siga devolviendo `tier: CORE`, el backend permite una sesión por organización.
- **Versiones anteriores**: Core solo tenía la sesión `default` (una sola organización) y Plus tenía varias. En ese caso el backend limita a una organización; las demás reciben «El servicio de WhatsApp compartido ya está asignado a otra organización».
- Se puede forzar con `WAHA_SESSION_MODE=single|multi`.

## Variables de entorno (backend)

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `WAHA_BASE_URL` | Sí | URL del servidor WAHA, sin `/` final |
| `WAHA_API_KEY` | Sí | Valor de `WAHA_API_KEY` configurado en WAHA (header `X-Api-Key`). No es el usuario/contraseña del dashboard |
| `WAHA_WEBHOOK_BASE_URL` | Sí para estados y acks | URL pública de este backend (ej. `https://api.midominio.com`). WAHA llamará a `<url>/api/webhooks/whatsapp/waha` |
| `WAHA_WEBHOOK_SECRET` | Recomendada | Secreto maestro para las llaves HMAC. Si falta se usa `ENCRYPTION_KEY` |
| `WAHA_SESSION_MODE` | No | `single` o `multi`. Por defecto se detecta |
| `WHATSAPP_DEFAULT_COUNTRY_CODE` | No | Lada para teléfonos de 10 dígitos. Por defecto `52` |
| `WHATSAPP_DAILY_LIMIT` | No | Mensajes por día por organización. Por defecto `1000` |
| `WHATSAPP_MIN_DELAY_MS` / `WHATSAPP_MAX_DELAY_MS` | No | Pausa aleatoria entre mensajes de una misma sesión. Por defecto 2000–5000 ms |

Sin `WAHA_WEBHOOK_BASE_URL` la conexión y los envíos funcionan, pero no se actualizan automáticamente los estados «Entregado/Leído» ni las desconexiones.

## Configuración recomendada del servidor WAHA (Railway)

Variables en el servicio de WAHA (verificar nombres contra la versión instalada):

- `WAHA_API_KEY`: llave larga y aleatoria (la misma que `WAHA_API_KEY` del backend).
- `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` y `WHATSAPP_SWAGGER_USERNAME` / `WHATSAPP_SWAGGER_PASSWORD`: acceso al dashboard y Swagger.
- `WHATSAPP_DEFAULT_ENGINE=NOWEB`: no abre un Chromium por sesión; es mucho más ligero con muchas organizaciones.
- `WHATSAPP_RESTART_ALL_SESSIONS=True`: reinicia las sesiones guardadas al arrancar el contenedor.
- **Volumen persistente** montado en `/app/.sessions`. Sin volumen, cada redeploy borra las sesiones y todas las organizaciones tendrían que volver a escanear el QR.

## Permisos

| Acción | Permiso |
|--------|---------|
| Menú | `whatsapp` + `ViewMenu` |
| Ver estado e historial | `whatsapp` + `Read` |
| Enviar mensajes | `whatsapp` + `Create` |
| Conectar, QR, reiniciar, desvincular | `whatsapp` + `Update` |
| Eliminar la conexión | `whatsapp` + `Delete` |

El módulo `whatsapp` se registra con la migración `1793000000000-create-whatsapp` pero **no se habilita** en ninguna organización. Se activa por organización desde el panel de módulos. Los roles Admin ya reciben los permisos.

## Conexión (flujo del QR)

1. `POST /session/connect` crea la sesión en WAHA (con webhook y HMAC) y la inicia. Es idempotente.
2. La UI consulta `GET /session/qr` cada ~3 s. Cuando `state = waiting_qr`, `qr_data_url` trae la imagen (`data:image/png;base64,...`). WAHA renueva el QR cada pocos segundos.
3. El usuario escanea en WhatsApp → Dispositivos vinculados. El estado pasa a `connected` (por webhook o por el siguiente sondeo).
4. Si el QR expira sin escanear, `state` vuelve a `failed`/`disconnected` y la UI ofrece «Generar nuevo QR».

Alternativa sin cámara: `POST /session/pairing-code` con `phone` devuelve un código de 8 caracteres para «Vincular con número de teléfono».

### Estados (`state`)

`not_configured` · `disconnected` · `starting` · `waiting_qr` · `connected` · `failed`

## Endpoints

| Método | Path | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/session` | Read | Estado. Sincroniza con WAHA. `service_available=false` si WAHA no responde |
| `POST` | `/session/connect` | Update | Crea e inicia la sesión |
| `GET` | `/session/qr` | Update | Estado + `qr_data_url` |
| `POST` | `/session/pairing-code` | Update | Body `{ phone }` → `{ code }` |
| `POST` | `/session/restart` | Update | Reinicia la sesión |
| `POST` | `/session/logout` | Update | Desvincula el teléfono; conserva la configuración |
| `DELETE` | `/session` | Delete | Borra la sesión en WAHA y la configuración |
| `GET` | `/groups` | Read | Grupos de la sesión conectada. `{ data: [{ id, name, description }] }`. `id` termina en `@g.us` |
| `POST` | `/messages/text` | Create | Body `{ phone?, group_id?, text, reference_type?, reference_id? }` |
| `POST` | `/messages/file` | Create | Body `{ phone?, group_id?, file_url, file_name?, mimetype?, caption?, reference_type?, reference_id? }` |
| `GET` | `/messages` | Read | Paginado. Query: `page`, `limit`, `status`, `phone`, `reference_type`, `reference_id` |
| `GET` | `/messages/:id` | Read | Estado de un mensaje |

Respuesta de estado:

```json
{
  "configured": true,
  "service_available": true,
  "state": "connected",
  "status": "WORKING",
  "phone_number": "525512345678",
  "push_name": "Mi Empresa",
  "connected_at": "2026-10-20 17:10:00",
  "last_status_at": "2026-10-20 17:10:00",
  "last_error": null
}
```

## Envío

- Los envíos responden **202** con el mensaje en `queued`. Salen por una cola serial por sesión con pausa aleatoria y simulación de «escribiendo…» para reducir el riesgo de bloqueo.
- Destino: `phone` **o** `group_id` (si vienen los dos, gana el grupo). Sin ninguno → 400 «Indica un teléfono o un grupo.».
- `phone`: 10 dígitos se interpretan como México (`+52`). `521` + 10 dígitos se convierte a `52` + 10 dígitos. Antes de enviar se verifica con WAHA que el número tenga WhatsApp; si no, el mensaje queda `failed` con «El número no tiene WhatsApp.».
- `group_id`: `120363…@g.us` (o solo la parte numérica). WAHA `GET /api/{session}/groups`. No se llama a `check-exists`. El historial guarda el id en `to_phone`/`chat_id` y `destination = group`.
- `file_url` debe ser `https` y pública (se rechazan `localhost`, IPs y hosts internos). El archivo no se guarda en BD.
- Estados: `queued` → `sending` → `sent` → `delivered` → `read` (o `failed`). Los acks tardíos nunca regresan un estado.
- Límite diario por organización (`WHATSAPP_DAILY_LIMIT`). Al excederlo responde **429**.
- Tras un reinicio del backend se reencolan los textos pendientes; los archivos pendientes se marcan `failed` y hay que reenviarlos.

Desde otros módulos del backend se puede inyectar `WhatsappMessageService` (exportado por `WhatsappModule`) y llamar `sendText(tenantId, userId, dto)`.

## Webhook (interno, sin JWT)

`POST /api/webhooks/whatsapp/waha` — lo llama WAHA. Valida `X-Webhook-Hmac` con la llave de la sesión. Procesa `session.status` y `message.ack`. Firma inválida → 401.

Requiere `rawBody` activo en `main.ts` (ya configurado).

## Tablas

- `whatsapp_sessions`: `tenant_id` (único), `session_name` (único), `status`, `phone_number`, `push_name`, `connected_at`, `last_status_at`, `last_error`.
- `whatsapp_messages`: destino, tipo, texto, estado, `waha_message_id`, referencia opcional, fechas de envío/entrega/lectura.
