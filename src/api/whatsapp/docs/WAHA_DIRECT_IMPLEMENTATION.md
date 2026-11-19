# Guía — Implementar WAHA directo en otro proyecto (autenticación, backend y frontend)

Paso a paso para que **otro proyecto** (NestJS + TypeORM + Angular, igual que Pollux) hable **directo con WAHA**: cómo funciona la autenticación de WAHA, cómo levantarlo, y el módulo completo de backend y frontend para que cada cliente conecte **su propio número** con su QR.

Complementa a [EXTERNAL_INTEGRATION_GUIDE.md](./EXTERNAL_INTEGRATION_GUIDE.md) (pestaña «Modo B — WAHA directo»), que trae el cliente HTTP de WAHA, el teléfono, el HMAC y las tablas de referencia. Aquí se arma todo el módulo usándolos.

## Historial

- 2026-10-21: Primera versión. Autenticación de WAHA, servidor, módulo backend completo, frontend y puesta en producción.

## 1. Cómo se autentica todo (las 4 llaves)

Con WAHA directo hay **cuatro mecanismos distintos**. Confundirlos es el error más común.

| # | Qué protege | Quién lo manda | Dónde se configura | Cómo se ve |
|---|---|---|---|---|
| 1 | **API REST de WAHA** (crear sesiones, enviar mensajes) | Tu **backend** → WAHA | `WAHA_API_KEY` en el servicio WAHA | Header `X-Api-Key: <llave>` |
| 2 | **Dashboard** de WAHA (panel web) | Una persona en el navegador | `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` | Login del panel |
| 3 | **Swagger** de WAHA (documentación interactiva) | Una persona en el navegador | `WHATSAPP_SWAGGER_USERNAME` / `WHATSAPP_SWAGGER_PASSWORD` | Login básico del Swagger |
| 4 | **Webhook** WAHA → tu backend | **WAHA** → tu backend | `hmac.key` dentro de la config de cada sesión | Header `X-Webhook-Hmac` |

Y aparte, la **vinculación del teléfono** (no es una llave): el cliente escanea el QR (o usa el código por número) y WAHA queda ligado a ese WhatsApp.

### 1.1 La API key (la que más importa)

- Es **una sola llave para todo el servidor**: quien la tenga puede crear, listar, reiniciar, borrar y enviar con **cualquier** sesión.
- Se manda **solo desde el backend** en cada petición:

```bash
curl https://tu-waha.up.railway.app/api/sessions -H "X-Api-Key: TU_LLAVE"
```

- Sin llave o con llave incorrecta WAHA responde **401**.
- Genera una llave larga y aleatoria:

```bash
openssl rand -hex 32
# o, con Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- WAHA también admite guardar la llave en el servidor como **hash** (`WAHA_API_KEY=sha512:<hash>`); tu backend sigue mandando la llave **en claro**. Verifica el formato exacto en la documentación de seguridad de tu versión de WAHA.
- **Nunca** la pongas en el frontend, en el repositorio, en logs ni en mensajes de error.
- Rotarla: cambia `WAHA_API_KEY` en WAHA y en el backend a la vez, y reinicia ambos. Las sesiones (teléfonos vinculados) **no se pierden**.

### 1.2 Dashboard y Swagger

Son para humanos (soporte/desarrollo). Ponles usuario y contraseña **distintos** a la API key. En Swagger, el botón **Authorize** pide la API key para probar los endpoints. Si WAHA es público, considera restringir el dashboard por IP o dejarlo detrás de una VPN.

### 1.3 El webhook (WAHA → tu backend)

Aquí los papeles se invierten: WAHA llama a **tu** backend, y tu backend no puede confiar en quien llame. Por eso cada sesión lleva una **llave HMAC propia** y WAHA firma el cuerpo de cada evento. Tu receptor recalcula la firma; si no coincide, responde **401**. Detalle en la sección 6.

### 1.4 Dónde poner WAHA en la red

- Lo ideal: WAHA **sin exposición pública**, accesible solo por la red interna (misma red de Docker / red privada de Railway). Tu backend lo llama por URL interna (`http://waha:3000`).
- Si debe ser público (Railway con dominio), la API key es lo único que lo protege: llave larga, HTTPS obligatorio, y dashboard/Swagger con contraseña.
- El **webhook sí necesita** que WAHA pueda llegar a tu backend (URL pública o red interna). En desarrollo local, WAHA en Docker no ve `localhost` de tu PC: usa un túnel (ngrok, cloudflared) o `host.docker.internal`.

---

## 2. Levantar tu servidor WAHA

### 2.1 Docker Compose (local o VPS)

```yaml
services:
  waha:
    image: devlikeapro/waha:latest
    restart: always
    ports:
      - '3000:3000'
    environment:
      WAHA_API_KEY: ${WAHA_API_KEY}
      WAHA_DASHBOARD_USERNAME: admin
      WAHA_DASHBOARD_PASSWORD: ${WAHA_DASHBOARD_PASSWORD}
      WHATSAPP_SWAGGER_USERNAME: admin
      WHATSAPP_SWAGGER_PASSWORD: ${WAHA_SWAGGER_PASSWORD}
      WHATSAPP_DEFAULT_ENGINE: NOWEB
      WHATSAPP_RESTART_ALL_SESSIONS: 'True'
    volumes:
      - ./waha-sessions:/app/.sessions
```

Los nombres de variables pueden cambiar entre versiones: verifícalos contra la versión instalada.

### 2.2 Railway

1. Nuevo servicio desde la imagen `devlikeapro/waha:latest`.
2. Variables: las mismas de arriba.
3. **Volumen persistente** montado en `/app/.sessions` (sin esto, cada redeploy borra los QR de todos los clientes).
4. Dominio público solo si tu backend no está en la misma red privada.

### 2.3 Qué versión

- **2026.6.1 o posterior**: sesiones ilimitadas y multimedia gratis. Es lo que asume esta guía (una sesión por cliente).
- **Anteriores** (Core): solo existe la sesión `default` → solo un cliente.
- Motor `NOWEB`: no abre Chromium por sesión; mucho más ligero con muchos clientes.

### 2.4 Verificar que la autenticación funciona

```bash
WAHA=https://tu-waha.up.railway.app
KEY=TU_LLAVE

curl -i $WAHA/api/server/version                      # esperado: 401
curl -i $WAHA/api/server/version -H "X-Api-Key: $KEY" # esperado: 200 con la versión
curl -s $WAHA/api/sessions -H "X-Api-Key: $KEY"       # lista de sesiones ([] si es nuevo)
```

Si con la llave sigue dando 401: la variable `WAHA_API_KEY` del servicio no coincide, el servicio no se reinició tras cambiarla, o hay un proxy que quita el header `X-Api-Key`.

---

## 3. Diseño del módulo en el otro proyecto

Cambia solo un concepto respecto a Pollux: la «organización» (`tenant_id`) pasa a ser **el dueño de la sesión** en tu proyecto. En el código de abajo se llama `owner_id`: puede ser el id del cliente, empresa o cuenta. Una sesión de WhatsApp por `owner_id`.

