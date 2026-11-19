# Guía — Usar WhatsApp desde otro proyecto (backend + frontend)

Cómo enviar WhatsApp desde **otro sistema** (otro backend y otro frontend) reutilizando lo que ya existe en Pollux ERP, **sin que los usuarios del otro sistema tengan cuenta ni sesión en Pollux**.

Esta misma guía está dentro del ERP en **Configuración → WhatsApp → Guía de integración**.

## Historial

- 2026-10-26: Listar grupos directo en WAHA (`GET /api/{session}/groups`, respaldo `/chats`). Paso a paso en [WAHA_GROUPS.md](./WAHA_GROUPS.md).
- 2026-10-23: `GET /groups` y `group_id` en el envío (texto/archivo) para escribir a grupos `…@g.us`.
- 2026-10-21: Primera versión. Dos modos: A) API de Pollux con usuario de servicio, B) WAHA directo con sesiones propias.

## 1. Qué modo elegir

| | **Modo A — API de Pollux** | **Modo B — WAHA directo** |
|---|---|---|
| Quién envía | El número de WhatsApp de **una** organización de Pollux | El número de **cada cliente** del otro proyecto |
| Sesiones (QR) | Una, ya conectada en Pollux | Una por cliente, las crea y administra el otro proyecto |
| Qué necesita el otro backend | URL de Pollux + email/contraseña de un usuario de servicio | URL de WAHA + `WAHA_API_KEY` |
| Cola anti-bloqueo, límite diario, historial, confirmaciones | Ya los hace Pollux | Hay que implementarlos (código de referencia abajo) |
| Archivos | Solo por URL `https` pública | URL pública **o** base64 |
| Esfuerzo | Bajo (1 cliente HTTP) | Medio-alto (módulo completo) |
| Riesgo de seguridad | Bajo: el usuario solo tiene permisos de WhatsApp | **Alto** si comparte el WAHA de Pollux (la API key controla todas las sesiones) |

Regla práctica:

- ¿Solo necesitas **mandar avisos** desde un número (el de una empresa tuya)? → **Modo A**.
- ¿Cada cliente del otro proyecto debe usar **su propio número** con su propio QR? → **Modo B**, idealmente con un **WAHA propio**.

> Importante: el navegador del otro proyecto **nunca** habla con Pollux ni con WAHA. Siempre va `Front → Backend del otro proyecto → Pollux / WAHA`. Así ni la contraseña del usuario de servicio ni la API key de WAHA salen del servidor.

---

## 2. Modo A — API de Pollux (usuario de servicio)

Pollux no tiene API keys: toda la API usa JWT (`Authorization: Bearer <token>`). Para que nadie del otro proyecto se autentique en Pollux, **el backend del otro proyecto inicia sesión por su cuenta** con un usuario técnico y guarda el token. Los usuarios finales del otro proyecto no ven ni saben nada de Pollux.

### 2.1 Preparación en Pollux (una sola vez)

1. En el panel de módulos, **habilitar el módulo `whatsapp`** en la organización que enviará (el módulo no viene activo por defecto).
2. En **Configuración → WhatsApp**, pulsar **Generar nuevo QR** y escanearlo con el teléfono. Debe quedar en **Conectado**.
3. Crear un **rol** (ej. `Integración WhatsApp`) solo con estos permisos del módulo `whatsapp`:
   - `Read` (estado e historial)
   - `Create` (enviar)
   - `Update` solo si el otro proyecto debe conectar/reiniciar la sesión (normalmente **no**)
4. Crear un **usuario** (ej. `integraciones@tuempresa.com`) con ese rol, contraseña larga y aleatoria, **sin** acceso a otros módulos.
5. Probar el login (sección 2.3).

Cuando cambias los permisos de ese usuario, su token deja de servir (`PERMISSIONS_CHANGED`); ver 2.6.

### 2.2 URL base

| Entorno | URL base de la API |
|---|---|
| Producción | `https://sapi.sinergydigital.mx/api` |
| Local | `http://localhost:3001/api` |

Todas las rutas de WhatsApp cuelgan de `{BASE}/tenant/whatsapp` (el segmento `tenant` es parte de la ruta, no se cambia).

### 2.3 Login y token

```bash
curl -X POST "https://sapi.sinergydigital.mx/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"integraciones@tuempresa.com","password":"********"}'
```

Respuesta (resumen):

```json
{
  "access_token": "eyJhbGciOi...",
  "user": { "id": "uuid", "tenant_id": "uuid", "roles": ["Integración WhatsApp"], "permissions": { } }
}
```

- El token dura **30 días**.
- Se manda en cada llamada: `Authorization: Bearer <access_token>`.
- No hay que mandar el id de la organización: sale del token.
- `POST /auth/refresh` (con el token vigente) devuelve un token nuevo con los permisos actuales.

### 2.4 Endpoints

Todos bajo `{BASE}/tenant/whatsapp`.