```
Front ─► Backend del otro proyecto ─► WAHA ─► WhatsApp
          │  (auth propia: JWT/sesión)   ▲
          │  owner_id sale del usuario   │ webhook firmado (HMAC)
          ▼                              │
        BD: whatsapp_sessions / whatsapp_messages
```

Reglas de oro:

1. El nombre de sesión **se calcula en el servidor** (`miapp_<owner_id sin guiones>`). El front nunca lo manda.
2. `owner_id` sale del usuario autenticado, **nunca** del body ni de la URL.
3. Toda consulta filtra por `owner_id`.
4. La API key vive solo en variables de entorno del backend.

Estructura de archivos:

```
src/api/whatsapp/
├── dto/whatsapp.dto.ts
├── services/
│   ├── waha-client.ts              (de «Modo B», sección 3.6)
│   ├── whatsapp-session.service.ts
│   ├── whatsapp-message.service.ts
│   └── whatsapp-webhook.service.ts
├── utils/whatsapp.util.ts
├── whatsapp.constants.ts
├── whatsapp.controller.ts
├── whatsapp-webhook.controller.ts
└── whatsapp.module.ts
src/entities/whatsapp/
├── whatsapp-session.entity.ts
└── whatsapp-message.entity.ts
```

---

## 4. Backend — paso a paso

### Paso 1. Variables de entorno

```env
WAHA_BASE_URL=http://waha:3000
WAHA_API_KEY=<llave larga>
WAHA_WEBHOOK_BASE_URL=https://api.tuproyecto.com
WAHA_WEBHOOK_SECRET=<otro secreto largo, distinto de la API key>
WHATSAPP_DEFAULT_COUNTRY_CODE=52
WHATSAPP_DAILY_LIMIT=1000
WHATSAPP_MIN_DELAY_MS=2000
WHATSAPP_MAX_DELAY_MS=5000
```

`WAHA_WEBHOOK_SECRET` es el secreto maestro del que se **deriva** la llave HMAC de cada sesión. No lo reutilices como API key.

### Paso 2. Activar el cuerpo crudo (rawBody)

El HMAC se calcula sobre el cuerpo **exacto** que mandó WAHA. En `main.ts`:

```typescript
const app = await NestFactory.create(AppModule, { rawBody: true });
app.setGlobalPrefix('api');
```

Si no activas `rawBody`, todas las firmas fallarán (401).

### Paso 3. Tablas y entidades

Migración (MySQL; adapta tipos si usas PostgreSQL):

```sql
CREATE TABLE whatsapp_sessions (
  id varchar(36) NOT NULL,
  owner_id varchar(36) NOT NULL,
  session_name varchar(80) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'STOPPED',
  phone_number varchar(32) NULL,
  push_name varchar(255) NULL,
  connected_at timestamp NULL,
  last_status_at timestamp NULL,
  last_error varchar(500) NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_whatsapp_sessions_owner (owner_id),
  UNIQUE KEY uq_whatsapp_sessions_name (session_name)
);

CREATE TABLE whatsapp_messages (
  id varchar(36) NOT NULL,
  owner_id varchar(36) NOT NULL,
  session_name varchar(80) NOT NULL,
  to_phone varchar(32) NOT NULL,
  chat_id varchar(64) NULL,
  type varchar(16) NOT NULL DEFAULT 'text',
  body text NULL,
  file_name varchar(255) NULL,
  file_mimetype varchar(120) NULL,
  status varchar(16) NOT NULL DEFAULT 'queued',
  error_message varchar(500) NULL,
  waha_message_id varchar(190) NULL,
  reference_type varchar(60) NULL,
  reference_id varchar(36) NULL,
  sent_at timestamp NULL,
  delivered_at timestamp NULL,
  read_at timestamp NULL,
  created_by varchar(36) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_whatsapp_messages_owner_created (owner_id, created_at),
  KEY idx_whatsapp_messages_owner_status (owner_id, status),
  KEY idx_whatsapp_messages_waha_id (session_name, waha_message_id),
  KEY idx_whatsapp_messages_reference (owner_id, reference_type, reference_id)
);
```

Entidades (TypeORM):

```typescript
// entities/whatsapp/whatsapp-session.entity.ts
@Entity('whatsapp_sessions')
@Index('uq_whatsapp_sessions_owner', ['owner_id'], { unique: true })
@Index('uq_whatsapp_sessions_name', ['session_name'], { unique: true })
export class WhatsappSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 36 }) owner_id: string;
  @Column({ type: 'varchar', length: 80 }) session_name: string;
  @Column({ type: 'varchar', length: 32, default: 'STOPPED' }) status: string;
  @Column({ type: 'varchar', length: 32, nullable: true }) phone_number: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) push_name: string | null;
  @Column({ type: 'timestamp', nullable: true }) connected_at: Date | null;
  @Column({ type: 'timestamp', nullable: true }) last_status_at: Date | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) last_error: string | null;
  @CreateDateColumn({ type: 'timestamp' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamp' }) updated_at: Date;
}

// entities/whatsapp/whatsapp-message.entity.ts
@Entity('whatsapp_messages')
@Index('idx_whatsapp_messages_owner_created', ['owner_id', 'created_at'])
@Index('idx_whatsapp_messages_waha_id', ['session_name', 'waha_message_id'])
export class WhatsappMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 36 }) owner_id: string;
  @Column({ type: 'varchar', length: 80 }) session_name: string;
  @Column({ type: 'varchar', length: 32 }) to_phone: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) chat_id: string | null;
  @Column({ type: 'varchar', length: 16, default: 'text' }) type: string;
  @Column({ type: 'text', nullable: true }) body: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) file_name: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) file_mimetype: string | null;
  @Column({ type: 'varchar', length: 16, default: 'queued' }) status: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) error_message: string | null;
  @Column({ type: 'varchar', length: 190, nullable: true }) waha_message_id: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) reference_type: string | null;
  @Column({ type: 'varchar', length: 36, nullable: true }) reference_id: string | null;
  @Column({ type: 'timestamp', nullable: true }) sent_at: Date | null;
  @Column({ type: 'timestamp', nullable: true }) delivered_at: Date | null;
  @Column({ type: 'timestamp', nullable: true }) read_at: Date | null;
  @Column({ type: 'varchar', length: 36 }) created_by: string;
  @CreateDateColumn({ type: 'timestamp' }) created_at: Date;
  @UpdateDateColumn({ type: 'timestamp' }) updated_at: Date;
}
```

### Paso 4. Cliente WAHA

Copia **tal cual** el cliente de la pestaña «Modo B — WAHA directo», sección 3.6 (`waha.client.ts`, objeto `waha` y clase `WahaError`). Es el único lugar que conoce `WAHA_BASE_URL` y `WAHA_API_KEY`:

- Manda `X-Api-Key` en **todas** las peticiones.
- Timeout de 30 s.
- Convierte fallos de red en `WahaError(503)`.
- Nunca incluye URL ni llave en el mensaje del error.