| Método | Ruta | Permiso | Uso |
|---|---|---|---|
| `GET` | `/session` | Read | Estado de la conexión. Revisar `state === "connected"` antes de enviar |
| `GET` | `/groups` | Read | Grupos de la sesión. `{ data: [{ id, name, description }] }`. `id` termina en `@g.us` |
| `POST` | `/messages/text` | Create | Enviar texto (responde **202**). Body: `phone` o `group_id` |
| `POST` | `/messages/file` | Create | Enviar archivo por URL `https` pública (responde **202**) |
| `GET` | `/messages` | Read | Historial paginado. Filtros: `page`, `limit`, `status`, `phone`, `reference_type`, `reference_id` |
| `GET` | `/messages/:id` | Read | Estado de un mensaje |
| `POST` | `/session/connect` · `GET /session/qr` · `POST /session/pairing-code` · `POST /session/restart` · `POST /session/logout` · `DELETE /session` | Update / Delete | Administrar la conexión. No usarlos desde integraciones salvo que sea necesario |

#### Enviar texto

```bash
curl -X POST "$BASE/tenant/whatsapp/messages/text" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5512345678",
    "text": "Hola, tu pedido #1234 va en camino.",
    "reference_type": "order",
    "reference_id": "1234"
  }'
```

Body:

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `phone` | string (máx. 32) | Sí, si no hay `group_id` | Ver reglas de teléfono (2.5) |
| `group_id` | string (máx. 80) | Sí, si no hay `phone` | `120363…@g.us`. Si vienen los dos, gana el grupo |
| `text` | string (máx. 4096) | Sí | No puede quedar vacío |
| `reference_type` | string (máx. 60) | No | Etiqueta tu documento (ej. `order`) para filtrar después |
| `reference_id` | string (máx. 36) | No | Id de tu documento |

Respuesta **202** (el mensaje entra a la cola, aún no se envió):

```json
{
  "id": "uuid-del-mensaje",
  "to_phone": "525512345678",
  "type": "text",
  "body": "Hola, tu pedido #1234 va en camino.",
  "file_name": null,
  "status": "queued",
  "error_message": null,
  "reference_type": "order",
  "reference_id": "1234",
  "sent_at": null,
  "delivered_at": null,
  "read_at": null,
  "created_by": "uuid",
  "created_at": "2026-10-21T21:30:00.000Z"
}
```

#### Enviar archivo

```bash
curl -X POST "$BASE/tenant/whatsapp/messages/file" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155550123",
    "file_url": "https://midominio.com/facturas/1234.pdf",
    "file_name": "Factura-1234.pdf",
    "mimetype": "application/pdf",
    "caption": "Tu factura"
  }'
```

- `file_url`: **https** y pública (se rechazan `localhost`, IPs, `.local`, `.internal`). WAHA descarga el archivo desde esa URL.
- `mimetype` (opcional): si empieza con `image/` sale como **foto**; cualquier otro, como **documento**.
- `file_name`, `caption`: opcionales.
- Si el backend se reinicia con archivos en cola, esos mensajes pasan a `failed` y hay que reenviarlos. Los textos se reencolan solos.

#### Seguimiento del estado

El envío es **asíncrono**. Consulta `GET /messages/:id` (por ejemplo cada 3–5 s, máx. 1–2 min):

`queued` → `sending` → `sent` → `delivered` → `read` · o `failed` (con `error_message`).

Los estados `delivered`/`read` dependen de que Pollux tenga configurado `WAHA_WEBHOOK_BASE_URL`.

### 2.5 Reglas de teléfono

- 10 dígitos → se toma como **México** (`+52`).
- `521` + 10 dígitos → se convierte a `52` + 10 dígitos.
- Otro país: escribirlo con código (`+14155550123`, `0034…`). Se aceptan espacios, guiones y paréntesis; se limpian.
- Debe quedar entre 11 y 15 dígitos.
- Antes de enviar se verifica que el número tenga WhatsApp; si no, el mensaje queda `failed` con «El número no tiene WhatsApp…».

### 2.6 Cliente de ejemplo para el backend del otro proyecto (TypeScript, Node 18+)

Maneja login, token en memoria y re-login automático si el token expira o cambian los permisos.