### Paso 5. Constantes y utilidades

```typescript
// whatsapp.constants.ts
export const WAHA_WEBHOOK_PATH = '/api/webhooks/whatsapp/waha';
export const WAHA_WEBHOOK_EVENTS = ['session.status', 'message.ack'];
export const WHATSAPP_TEXT_MAX_LENGTH = 4096;

export type WhatsappConnectionState =
  | 'not_configured' | 'disconnected' | 'starting' | 'waiting_qr' | 'connected' | 'failed';
export type WhatsappMessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
```

```typescript
// utils/whatsapp.util.ts
import * as crypto from 'crypto';

export const buildSessionName = (ownerId: string) => `miapp_${ownerId.replace(/[^a-zA-Z0-9]/g, '')}`;

// normalizePhone, deriveWebhookKey y verifyHmac: copiarlos de «Modo B» (secciones 3.7 y 3.8)

export function toConnectionState(status?: string | null): WhatsappConnectionState {
  switch (status) {
    case 'WORKING': return 'connected';
    case 'SCAN_QR_CODE': return 'waiting_qr';
    case 'STARTING': return 'starting';
    case 'FAILED': return 'failed';
    case 'STOPPED': return 'disconnected';
    default: return 'not_configured';
  }
}

export function phoneFromWahaId(id?: string | null): string | null {
  return id ? id.split('@')[0]?.split(':')[0] || null : null;
}

export function ackToMessageStatus(ack?: number | string | null, ackName?: string | null): WhatsappMessageStatus | null {
  const name = String(ackName ?? '').toUpperCase();
  if (name === 'ERROR') return 'failed';
  if (name === 'PENDING') return null;
  if (name === 'SERVER') return 'sent';
  if (name === 'DEVICE') return 'delivered';
  if (name === 'READ' || name === 'PLAYED') return 'read';
  const value = Number(ack);
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 'failed';
  if (value === 1) return 'sent';
  if (value === 2) return 'delivered';
  if (value >= 3) return 'read';
  return null;
}

const RANK: Record<WhatsappMessageStatus, number> = { queued: 0, sending: 1, sent: 2, delivered: 3, read: 4, failed: 5 };

/** Un ack tardío nunca regresa un mensaje a un estado anterior. */
export function shouldAdvanceStatus(current: WhatsappMessageStatus, next: WhatsappMessageStatus): boolean {
  if (current === 'read') return false;
  if (next === 'failed') return current === 'queued' || current === 'sending' || current === 'sent';
  if (current === 'failed') return false;
  return RANK[next] > RANK[current];
}

/** El id del mensaje cambia de forma según el motor de WAHA. */
export function extractWahaMessageId(payload: any): string | null {
  const id = payload?.id;
  if (typeof id === 'string' && id) return id;
  const nested = id?._serialized ?? id?.id ?? payload?._data?.id?._serialized;
  return typeof nested === 'string' && nested ? nested : null;
}

/** Solo URLs https públicas: evita que WAHA descargue recursos de la red interna. */
export function isSafePublicHttpsUrl(value: string): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return (
    host.includes('.') && host !== 'localhost' && !host.endsWith('.local') && !host.endsWith('.internal') &&
    !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !host.startsWith('[')
  );
}

export const randomDelay = (min: number, max: number) => Math.floor(min + Math.random() * Math.max(0, max - min));
```

### Paso 6. DTOs

```typescript
// dto/whatsapp.dto.ts
class SendBaseDto {
  @IsString() @IsNotEmpty() @MaxLength(32) phone: string;
  @IsOptional() @IsString() @MaxLength(60) reference_type?: string;
  @IsOptional() @IsString() @MaxLength(36) reference_id?: string;
}
export class SendWhatsappTextDto extends SendBaseDto {
  @IsString() @IsNotEmpty() @MaxLength(4096) text: string;
}
export class SendWhatsappFileDto extends SendBaseDto {
  @IsString() @IsNotEmpty() @MaxLength(2048) file_url: string;
  @IsOptional() @IsString() @MaxLength(255) file_name?: string;
  @IsOptional() @Matches(/^[\w.+-]+\/[\w.+-]+$/) mimetype?: string;
  @IsOptional() @IsString() @MaxLength(4096) caption?: string;
}
export class WhatsappPairingCodeDto {
  @IsString() @IsNotEmpty() @MaxLength(32) phone: string;
}
export class QueryWhatsappMessagesDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsIn(['queued', 'sending', 'sent', 'delivered', 'read', 'failed']) status?: string;
  @IsOptional() @IsString() reference_type?: string;
  @IsOptional() @IsString() reference_id?: string;
}
```

### Paso 7. Servicio de sesión (conexión y QR)

```typescript
// services/whatsapp-session.service.ts
@Injectable()
export class WhatsappSessionService {
  private readonly logger = new Logger(WhatsappSessionService.name);

  constructor(@InjectRepository(WhatsappSession) private readonly repo: Repository<WhatsappSession>) {}

  /** Estado de la conexión. Sincroniza con WAHA; si WAHA no responde, devuelve el último estado guardado. */
  async getStatus(ownerId: string) {
    const row = await this.repo.findOne({ where: { owner_id: ownerId } });
    if (!row) return this.emptyView();
    try {
      const live = await this.fetch(row.session_name);
      if (live) await this.apply(row, live);
      else await this.markStopped(row);
      return this.toView(row, true);
    } catch {
      return this.toView(row, false);
    }
  }

  /** Crea (si no existe) e inicia la sesión. Idempotente. */
  async connect(ownerId: string) {
    try {
      const row = await this.ensureRow(ownerId);
      const config = this.sessionConfig(row);
      let live = await this.fetch(row.session_name);
      if (!live) {
        live = await waha.createSession(row.session_name, config);
      } else if (live.status === 'STOPPED' || live.status === 'FAILED') {
        // Reaplica webhook y metadatos antes de arrancar. Con la sesión activa NO se hace: WAHA la reiniciaría.
        await waha.updateSession(row.session_name, config).catch(() => undefined);
        await waha.start(row.session_name);
        live = (await this.fetch(row.session_name)) ?? live;
      }
      await this.apply(row, live);
      return this.toView(row, true);
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /** QR vigente. El front lo consulta cada ~3 s hasta quedar conectado. */
  async qr(ownerId: string) {
    const row = await this.requireRow(ownerId);
    try {
      const live = await this.fetch(row.session_name);
      if (!live) {
        await this.markStopped(row);
        return { ...this.toView(row, true), qr_data_url: null };
      }
      await this.apply(row, live);
      let qr_data_url: string | null = null;
      if (live.status === 'SCAN_QR_CODE') {
        const qr = await waha.qr(row.session_name);
        qr_data_url = `data:${qr.mimetype};base64,${qr.data}`;
      }
      return { ...this.toView(row, true), qr_data_url };
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /** Alternativa sin cámara: código de 8 caracteres para «Vincular con número de teléfono». */
  async pairingCode(ownerId: string, phone: string) {
    const row = await this.requireRow(ownerId);
    const normalized = normalizePhone(phone);
    if (!normalized) throw new BadRequestException('Indica un número de teléfono válido.');
    try {
      const live = await this.fetch(row.session_name);
      if (live?.status !== 'SCAN_QR_CODE') {
        throw new BadRequestException('Primero inicia la conexión y espera a que aparezca el código QR.');
      }
      return { code: await waha.pairingCode(row.session_name, normalized) };
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async restart(ownerId: string) {
    const row = await this.requireRow(ownerId);
    try {
      await waha.restart(row.session_name);
      const live = await this.fetch(row.session_name);
      if (live) await this.apply(row, live);
      return this.toView(row, true);
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /** Desvincula el teléfono; conserva la sesión para volver a escanear. */
  async logout(ownerId: string) {
    const row = await this.requireRow(ownerId);
    try {
      await waha.logout(row.session_name).catch((e) => {
        if (!(e instanceof WahaError && (e.isNotFound || e.isSessionUnavailable))) throw e;
      });
    } catch (error) {
      throw toHttpException(error);
    }
    await this.markStopped(row);
    return this.toView(row, true);
  }

  /** Borra la sesión en WAHA y en BD. */
  async remove(ownerId: string) {
    const row = await this.repo.findOne({ where: { owner_id: ownerId } });
    if (!row) return;
    try {
      await waha.logout(row.session_name).catch(() => undefined);
      await waha.delete(row.session_name).catch((e) => {
        if (!(e instanceof WahaError && e.isNotFound)) throw e;
      });
    } catch (error) {
      throw toHttpException(error);
    }
    await this.repo.remove(row);
  }

  async requireConnected(ownerId: string): Promise<WhatsappSession> {
    const row = await this.repo.findOne({ where: { owner_id: ownerId } });
    if (!row || row.status !== 'WORKING') {
      throw new BadRequestException('WhatsApp no está conectado. Escanea el código QR en Configuración.');
    }
    return row;
  }

  findBySessionName(name: string) {
    return this.repo.findOne({ where: { session_name: name } });
  }

  /** Estado recibido por webhook. Se confirma en WAHA: los reintentos llegan desordenados. */
  async applyWebhookStatus(sessionName: string, status?: string, me?: { id?: string; pushName?: string } | null) {
    if (!status) return;
    const row = await this.findBySessionName(sessionName);
    if (!row) return;
    try {
      const live = await this.fetch(sessionName);
      if (live) return void (await this.apply(row, live));
    } catch {
      /* sin respuesta: se usa el estado del evento */
    }
    await this.apply(row, { name: sessionName, status, me });
  }

  async markUnavailable(sessionName: string, reason: string) {
    await this.repo.update(
      { session_name: sessionName },
      { status: 'STOPPED', connected_at: null, last_error: reason.slice(0, 500) },
    );
  }

  // ---------------------------------------------------------------------------

  private async ensureRow(ownerId: string): Promise<WhatsappSession> {
    const existing = await this.repo.findOne({ where: { owner_id: ownerId } });
    if (existing) return existing;
    try {
      return await this.repo.save(
        this.repo.create({ owner_id: ownerId, session_name: buildSessionName(ownerId), status: 'STOPPED' }),
      );
    } catch (error) {
      // Doble clic simultáneo: la otra petición ya creó el registro.
      const created = await this.repo.findOne({ where: { owner_id: ownerId } });
      if (created) return created;
      throw error;
    }
  }

  private async requireRow(ownerId: string) {
    const row = await this.repo.findOne({ where: { owner_id: ownerId } });
    if (!row) throw new BadRequestException('Primero conecta WhatsApp en Configuración.');
    return row;
  }

  private async fetch(name: string) {
    try {
      return await waha.getSession(name);
    } catch (error) {
      if (error instanceof WahaError && error.isNotFound) return null;
      throw error;
    }
  }

  private async markStopped(row: WhatsappSession) {
    row.status = 'STOPPED';
    row.phone_number = null;
    row.push_name = null;
    row.connected_at = null;
    row.last_status_at = new Date();
    await this.repo.save(row);
  }

  private async apply(row: WhatsappSession, live: { status: string; me?: { id?: string; pushName?: string } | null }) {
    const previous = row.status;
    row.status = live.status;
    row.last_status_at = new Date();
    if (live.status === 'WORKING') {
      row.phone_number = phoneFromWahaId(live.me?.id) ?? row.phone_number;
      row.push_name = live.me?.pushName ?? row.push_name;
      if (previous !== 'WORKING' || !row.connected_at) row.connected_at = new Date();
      row.last_error = null;
    } else {
      row.connected_at = null;
      if (live.status === 'SCAN_QR_CODE') {
        row.phone_number = null;
        row.push_name = null;
      }
      row.last_error = live.status === 'FAILED' ? 'La sesión de WhatsApp falló. Vuelve a conectar.' : null;
    }
    await this.repo.save(row);
  }

  /** Configuración de la sesión en WAHA: metadatos y webhook firmado con la llave propia de la sesión. */
  private sessionConfig(row: WhatsappSession) {
    const config: Record<string, unknown> = { metadata: { 'app.owner_id': row.owner_id } };
    const baseUrl = (process.env.WAHA_WEBHOOK_BASE_URL ?? '').trim().replace(/\/+$/, '');
    const secret = (process.env.WAHA_WEBHOOK_SECRET ?? '').trim();
    if (baseUrl && secret) {
      config.webhooks = [
        {
          url: `${baseUrl}${WAHA_WEBHOOK_PATH}`,
          events: WAHA_WEBHOOK_EVENTS,
          hmac: { key: deriveWebhookKey(secret, row.session_name) },
          retries: { policy: 'exponential', delaySeconds: 2, attempts: 6 },
        },
      ];
    } else {
      this.logger.warn('Sin WAHA_WEBHOOK_BASE_URL o WAHA_WEBHOOK_SECRET: no habrá estados ni confirmaciones.');
    }
    return config;
  }

  private emptyView() {
    return { configured: false, service_available: true, state: 'not_configured' as WhatsappConnectionState,
      status: null, phone_number: null, push_name: null, connected_at: null, last_status_at: null, last_error: null };
  }

  private toView(row: WhatsappSession, serviceAvailable: boolean) {
    return {
      configured: true,
      service_available: serviceAvailable,
      state: toConnectionState(row.status),
      status: row.status,
      phone_number: row.phone_number,
      push_name: row.push_name,
      connected_at: row.connected_at,
      last_status_at: row.last_status_at,
      last_error: row.last_error,
    };
  }
}
```

Mapeo de errores (`toHttpException`), para que el cliente nunca vea URLs ni llaves:

```typescript
export function toHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) return error;
  if (error instanceof WahaError) {
    if (error.status === 503) return new ServiceUnavailableException(error.message);
    if (error.isSessionUnavailable) {
      return new BadRequestException('WhatsApp no está conectado. Escanea el código QR en Configuración.');
    }
  }
  return new BadGatewayException('No se pudo comunicar con WhatsApp.');
}
```