```typescript
// pollux-whatsapp.client.ts
const BASE = process.env.POLLUX_API_URL!; // https://sapi.sinergydigital.mx/api
const EMAIL = process.env.POLLUX_SERVICE_EMAIL!;
const PASSWORD = process.env.POLLUX_SERVICE_PASSWORD!;

export interface PolluxWhatsappMessage {
  id: string;
  to_phone: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
}

export class PolluxHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

let token: string | null = null;
let loginInFlight: Promise<string> | null = null;

async function login(): Promise<string> {
  // Evita varios logins simultáneos
  loginInFlight ??= fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(15000),
  })
    .then(async (res) => {
      if (!res.ok) throw new PolluxHttpError(res.status, 'No se pudo iniciar sesión en Pollux');
      const json = (await res.json()) as { access_token: string };
      token = json.access_token;
      return token;
    })
    .finally(() => {
      loginInFlight = null;
    });
  return loginInFlight;
}

async function call<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const bearer = token ?? (await login());
  const res = await fetch(`${BASE}/tenant/whatsapp${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${bearer}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });

  // Token vencido o permisos cambiados (PERMISSIONS_CHANGED): se vuelve a entrar una vez
  if (res.status === 401 && retry) {
    token = null;
    return call<T>(method, path, body, false);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new PolluxHttpError(res.status, message ?? `Pollux respondió ${res.status}`);
  }
  return (await res.json()) as T;
}

export const polluxWhatsapp = {
  status: () => call<{ state: string; phone_number: string | null }>('GET', '/session'),
  sendText: (phone: string, text: string, ref?: { type: string; id: string }) =>
    call<PolluxWhatsappMessage>('POST', '/messages/text', {
      phone,
      text,
      reference_type: ref?.type,
      reference_id: ref?.id,
    }),
  sendFile: (phone: string, fileUrl: string, opts: { name?: string; mimetype?: string; caption?: string } = {}) =>
    call<PolluxWhatsappMessage>('POST', '/messages/file', {
      phone,
      file_url: fileUrl,
      file_name: opts.name,
      mimetype: opts.mimetype,
      caption: opts.caption,
    }),
  getMessage: (id: string) => call<PolluxWhatsappMessage>('GET', `/messages/${id}`),
};
```

Variables del otro backend:

```env
POLLUX_API_URL=https://sapi.sinergydigital.mx/api
POLLUX_SERVICE_EMAIL=integraciones@tuempresa.com
POLLUX_SERVICE_PASSWORD=********
```

### 2.7 Arquitectura (otro proyecto)

```
Navegador (otro front)
   │  POST /api/notifications/whatsapp   (con la sesión del otro proyecto)
   ▼
Backend del otro proyecto  ── valida su propio usuario/permisos
   │  Bearer <token del usuario de servicio>
   ▼
Pollux  /api/tenant/whatsapp/messages/text
   ▼
WAHA → WhatsApp
```

El front del otro proyecto **solo** conoce los endpoints de su propio backend. Ejemplo de endpoint propio (NestJS):

```typescript
@Post('notifications/whatsapp')
@UseGuards(MiPropioAuthGuard)
async send(@Body() dto: { phone: string; text: string; orderId?: string }) {
  const status = await polluxWhatsapp.status();
  if (status.state !== 'connected') throw new ServiceUnavailableException('WhatsApp no está disponible.');
  return polluxWhatsapp.sendText(dto.phone, dto.text, dto.orderId ? { type: 'order', id: dto.orderId } : undefined);
}
```

### 2.8 Errores

| HTTP | Causa | Qué hacer |
|---|---|---|
| 400 | Teléfono inválido, texto vacío, URL no `https`/pública, WhatsApp no conectado | Corregir datos. «WhatsApp no está conectado…» → escanear QR en Pollux |
| 401 | Token vencido o `PERMISSIONS_CHANGED` | Re-login (el cliente de ejemplo lo hace solo). Si persiste: credenciales mal |
| 403 | El usuario de servicio no tiene el permiso, o el módulo `whatsapp` no está habilitado en su organización | Revisar rol y módulo |
| 429 | Se alcanzó el límite diario de la organización (por defecto 1000, **compartido** con el ERP) | Esperar al día siguiente o pedir subir `WHATSAPP_DAILY_LIMIT` |
| 502/503 | WAHA no responde o no está configurado | Reintentar con espera; avisar a soporte |

Errores de validación llegan como `{ "statusCode": 400, "message": ["..."], "error": "Bad Request" }`.

### 2.9 Limitaciones del Modo A

- Solo hay **un número** por organización de Pollux: todo sale desde él.
- El límite diario (1000) y la cola serial (2–5 s entre mensajes) son **compartidos** con lo que envíe el ERP.
- Los mensajes aparecen en el historial de esa organización en Pollux (usa `reference_type`/`reference_id` para distinguirlos).
- Si necesitas un número distinto por cliente, usa el **Modo B**, o una organización de Pollux por cliente con su propio usuario de servicio.
- No hay API keys ni tokens de servicio permanentes: si algún día se requiere, hay que construir esa función en Pollux (hoy se usa email/contraseña + JWT).
- Mientras la contraseña del usuario de servicio sea válida, cualquiera que la tenga puede enviar. Guárdala solo como secreto del servidor y rótala si se filtra.

---

## 3. Modo B — WAHA directo

> La implementación completa paso a paso (autenticación de WAHA, módulo de backend y pantalla de frontend) está en [WAHA_DIRECT_IMPLEMENTATION.md](./WAHA_DIRECT_IMPLEMENTATION.md). En el ERP: pestaña «Implementar WAHA directo».

El otro proyecto habla **directamente con [WAHA](https://waha.devlike.pro/)** (el mismo servidor que usa Pollux o uno propio), crea **una sesión por cliente** y administra su propio QR, cola y webhooks. No interviene Pollux.

### 3.1 Seguridad: léelo antes de empezar

- `WAHA_API_KEY` es **global**: quien la tenga puede listar, borrar, reiniciar y enviar con **cualquier** sesión del servidor, incluidas las del ERP (`erp_<id>`).
- **Recomendado:** levantar un **WAHA propio** (otro servicio en Railway/Docker) para el otro proyecto. Así no hay riesgo cruzado y se puede reiniciar sin afectar al ERP.
- Si se comparte el WAHA de Pollux: usar un prefijo propio de sesiones (`miapp_<idCliente>`), **nunca** listar/borrar/reiniciar sesiones que no empiecen con tu prefijo, y avisar al administrador (comparten límite de recursos).
- La API key y la URL de WAHA viven **solo** en variables de entorno del backend. Nunca en el front, nunca en el repo, nunca en logs ni en mensajes de error al cliente.
- No devuelvas al usuario final el error crudo de WAHA (puede revelar URLs internas): traduce a mensajes propios.

### 3.2 Servidor WAHA propio (resumen)

Variables del servicio WAHA (verificar nombres contra la versión instalada):

| Variable | Valor |
|---|---|
| `WAHA_API_KEY` | Llave larga y aleatoria |
| `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` | Acceso al dashboard |
| `WHATSAPP_SWAGGER_USERNAME` / `WHATSAPP_SWAGGER_PASSWORD` | Acceso al Swagger |
| `WHATSAPP_DEFAULT_ENGINE` | `NOWEB` (no abre un Chromium por sesión; mucho más ligero) |
| `WHATSAPP_RESTART_ALL_SESSIONS` | `True` (reinicia sesiones guardadas al arrancar) |

- **Volumen persistente** montado en `/app/.sessions`. Sin volumen, cada redeploy borra las sesiones y todos los clientes tendrían que volver a escanear el QR.
- WAHA **2026.6.1 o posterior**: sesiones ilimitadas y multimedia en Core (gratis). En versiones anteriores Core solo tiene la sesión `default` (un cliente).

### 3.3 Variables del backend del otro proyecto

| Variable | Obligatoria | Descripción |
|---|---|---|
| `WAHA_BASE_URL` | Sí | URL de WAHA sin `/` final |
| `WAHA_API_KEY` | Sí | Se manda en el header `X-Api-Key` |
| `WAHA_WEBHOOK_BASE_URL` | Para estados/acks | URL pública de **tu** backend |
| `WAHA_WEBHOOK_SECRET` | Recomendada | Secreto maestro para derivar la llave HMAC de cada sesión |
| `WHATSAPP_DEFAULT_COUNTRY_CODE` | No | Lada para teléfonos de 10 dígitos (`52`) |
| `WHATSAPP_DAILY_LIMIT` | No | Mensajes por día por cliente (`1000`) |
| `WHATSAPP_MIN_DELAY_MS` / `WHATSAPP_MAX_DELAY_MS` | No | Pausa entre mensajes de una sesión (2000–5000) |

### 3.4 Endpoints de WAHA que se usan

Todos con header `X-Api-Key: <WAHA_API_KEY>`. Cuerpo JSON.

| Acción | Método y ruta | Body / query |
|---|---|---|
| Versión del servidor | `GET /api/server/version` | — |
| Ver sesión | `GET /api/sessions/{name}` | 404 si no existe |
| Crear e iniciar | `POST /api/sessions` | `{ name, start: true, config }` |
| Actualizar config | `PUT /api/sessions/{name}` | `{ name, config }` (no hacerlo con la sesión activa: WAHA la reinicia) |
| Iniciar / detener / reiniciar | `POST /api/sessions/{name}/start` · `/stop` · `/restart` | — |
| Desvincular teléfono | `POST /api/sessions/{name}/logout` | — |
| Borrar sesión | `DELETE /api/sessions/{name}` | — |
| QR | `GET /api/{name}/auth/qr?format=image` con `Accept: application/json` | → `{ mimetype, data }` (base64) |
| Código por teléfono | `POST /api/{name}/auth/request-code` | `{ phoneNumber }` → `{ code }` (8 caracteres) |
| ¿Tiene WhatsApp? | `GET /api/contacts/check-exists?phone=<digits>&session=<name>` | → `{ numberExists, chatId }` |
| Grupos | `GET /api/{session}/groups?exclude=participants` | Si viene vacío, `GET /api/{session}/chats` y filtrar `…@g.us`. Detalle en [WAHA_GROUPS.md](./WAHA_GROUPS.md) |
| «Escribiendo…» | `POST /api/startTyping` · `/api/stopTyping` | `{ session, chatId }` |
| Texto | `POST /api/sendText` | `{ session, chatId, text }` |
| Documento | `POST /api/sendFile` | `{ session, chatId, file: { url \| data, filename, mimetype }, caption? }` |
| Foto | `POST /api/sendImage` | igual que `sendFile` |

Notas:

- `chatId` de una persona = el que devuelve `check-exists` (`chatId`) o `<digits>@c.us`.
- `chatId` de un grupo = `120363…@g.us` (el `id` de [WAHA_GROUPS.md](./WAHA_GROUPS.md)). No se llama a `check-exists`.
- `file.data` es base64 **sin** el prefijo `data:`. Con `file.url` WAHA descarga el archivo (solo `https` público).
- Estados de sesión (`status`): `STOPPED`, `STARTING`, `SCAN_QR_CODE`, `WORKING`, `FAILED`. Se puede enviar solo en `WORKING`.
- El QR solo existe con `status = SCAN_QR_CODE`, y WAHA lo renueva cada pocos segundos.
- Código de error 422/409 de WAHA al enviar = sesión no iniciada o sin vincular. 404 = la sesión no existe (p. ej. se reinstaló WAHA sin volumen).

### 3.5 Flujo de conexión (QR)

1. `POST /api/sessions` con nombre propio, `start: true` y webhook (sección 3.8). Si ya existe y está `STOPPED`/`FAILED`: `PUT` de config y luego `POST .../start`. **Idempotente**.
2. El front consulta **tu** `GET /whatsapp/session/qr` cada ~3 s. Cuando `state = waiting_qr` devuelves `qr_data_url = "data:image/png;base64,..."`.
3. El usuario escanea: WhatsApp → Dispositivos vinculados → Vincular dispositivo. El estado pasa a `WORKING` (por webhook o por el siguiente sondeo).
4. Si expira, volver a `failed/disconnected` y ofrecer «Generar nuevo QR».
5. Sin cámara: `request-code` con el teléfono del WhatsApp que se va a vincular → mostrar el código → «Vincular con número de teléfono».

Mapa de estados para tu UI:

| WAHA `status` | `state` de tu API |
|---|---|
| (sin registro) | `not_configured` |
| `STOPPED` | `disconnected` |
| `STARTING` | `starting` |
| `SCAN_QR_CODE` | `waiting_qr` |
| `WORKING` | `connected` |
| `FAILED` | `failed` |

### 3.6 Cliente WAHA de referencia (TypeScript, Node 18+)

```typescript
// waha.client.ts
const baseUrl = () => (process.env.WAHA_BASE_URL ?? '').trim().replace(/\/+$/, '');