### Paso 8. Servicio de mensajes (cola anti-bloqueo)

```typescript
// services/whatsapp-message.service.ts
const RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 2 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class WhatsappMessageService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WhatsappMessageService.name);
  /** Cola serial por sesión: un mensaje a la vez, con pausa aleatoria entre ellos. */
  private readonly chains = new Map<string, Promise<void>>();
  /** Archivo pendiente de cada mensaje. Solo vive en memoria (no se guarda en BD). */
  private readonly files = new Map<string, { url?: string; data?: string }>();

  constructor(
    @InjectRepository(WhatsappMessage) private readonly repo: Repository<WhatsappMessage>,
    private readonly sessions: WhatsappSessionService,
  ) {}

  onApplicationBootstrap() {
    setTimeout(() => this.recover().catch((e) => this.logger.warn(e?.message)), 5000);
  }

  sendText(ownerId: string, userId: string, dto: SendWhatsappTextDto) {
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('El mensaje no puede estar vacío.');
    return this.enqueue(ownerId, userId, { type: 'text', phone: dto.phone, body: text, ...refs(dto) });
  }

  sendFile(ownerId: string, userId: string, dto: SendWhatsappFileDto) {
    if (!isSafePublicHttpsUrl(dto.file_url)) {
      throw new BadRequestException('La URL del archivo debe ser https y pública.');
    }
    return this.enqueue(ownerId, userId, {
      type: 'file', phone: dto.phone, body: dto.caption?.trim() || null, file: { url: dto.file_url },
      file_name: dto.file_name ?? null, file_mimetype: dto.mimetype ?? null, ...refs(dto),
    });
  }

  /** Para tus otros módulos: manda un archivo generado (PDF/foto) sin URL pública. */
  sendBuffer(ownerId: string, userId: string, input: { phone: string; data: Buffer; file_name: string; mimetype: string; caption?: string }) {
    return this.enqueue(ownerId, userId, {
      type: 'file', phone: input.phone, body: input.caption ?? null, file: { data: input.data.toString('base64') },
      file_name: input.file_name, file_mimetype: input.mimetype,
    });
  }

  async list(ownerId: string, q: QueryWhatsappMessagesDto) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const qb = this.repo.createQueryBuilder('m').where('m.owner_id = :ownerId', { ownerId });
    if (q.status) qb.andWhere('m.status = :status', { status: q.status });
    if (q.reference_type) qb.andWhere('m.reference_type = :rt', { rt: q.reference_type });
    if (q.reference_id) qb.andWhere('m.reference_id = :ri', { ri: q.reference_id });
    qb.orderBy('m.created_at', 'DESC');
    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
  }

  async findOne(ownerId: string, id: string) {
    const row = await this.repo.findOne({ where: { id, owner_id: ownerId } });
    if (!row) throw new NotFoundException('Mensaje no encontrado.');
    return row;
  }

  /** Confirmación de entrega/lectura que llega por webhook. */
  async applyAck(sessionName: string, wahaMessageId: string, next: WhatsappMessageStatus) {
    const row = await this.repo.findOne({ where: { session_name: sessionName, waha_message_id: wahaMessageId } });
    if (!row || !shouldAdvanceStatus(row.status as WhatsappMessageStatus, next)) return;
    const now = new Date();
    row.status = next;
    if (next === 'delivered' || next === 'read') row.delivered_at = row.delivered_at ?? now;
    if (next === 'read') row.read_at = row.read_at ?? now;
    if (next === 'failed') row.error_message = 'WhatsApp no pudo entregar el mensaje.';
    await this.repo.save(row);
  }

  // ---------------------------------------------------------------------------

  private async enqueue(ownerId: string, userId: string, input: EnqueueInput) {
    const session = await this.sessions.requireConnected(ownerId);
    const phone = normalizePhone(input.phone, process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '52');
    if (!phone) throw new BadRequestException('El número de teléfono no es válido.');
    await this.assertDailyLimit(ownerId);

    const saved = await this.repo.save(
      this.repo.create({
        owner_id: ownerId, session_name: session.session_name, to_phone: phone, type: input.type,
        body: input.body ?? null, file_name: input.file_name ?? null, file_mimetype: input.file_mimetype ?? null,
        status: 'queued', reference_type: input.reference_type ?? null, reference_id: input.reference_id ?? null,
        created_by: userId,
      }),
    );
    if (input.file) this.files.set(saved.id, input.file);
    this.schedule(session.session_name, saved.id);
    return saved; // el controlador responde 202
  }

  private async assertDailyLimit(ownerId: string) {
    const limit = Number(process.env.WHATSAPP_DAILY_LIMIT) || 1000;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sentToday = await this.repo
      .createQueryBuilder('m')
      .where('m.owner_id = :ownerId', { ownerId })
      .andWhere('m.created_at >= :since', { since: startOfDay })
      .andWhere("m.status <> 'failed'")
      .getCount();
    if (sentToday >= limit) {
      throw new HttpException(`Alcanzaste el límite diario de ${limit} mensajes de WhatsApp.`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private schedule(sessionName: string, messageId: string) {
    const previous = this.chains.get(sessionName) ?? Promise.resolve();
    const next = previous.then(async () => {
      try {
        await this.process(messageId);
      } catch (e) {
        this.logger.error(`Fallo inesperado enviando ${messageId}: ${(e as Error)?.message}`);
      }
      const min = Number(process.env.WHATSAPP_MIN_DELAY_MS) || 2000;
      const max = Number(process.env.WHATSAPP_MAX_DELAY_MS) || 5000;
      await sleep(randomDelay(min, max));
    });
    this.chains.set(sessionName, next);
    void next.finally(() => {
      if (this.chains.get(sessionName) === next) this.chains.delete(sessionName);
    });
  }

  private async process(messageId: string) {
    // Reclamo atómico: con varias instancias del backend, solo una envía el mensaje.
    const claim = await this.repo.update({ id: messageId, status: 'queued' }, { status: 'sending' });
    if (!claim.affected) return;
    const message = await this.repo.findOne({ where: { id: messageId } });
    if (!message) return;

    const session = await this.sessions.findBySessionName(message.session_name);
    if (!session || session.status !== 'WORKING') {
      return this.fail(message, 'WhatsApp no está conectado. Escanea el código QR en Configuración.');
    }

    try {
      // 1) ¿El número tiene WhatsApp?
      const check = await waha.checkExists(message.session_name, message.to_phone);
      if (!check?.numberExists) {
        return this.fail(message, 'El número no tiene WhatsApp. Si es de otro país, escríbelo con su código (por ejemplo +1).');
      }
      const chatId = check.chatId || `${message.to_phone}@c.us`;

      // 2) Enviar
      let result: unknown;
      if (message.type === 'file') {
        const source = this.files.get(message.id);
        if (!source) return this.fail(message, 'No se pudo recuperar el archivo. Vuelve a enviarlo.');
        const file = { ...source, filename: message.file_name ?? undefined, mimetype: message.file_mimetype ?? undefined };
        const asImage = (message.file_mimetype ?? '').startsWith('image/');
        result = asImage
          ? await waha.sendImage(message.session_name, chatId, file, message.body ?? undefined)
          : await waha.sendFile(message.session_name, chatId, file, message.body ?? undefined);
      } else {
        await this.simulateTyping(message.session_name, chatId, message.body?.length ?? 0);
        result = await waha.sendText(message.session_name, chatId, message.body ?? '');
      }

      await this.repo.update(
        { id: message.id, status: 'sending' },
        { status: 'sent', chat_id: chatId, waha_message_id: extractWahaMessageId(result), sent_at: new Date(), error_message: null },
      );
    } catch (error) {
      if (error instanceof WahaError && (error.isNotFound || error.isSessionUnavailable)) {
        await this.sessions.markUnavailable(message.session_name, 'WhatsApp no está conectado.');
      }
      await this.fail(message, 'No se pudo enviar el mensaje por WhatsApp.');
    } finally {
      this.files.delete(message.id);
    }
  }

  /** Imita escritura humana. Es opcional: cualquier error se ignora. */
  private async simulateTyping(session: string, chatId: string, length: number) {
    try {
      await waha.startTyping(session, chatId);
      await sleep(Math.min(4000, 800 + length * 25));
      await waha.stopTyping(session, chatId);
    } catch {
      /* sin efecto sobre el envío */
    }
  }

  private fail(message: WhatsappMessage, reason: string) {
    return this.repo.update({ id: message.id }, { status: 'failed', error_message: reason.slice(0, 500) });
  }

  /** Tras un reinicio del backend: cierra lo que quedó a medias y reencola lo pendiente. */
  private async recover() {
    await this.repo
      .createQueryBuilder()
      .update(WhatsappMessage)
      .set({ status: 'failed', error_message: 'El envío se interrumpió. Verifica en WhatsApp antes de reintentar.' })
      .where("status = 'sending'")
      .andWhere('updated_at < :before', { before: new Date(Date.now() - STALE_SENDING_MS) })
      .execute();

    const pending = await this.repo.find({
      where: { status: 'queued', created_at: MoreThanOrEqual(new Date(Date.now() - RECOVERY_WINDOW_MS)) },
      order: { created_at: 'ASC' },
    });
    for (const m of pending) {
      if (m.type === 'file') {
        await this.fail(m, 'El envío se interrumpió. Vuelve a enviar el archivo.'); // el archivo vivía en memoria
        continue;
      }
      this.schedule(m.session_name, m.id);
    }
  }
}

const refs = (dto: { reference_type?: string; reference_id?: string }) => ({
  reference_type: dto.reference_type ?? null,
  reference_id: dto.reference_id ?? null,
});
```

`EnqueueInput` = `{ type: 'text' | 'file'; phone: string; body?: string | null; file?: { url?: string; data?: string }; file_name?: string | null; file_mimetype?: string | null; reference_type?: string | null; reference_id?: string | null }`.

### Paso 9. Webhook (WAHA → tu backend)

```typescript
// services/whatsapp-webhook.service.ts
@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly sessions: WhatsappSessionService,
    private readonly messages: WhatsappMessageService,
  ) {}

  async handle(body: any, rawBody: Buffer | string, hmac?: string, algorithm?: string) {
    const sessionName = typeof body?.session === 'string' ? body.session : '';
    const secret = (process.env.WAHA_WEBHOOK_SECRET ?? '').trim();
    if (!sessionName || !secret) throw new UnauthorizedException('Firma inválida.');

    // La llave se deriva del nombre de sesión: una firma válida de una sesión no sirve para otra.
    const key = deriveWebhookKey(secret, sessionName);
    if (!verifyHmac(rawBody, key, hmac, algorithm)) {
      this.logger.warn(`Webhook con firma inválida para la sesión ${sessionName}`);
      throw new UnauthorizedException('Firma inválida.');
    }

    switch (body.event) {
      case 'session.status':
        await this.sessions.applyWebhookStatus(sessionName, body.payload?.status, body.me);
        break;
      case 'message.ack': {
        const p = body.payload ?? {};
        if (typeof p.id !== 'string' || p.fromMe === false) break;
        const next = ackToMessageStatus(p.ack, p.ackName);
        if (next) await this.messages.applyAck(sessionName, p.id, next);
        break;
      }
    }
  }
}
```

```typescript
// whatsapp-webhook.controller.ts — ruta pública: NO lleva tu guard de autenticación
@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly service: WhatsappWebhookService) {}

  @Post('waha')
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-hmac') hmac?: string,
    @Headers('x-webhook-hmac-algorithm') algorithm?: string,
  ) {
    await this.service.handle(body, req.rawBody ?? JSON.stringify(body), hmac, algorithm);
    return { ok: true };
  }
}
```

La ruta del webhook debe **excluirse** de tu middleware/guard global de autenticación, de rate limiting agresivo y de CORS estricto: WAHA no manda tu JWT. Su seguridad es la firma HMAC.

### Paso 10. Controlador (lo que consume tu frontend)

```typescript
// whatsapp.controller.ts
@Controller('whatsapp')
@UseGuards(MiAuthGuard) // tu guard de autenticación
export class WhatsappController {
  constructor(private readonly sessions: WhatsappSessionService, private readonly messages: WhatsappMessageService) {}

  // owner_id y user_id SIEMPRE salen del usuario autenticado
  private owner(req: any) { return req.user.ownerId as string; }
  private user(req: any) { return req.user.id as string; }

  @Get('session')                    status(@Req() req) { return this.sessions.getStatus(this.owner(req)); }
  @Post('session/connect') @HttpCode(200)   connect(@Req() req) { return this.sessions.connect(this.owner(req)); }
  @Get('session/qr')                 qr(@Req() req) { return this.sessions.qr(this.owner(req)); }
  @Post('session/pairing-code') @HttpCode(200) pairing(@Req() req, @Body() dto: WhatsappPairingCodeDto) { return this.sessions.pairingCode(this.owner(req), dto.phone); }
  @Post('session/restart') @HttpCode(200)   restart(@Req() req) { return this.sessions.restart(this.owner(req)); }
  @Post('session/logout') @HttpCode(200)    logout(@Req() req) { return this.sessions.logout(this.owner(req)); }
  @Delete('session')                 async remove(@Req() req) { await this.sessions.remove(this.owner(req)); return { ok: true }; }

  @Post('messages/text') @HttpCode(202)  sendText(@Req() req, @Body() dto: SendWhatsappTextDto) { return this.messages.sendText(this.owner(req), this.user(req), dto); }
  @Post('messages/file') @HttpCode(202)  sendFile(@Req() req, @Body() dto: SendWhatsappFileDto) { return this.messages.sendFile(this.owner(req), this.user(req), dto); }
  @Get('messages')                   list(@Req() req, @Query() q: QueryWhatsappMessagesDto) { return this.messages.list(this.owner(req), q); }
  @Get('messages/:id')               one(@Req() req, @Param('id') id: string) { return this.messages.findOne(this.owner(req), id); }
}
```