export class WahaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
  get isNotFound() { return this.status === 404; }
  get isSessionUnavailable() { return this.status === 422 || this.status === 409; }
}

async function raw(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'X-Api-Key': process.env.WAHA_API_KEY!.trim(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new WahaError('El servicio de WhatsApp no respondió. Intenta de nuevo.', 503);
  }
  if (!res.ok) throw new WahaError(`WAHA respondió ${res.status}`, res.status);
  return res;
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const text = await (await raw(method, path, body)).text();
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

const s = encodeURIComponent;

export const waha = {
  getSession: (name: string) => request<{ name: string; status: string; me?: { id?: string; pushName?: string } }>('GET', `/api/sessions/${s(name)}`),
  createSession: (name: string, config: unknown) => request('POST', '/api/sessions', { name, start: true, config }),
  updateSession: (name: string, config: unknown) => request('PUT', `/api/sessions/${s(name)}`, { name, config }),
  start: (name: string) => request('POST', `/api/sessions/${s(name)}/start`),
  restart: (name: string) => request('POST', `/api/sessions/${s(name)}/restart`),
  logout: (name: string) => request('POST', `/api/sessions/${s(name)}/logout`),
  delete: (name: string) => request('DELETE', `/api/sessions/${s(name)}`),

  async qr(name: string): Promise<{ mimetype: string; data: string }> {
    const res = await raw('GET', `/api/${s(name)}/auth/qr?format=image`, undefined, { Accept: 'application/json' });
    const type = res.headers.get('content-type') ?? '';
    if (type.startsWith('image/')) {
      return { mimetype: type.split(';')[0], data: Buffer.from(await res.arrayBuffer()).toString('base64') };
    }
    const json = (await res.json()) as { mimetype?: string; data?: string };
    if (!json.data) throw new WahaError('Respuesta de QR inválida.', 502);
    return { mimetype: json.mimetype || 'image/png', data: json.data };
  },

  async pairingCode(name: string, phoneNumber: string): Promise<string> {
    const r = await request<{ code?: string }>('POST', `/api/${s(name)}/auth/request-code`, { phoneNumber });
    if (!r?.code) throw new WahaError('WAHA no devolvió el código.', 502);
    return r.code;
  },

  checkExists: (session: string, phone: string) =>
    request<{ numberExists: boolean; chatId?: string | null }>(
      'GET',
      `/api/contacts/check-exists?${new URLSearchParams({ phone, session })}`,
    ),
  startTyping: (session: string, chatId: string) => request('POST', '/api/startTyping', { session, chatId }),
  stopTyping: (session: string, chatId: string) => request('POST', '/api/stopTyping', { session, chatId }),
  sendText: (session: string, chatId: string, text: string) => request('POST', '/api/sendText', { session, chatId, text }),
  sendFile: (session: string, chatId: string, file: { url?: string; data?: string; filename?: string; mimetype?: string }, caption?: string) =>
    request('POST', '/api/sendFile', { session, chatId, file, ...(caption ? { caption } : {}) }),
  sendImage: (session: string, chatId: string, file: { url?: string; data?: string; filename?: string; mimetype?: string }, caption?: string) =>
    request('POST', '/api/sendImage', { session, chatId, file, ...(caption ? { caption } : {}) }),
};
```

### 3.7 Nombre de sesión, teléfonos, cola y límites

**Nombre de sesión** (único por cliente, solo `[A-Za-z0-9_]`):

```typescript
export const buildSessionName = (customerId: string) => `miapp_${customerId.replace(/[^a-zA-Z0-9]/g, '')}`;
```

El nombre se calcula **siempre en el servidor** a partir del usuario autenticado. El front jamás manda ni elige el nombre de sesión.

**Teléfono**:

```typescript
export function normalizePhone(raw: string, defaultCountry = '52'): string | null {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (!d) return null;
  if (d.length === 10) d = `${defaultCountry}${d}`;
  if (d.startsWith('521') && d.length === 13) d = `52${d.slice(3)}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}
```

**Cola anti-bloqueo** (importante para no perder el número):

1. Guardar el mensaje en BD como `queued` y responder **202** de inmediato.
2. Procesar en una **cola serial por sesión** (un mensaje a la vez).
3. Entre mensajes: pausa **aleatoria** de 2–5 s.
4. Antes de cada envío: `check-exists`; si `numberExists = false` → `failed`.
5. Texto: `startTyping` → esperar `min(4000, 800 + largo*25)` ms → `stopTyping` → `sendText`. (Los errores de typing se ignoran.)
6. Reclamo atómico `UPDATE ... SET status='sending' WHERE id=? AND status='queued'` para que, con varias instancias, solo una envíe.
7. Límite diario por cliente (por defecto 1000); al excederlo → **429**.
8. Al arrancar el backend: reencolar `queued` de las últimas 24 h; marcar `failed` los `sending` viejos (>2 min) y los archivos pendientes (la URL/base64 solo vivía en memoria).

Estados del mensaje: `queued → sending → sent → delivered → read` o `failed`. Un ack tardío nunca regresa un estado.

### 3.8 Webhook (estados y confirmaciones)

Al crear la sesión, mandar en `config`:

```json
{
  "metadata": { "app.customer_id": "<id>" },
  "webhooks": [
    {
      "url": "https://api.tuproyecto.com/api/webhooks/whatsapp/waha",
      "events": ["session.status", "message.ack"],
      "hmac": { "key": "<llave derivada de la sesión>" },
      "retries": { "policy": "exponential", "delaySeconds": 2, "attempts": 6 }
    }
  ]
}
```

**Llave HMAC por sesión** (no se guarda en BD; se deriva):

```typescript
import * as crypto from 'crypto';
export const deriveWebhookKey = (secret: string, sessionName: string) =>
  crypto.createHmac('sha256', secret).update(sessionName).digest('hex');
```

Así una firma válida de una sesión no sirve para otra.

**Receptor** (ruta pública, sin tu autenticación; la seguridad es la firma). Necesita el **cuerpo crudo** (`rawBody: true` en NestJS):

```typescript
export function verifyHmac(rawBody: Buffer | string, key: string, received?: string, algorithm = 'sha512'): boolean {
  if (!received) return false;
  const algo = algorithm.toLowerCase() === 'sha256' ? 'sha256' : 'sha512';
  const expected = Buffer.from(crypto.createHmac(algo, key).update(rawBody).digest('hex'));
  const got = Buffer.from(received.trim().toLowerCase());
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}
```

Headers de WAHA: `X-Webhook-Hmac` (firma) y `X-Webhook-Hmac-Algorithm` (por defecto `sha512`). Flujo:

1. Leer `body.session`; si falta o no hay secreto → 401.
2. `key = deriveWebhookKey(secret, body.session)`; si la firma no coincide → **401**.
3. Resolver al cliente **por el nombre de sesión**, nunca por datos del body.
4. Eventos:
   - `session.status`: **no confiar en el estado del evento** (los reintentos llegan desordenados: un `FAILED` viejo después de `WORKING`). Consultar `GET /api/sessions/{name}` y guardar ese estado; usar el del evento solo si WAHA no responde. Si `WORKING`: guardar `me.id` (teléfono, sin `@c.us`) y `me.pushName`.
   - `message.ack`: ignorar si `payload.fromMe === false`. Buscar el mensaje por `session_name + payload.id` y avanzar el estado.

Mapa de acks:

| `ackName` | `ack` | Estado |
|---|---|---|
| `ERROR` | `-1` | `failed` |
| `PENDING` | `0` | (ignorar) |
| `SERVER` | `1` | `sent` |
| `DEVICE` | `2` | `delivered` |
| `READ` / `PLAYED` | `3` / `4` | `read` |

Sin `WAHA_WEBHOOK_BASE_URL`, la conexión y los envíos funcionan, pero no se actualizan «Entregado/Leído» ni las desconexiones.

**ID del mensaje de WAHA** (`waha_message_id`): cambia de forma según el motor. Buscarlo en `result.id` (string), `result.id._serialized`/`result.id.id`, o `result._data.id._serialized`.

### 3.9 Tablas sugeridas

- `whatsapp_sessions`: `customer_id` (**UNIQUE**), `session_name` (**UNIQUE**), `status`, `phone_number`, `push_name`, `connected_at`, `last_status_at`, `last_error`, `created_by`, `updated_by`.
- `whatsapp_messages`: `customer_id`, `session_name`, `to_phone`, `chat_id`, `type` (`text`/`file`), `body`, `file_name`, `file_mimetype`, `status`, `waha_message_id`, `error_message`, `reference_type`, `reference_id`, `sent_at`, `delivered_at`, `read_at`, `created_by`, `created_at`, `updated_at`.
- Índices: `(session_name, waha_message_id)`, `(customer_id, created_at)`, `(status, created_at)`.
- **Todas** las consultas filtran por `customer_id`.

Referencia directa: migración `src/database/migrations/1793000000000-create-whatsapp.ts` y entidades en `src/entities/whatsapp/`.

### 3.10 Qué copiar de este repo (backend)

Carpeta `src/api/whatsapp/` completa:

| Archivo | Qué hace |
|---|---|
| `services/waha-client.service.ts` | Cliente HTTP de WAHA |
| `services/whatsapp-session.service.ts` | Conectar, QR, código, reiniciar, desvincular, estado |
| `services/whatsapp-message.service.ts` | Cola serial, límites, historial, `sendBuffer` |
| `services/whatsapp-webhook.service.ts` + `whatsapp-webhook.controller.ts` | Receptor firmado |
| `utils/whatsapp.util.ts` (+ `.spec.ts`) · `utils/whatsapp-errors.ts` | Teléfonos, HMAC, acks, URL segura, errores amigables |
| `dto/whatsapp.dto.ts` · `whatsapp.constants.ts` · `whatsapp.controller.ts` · `whatsapp.module.ts` | API REST |

Adaptaciones al copiar:

1. Reemplazar `tenant_id`/`TenantContextService` por el id de cliente de tu proyecto (en este repo es la organización).
2. Cambiar `buildSessionName` (prefijo `erp_` → el tuyo) y `metadata['erp.tenant_id']`.
3. Cambiar `WAHA_WEBHOOK_PATH` si tu prefijo global no es `api`.
4. Cambiar `JwtAuthGuard`/`PermissionGuard`/`RequirePermissions` por los de tu proyecto.
5. Activar `rawBody` en `main.ts`: `NestFactory.create(AppModule, { rawBody: true })`.
6. Registrar entidades y correr la migración.

---

## 4. Frontend del otro proyecto (Angular)

El front **solo** llama a **tu** backend (que a su vez usa Modo A o B). Nunca a Pollux ni a WAHA.

Archivos de referencia en el frontend de Pollux:

| Archivo | Contenido |
|---|---|
| `src/app/features/settings/services/whatsapp.service.ts` | Servicio HTTP |
| `src/app/features/settings/models/whatsapp.model.ts` | Tipos |
| `src/app/features/settings/pages/whatsapp-settings/whatsapp-settings.component.{ts,html}` | Pantalla de conexión (QR, código, mensaje de prueba, historial) |
| `src/app/features/settings/config/whatsapp-permissions.config.ts` | Permisos de pantalla |

### 4.1 Modo A (solo enviar)

No hay pantalla de QR: la conexión se administra en Pollux. En tu front basta un servicio que llame a tu endpoint de envío:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = `${environment.api}/notifications/whatsapp`;
  constructor(private http: HttpClient) {}

  sendWhatsapp(payload: { phone: string; text: string; orderId?: string }) {
    return this.http.post<{ id: string; status: string }>(this.api, payload);
  }
}
```

Mostrar «En cola» al recibir 202 y, si quieres seguimiento, consultar tu propio `GET .../:id`.

### 4.2 Modo B (conexión por cliente)

Copiar el servicio, modelo y componente de conexión, y apuntar `api` a **tu** backend. Contrato que debe exponer tu backend (mismo que el de Pollux, sin `tenant/`):

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/whatsapp/session` | `{ configured, service_available, state, status, phone_number, push_name, connected_at, last_status_at, last_error }` |
| `POST` | `/whatsapp/session/connect` | igual que arriba |
| `GET` | `/whatsapp/session/qr` | igual + `qr_data_url` |
| `POST` | `/whatsapp/session/pairing-code` | `{ code }` |
| `POST` | `/whatsapp/session/restart` · `/logout` | estado |
| `DELETE` | `/whatsapp/session` | `{ ok: true }` |
| `POST` | `/whatsapp/messages/text` · `/messages/file` | mensaje en `queued` (202) |
| `GET` | `/whatsapp/messages` · `/messages/:id` | historial / detalle |

Reglas de la pantalla (ya implementadas en el componente de Pollux):

- Al entrar: `GET /session`. Si `waiting_qr` o `starting`, iniciar sondeo.
- Sondeo de `GET /session/qr` cada **3 s**; mostrar `qr_data_url` solo en `waiting_qr`; detener al llegar a `connected`/`failed`/`disconnected`.
- Detener el sondeo tras **5 errores seguidos** y ofrecer «Generar nuevo QR».
- Limpiar teléfonos al pegar (quitar espacios, guiones y paréntesis; conservar un `+` inicial).
- Avisar que 10 dígitos = México; para otro país, escribir `+código`.
- Ocultar botones según permisos (`Update` conectar/reiniciar/desvincular, `Delete` eliminar, `Create` enviar).
- Mostrar `last_error` solo cuando `state !== 'connected'`.

---

## 5. Pruebas rápidas (checklist)

### Modo A

```bash
BASE=https://sapi.sinergydigital.mx/api
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"integraciones@tuempresa.com","password":"********"}' | jq -r .access_token)

curl -s $BASE/tenant/whatsapp/session -H "Authorization: Bearer $TOKEN"          # state: connected
curl -s -X POST $BASE/tenant/whatsapp/messages/text -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"phone":"5512345678","text":"Prueba"}'  # 202 queued
curl -s "$BASE/tenant/whatsapp/messages?limit=5" -H "Authorization: Bearer $TOKEN"
```

### Modo B (directo a WAHA)

```bash
WAHA=https://tu-waha.up.railway.app
KEY=tu_api_key

curl -s $WAHA/api/server/version -H "X-Api-Key: $KEY"
curl -s -X POST $WAHA/api/sessions -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"name":"miapp_prueba","start":true,"config":{}}'
curl -s "$WAHA/api/miapp_prueba/auth/qr?format=image" -H "X-Api-Key: $KEY" -H "Accept: application/json"   # {mimetype,data}
curl -s "$WAHA/api/contacts/check-exists?phone=525512345678&session=miapp_prueba" -H "X-Api-Key: $KEY"
curl -s -X POST $WAHA/api/sendText -H "X-Api-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"session":"miapp_prueba","chatId":"525512345678@c.us","text":"Prueba"}'
curl -s -X DELETE $WAHA/api/sessions/miapp_prueba -H "X-Api-Key: $KEY"    # limpiar la sesión de prueba
```

---

## 6. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `401` en todas las llamadas (A) | Credenciales del usuario de servicio incorrectas o usuario inactivo | Probar el login con curl |
| `401 PERMISSIONS_CHANGED` (A) | Cambiaron los permisos del usuario | Re-login (o `POST /auth/refresh`) |
| `403` (A) | Falta permiso `whatsapp` o el módulo no está habilitado en la organización | Revisar rol y panel de módulos |
| «WhatsApp no está conectado» | La sesión no está en `WORKING` | Escanear QR / reiniciar |
| Mensaje `failed`: «El número no tiene WhatsApp» | Número sin WhatsApp o lada incorrecta | Verificar número; otro país con `+código` |
| `429` | Límite diario alcanzado | Esperar o subir el límite |
| Todo `queued` y nada sale | Sesión caída o cola atorada | Ver estado de la sesión; reiniciar |
| Se pierden todas las sesiones tras un deploy de WAHA | Sin volumen en `/app/.sessions` | Montar volumen persistente |
| `delivered/read` nunca aparecen | Falta `WAHA_WEBHOOK_BASE_URL` o el webhook no es alcanzable | Configurar URL pública; revisar firma HMAC (401 en tu receptor) |
| Webhook responde 401 | `rawBody` no activo, secreto distinto o nombre de sesión distinto | Activar `rawBody`; mismo `WAHA_WEBHOOK_SECRET` al crear la sesión y al verificar |
| Número bloqueado por WhatsApp | Envíos masivos o sin pausa | Respetar cola serial, pausas 2–5 s, `check-exists`, límites; no enviar spam |