Agrega tus permisos por acción (leer / enviar / conectar / eliminar) con el mecanismo que use tu proyecto. Recomendado: solo administradores pueden conectar, reiniciar, desvincular y eliminar.

### Paso 11. Módulo

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([WhatsappSession, WhatsappMessage]) /*, tu AuthModule */],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [WhatsappSessionService, WhatsappMessageService, WhatsappWebhookService],
  exports: [WhatsappMessageService, WhatsappSessionService], // para enviar desde otros módulos
})
export class WhatsappModule {}
```

Registrar `WhatsappModule` en `AppModule` y las dos entidades en TypeORM.

### Paso 12. Enviar desde otros módulos del backend

```typescript
@Injectable()
export class OrdersService {
  constructor(private readonly whatsapp: WhatsappMessageService) {}

  async notifyShipped(order: Order, userId: string) {
    await this.whatsapp.sendText(order.owner_id, userId, {
      phone: order.customer_phone,
      text: `Hola ${order.customer_name}, tu pedido #${order.number} va en camino.`,
      reference_type: 'order',
      reference_id: order.id,
    });
  }

  async sendInvoicePdf(order: Order, pdf: Buffer, userId: string) {
    await this.whatsapp.sendBuffer(order.owner_id, userId, {
      phone: order.customer_phone,
      data: pdf,
      file_name: `Factura-${order.number}.pdf`,
      mimetype: 'application/pdf',
      caption: 'Tu factura',
    });
  }
}
```

Envuelve estas llamadas en `try/catch` si WhatsApp no debe bloquear el flujo principal (por ejemplo, un cobro): si el cliente no tiene WhatsApp conectado, `sendText` lanza 400.

---

## 5. Frontend (Angular) — paso a paso

El front **solo** llama a tu backend (`/whatsapp/...`). No conoce WAHA, ni su URL, ni su llave.

### Paso 1. Modelo

```typescript
// whatsapp.model.ts
export type WhatsappConnectionState = 'not_configured' | 'disconnected' | 'starting' | 'waiting_qr' | 'connected' | 'failed';
export type WhatsappMessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsappSession {
  configured: boolean; service_available: boolean; state: WhatsappConnectionState; status: string | null;
  phone_number: string | null; push_name: string | null; connected_at: string | null;
  last_status_at: string | null; last_error: string | null;
}
export interface WhatsappQrResponse extends WhatsappSession { qr_data_url: string | null; }
export interface WhatsappMessage {
  id: string; to_phone: string; type: 'text' | 'file'; body: string | null; file_name: string | null;
  status: WhatsappMessageStatus; error_message: string | null; created_at: string;
}
export interface WhatsappMessagesPage { data: WhatsappMessage[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }
```

### Paso 2. Servicio HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly api = `${environment.api}/whatsapp`;
  constructor(private http: HttpClient) {}

  status() { return this.http.get<WhatsappSession>(`${this.api}/session`); }
  connect() { return this.http.post<WhatsappSession>(`${this.api}/session/connect`, {}); }
  qr() { return this.http.get<WhatsappQrResponse>(`${this.api}/session/qr`); }
  pairingCode(phone: string) { return this.http.post<{ code: string }>(`${this.api}/session/pairing-code`, { phone }); }
  restart() { return this.http.post<WhatsappSession>(`${this.api}/session/restart`, {}); }
  logout() { return this.http.post<WhatsappSession>(`${this.api}/session/logout`, {}); }
  remove() { return this.http.delete<{ ok: boolean }>(`${this.api}/session`); }
  sendText(payload: { phone: string; text: string; reference_type?: string; reference_id?: string }) {
    return this.http.post<WhatsappMessage>(`${this.api}/messages/text`, payload);
  }
  messages(page = 1, limit = 10) {
    return this.http.get<WhatsappMessagesPage>(`${this.api}/messages`, { params: { page, limit } });
  }
}
```

### Paso 3. Pantalla de conexión (lógica clave)

La pantalla completa está en el frontend de Pollux: `settings/pages/whatsapp-settings/whatsapp-settings.component.{ts,html}`. Cópiala y cambia el servicio. La lógica que no debes perder:

```typescript
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ERRORS = 5;

session = signal<WhatsappSession | null>(null);
qrDataUrl = signal<string | null>(null);
private pollTimer: ReturnType<typeof setInterval> | null = null;
private pollErrors = 0;

ngOnInit() { this.loadStatus(); }
ngOnDestroy() { this.stopPolling(); } // IMPORTANTE: si no, el sondeo sigue al salir de la pantalla

connect() {
  this.whatsapp.connect().subscribe((s) => { this.applySession(s); this.refreshQr(); });
}

/** Cambia de estado y enciende/apaga el sondeo del QR. */
private applySession(session: WhatsappSession) {
  this.session.set(session);
  if (session.state !== 'waiting_qr') this.qrDataUrl.set(null);
  if (session.state === 'starting' || session.state === 'waiting_qr') this.startPolling();
  else this.stopPolling();
}

private startPolling() {
  if (this.pollTimer) return;
  this.pollErrors = 0;
  this.pollTimer = setInterval(() => this.refreshQr(), POLL_INTERVAL_MS);
}
private stopPolling() {
  if (this.pollTimer) clearInterval(this.pollTimer);
  this.pollTimer = null;
}

private refreshQr() {
  this.whatsapp.qr().subscribe({
    next: ({ qr_data_url, ...session }) => {
      this.pollErrors = 0;
      this.applySession(session);
      this.qrDataUrl.set(session.state === 'waiting_qr' ? qr_data_url : null);
    },
    error: () => {
      if (++this.pollErrors >= MAX_POLL_ERRORS) this.stopPolling(); // y avisar: «Pulsa Generar nuevo QR»
    },
  });
}
```

Plantilla mínima del QR:

```html
<ng-container *ngIf="state === 'waiting_qr' || state === 'starting'">
  <ol>
    <li>Abre WhatsApp en tu teléfono.</li>
    <li>Ve a <strong>Ajustes → Dispositivos vinculados</strong>.</li>
    <li>Toca <strong>Vincular un dispositivo</strong> y escanea este código.</li>
  </ol>
  <img *ngIf="qrDataUrl() as qr" [src]="qr" alt="Código QR de WhatsApp" width="256" height="256" />
  <p *ngIf="!qrDataUrl()">Generando código QR…</p>
  <p>El código se actualiza solo. Mantén esta pantalla abierta hasta que conecte.</p>
</ng-container>
```

Detalles de UX que ya resolvió Pollux:

- Estados en español: `not_configured` «Sin conectar», `waiting_qr` «Esperando que escanees el QR», `connected` «Conectado», `failed` «Falló la conexión».
- Al pegar un teléfono, limpiarlo (quitar espacios, guiones, paréntesis; conservar un `+` inicial).
- Texto de ayuda: «10 dígitos = México; para otro país escribe `+código`».
- Mostrar `last_error` solo si `state !== 'connected'`.
- Confirmar con `confirm(...)` antes de desvincular o eliminar.
- Alternativa sin cámara: pedir el teléfono del WhatsApp a vincular → `pairingCode` → mostrar el código de 8 caracteres.

### Paso 4. Botón de envío en tus pantallas

```typescript
sendWhatsapp(order: Order) {
  this.whatsapp.sendText({
    phone: order.customer_phone,
    text: `Hola, tu pedido #${order.number} va en camino.`,
    reference_type: 'order',
    reference_id: order.id,
  }).subscribe({
    next: () => this.toast('En cola', 'El mensaje se enviará en unos segundos'), // responde 202: aún no salió
    error: (err) => this.toast('Error', err?.error?.message ?? 'No se pudo enviar el mensaje'),
  });
}
```

El envío es asíncrono: el estado real (`sent`, `delivered`, `read`, `failed`) se ve consultando `messages` o `messages/:id`.

---

## 6. Webhook: cómo se firma y se valida

1. Al crear la sesión mandas a WAHA `config.webhooks[0].hmac.key = HMAC-SHA256(WAHA_WEBHOOK_SECRET, session_name)`.
2. Cada vez que ocurre un evento, WAHA hace `POST` a tu URL con el cuerpo JSON y los headers `X-Webhook-Hmac` (firma) y `X-Webhook-Hmac-Algorithm` (por defecto `sha512`).
3. Tu backend recalcula `HMAC-<algoritmo>(llave de esa sesión, cuerpo crudo)` y compara en tiempo constante.
4. Coincide → procesas. No coincide → **401**, sin procesar nada.

Por qué es seguro:

- Nadie puede inventar eventos sin la llave de esa sesión.
- La llave no se guarda en BD: se deriva del secreto maestro y del nombre de sesión.
- Una firma válida de la sesión A no sirve para la B.
- El cliente se identifica por el **nombre de sesión**, nunca por datos del cuerpo.

Si cambias `WAHA_WEBHOOK_SECRET`, las sesiones existentes siguen firmando con la llave vieja: vuelve a ejecutar `connect` (sesión `STOPPED`/`FAILED`) o actualiza su config para regenerar el webhook.

Eventos que se usan:

| Evento | Para qué | Importante |
|---|---|---|
| `session.status` | Saber si conectó, se desconectó o falló | Confirmar el estado real con `GET /api/sessions/{name}`; los reintentos llegan desordenados |
| `message.ack` | Pasar el mensaje a `delivered` / `read` | Ignorar si `payload.fromMe === false`; nunca retroceder estados |

---

## 7. Prueba de punta a punta

1. **WAHA vivo y llave correcta:** los `curl` de la sección 2.4.
2. **Backend arriba:** `GET /api/whatsapp/session` → `state: "not_configured"`.
3. **Conectar:** desde el front pulsa «Generar nuevo QR» → debe aparecer el QR en 2–5 s.
4. **Escanear** con un teléfono de prueba → estado «Conectado» y número visible.
5. **Enviar** un texto a otro número → `202` con `status: "queued"` → en segundos pasa a `sent`.
6. **Confirmaciones:** abre el chat en el otro teléfono → `delivered`; léelo → `read` (requiere webhook alcanzable).
7. **Fallos esperados:**
   - Número sin WhatsApp → `failed` «El número no tiene WhatsApp…».
   - Desvincular desde el teléfono → `failed`/`disconnected` por webhook.
   - Reiniciar el backend con mensajes `queued` → se reencolan.
   - Reiniciar WAHA → la sesión vuelve sola (`WHATSAPP_RESTART_ALL_SESSIONS=True`).
8. **Aislamiento:** con dos clientes distintos, cada uno ve **solo** su estado, QR e historial.

---

## 8. Puesta en producción (checklist)

- [ ] WAHA 2026.6.1+ con motor `NOWEB`.
- [ ] Volumen persistente en `/app/.sessions`.
- [ ] `WAHA_API_KEY` larga y aleatoria; dashboard y Swagger con contraseñas distintas.
- [ ] WAHA en red privada o, si es público, solo HTTPS.
- [ ] `WAHA_API_KEY` y `WAHA_WEBHOOK_SECRET` solo en variables del backend; distintas entre sí.
- [ ] `rawBody: true` en el backend.
- [ ] Webhook alcanzable desde WAHA; ruta excluida del guard de autenticación.
- [ ] `owner_id` siempre desde el usuario autenticado.
- [ ] Permisos: solo administradores conectan/desvinculan/eliminan.
- [ ] Límite diario y pausa 2–5 s activos.
- [ ] Mensajes de error al usuario sin URLs, llaves ni respuestas crudas de WAHA.
- [ ] Respaldo del volumen de sesiones (opcional pero recomendable).
- [ ] Monitoreo: alerta si `GET /api/server/version` falla o si muchas sesiones pasan a `FAILED`.

## 9. Buenas prácticas para no perder números

- Enviar solo a personas que esperan el mensaje (clientes, pedidos, recordatorios). Nada de envíos masivos ni de spam: WhatsApp bloquea números por reportes.
- Mantener la cola serial y las pausas aleatorias. No «saltarse» la cola para enviar más rápido.
- Verificar que el número tenga WhatsApp antes de enviar (ya incluido).
- Variar el texto (nombre, folio, fecha) en lugar de mandar el mismo mensaje idéntico a cientos de personas.
- Tener un teléfono físico dedicado y con WhatsApp abierto de vez en cuando; una sesión vinculada que no se usa puede cerrarse.
- Aceptar que WhatsApp no es un canal garantizado: guardar siempre el historial y ofrecer un canal alterno (correo/SMS) para avisos críticos.

## 10. Errores frecuentes con WAHA

| Síntoma | Causa | Solución |
|---|---|---|
| 401 de WAHA en todo | `X-Api-Key` ausente o distinta | Revisar `WAHA_API_KEY` en ambos lados y reiniciar |
| 422/409 al enviar | Sesión no iniciada o sin vincular | Reconectar; el backend la marca `STOPPED` |
| 404 al consultar sesión | La sesión no existe (WAHA reinstalado sin volumen) | `connect` la recrea; el cliente vuelve a escanear |
| QR siempre `null` | La sesión aún no está en `SCAN_QR_CODE` | Esperar unos segundos; revisar el estado |
| QR no se renueva | Se detuvo el sondeo del front | «Generar nuevo QR» |
| Webhook responde 401 | `rawBody` apagado, secreto distinto o nombre de sesión distinto | Activar `rawBody`; mismo `WAHA_WEBHOOK_SECRET`; regenerar config de la sesión |
| Nunca llegan `delivered`/`read` | WAHA no alcanza tu backend | URL pública/túnel; revisar logs de WAHA |
| Mensajes `queued` que no salen | Sesión caída o proceso reiniciado | Ver estado de la sesión; la recuperación al arrancar los reencola |
| Tras redeploy de WAHA todos piden QR | Sin volumen persistente | Montar `/app/.sessions` |
| Número bloqueado por WhatsApp | Envíos masivos / sin pausas / spam | Aplicar las buenas prácticas de la sección 9 |
