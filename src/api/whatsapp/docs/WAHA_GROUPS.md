# Grupos de WhatsApp con WAHA (para otro proyecto)

Cómo **listar los grupos** del número vinculado y usar ese id para escribirles. Habla **directo con WAHA**. No uses la API de Pollux (`GET /api/tenant/whatsapp/groups`): esa ruta es de este ERP.

El navegador **nunca** llama a WAHA. El flujo es `Front → tu backend → WAHA`. `WAHA_BASE_URL` y `WAHA_API_KEY` viven solo en el servidor.

## Historial

- 2026-10-26: Primera versión. Lista con `GET /api/{session}/groups` y, si viene vacío, con `GET /api/{session}/chats`.

## Qué necesitas antes

1. Una sesión WAHA en estado `WORKING` (el QR ya se escaneó). Con `STOPPED`, `STARTING`, `SCAN_QR_CODE` o `FAILED` no hay grupos.
2. El **nombre de la sesión** (`session`), el mismo con el que creaste la sesión. En Pollux es `erp_<tenantId>`. En el otro proyecto usa tu propio prefijo (`miapp_<id>`). No leas ni borres sesiones que no empiecen con tu prefijo.
3. Header en cada petición: `X-Api-Key: <WAHA_API_KEY>` y `Accept: application/json`.
4. El número vinculado **ya es miembro** del grupo. WAHA no busca grupos públicos: solo devuelve los chats de ese WhatsApp.

Comprueba la sesión:

```http
GET {WAHA_BASE_URL}/api/sessions/{session}
X-Api-Key: <WAHA_API_KEY>
```

Sigue solo si `status` es `WORKING`. `404` = la sesión no existe. `422` o `409` = no está iniciada o no está vinculada.

## 1. Pedir los grupos

```http
GET {WAHA_BASE_URL}/api/{session}/groups?exclude=participants
X-Api-Key: <WAHA_API_KEY>
```

`{session}` va codificado (`encodeURIComponent`). `exclude=participants` es obligatorio en la práctica: con la lista de miembros la respuesta se hace enorme y se tarda.

Ejemplo:

```bash
curl -sS \
  -H "X-Api-Key: $WAHA_API_KEY" \
  -H "Accept: application/json" \
  "$WAHA_BASE_URL/api/miapp_42/groups?exclude=participants"
```

## 2. La respuesta no siempre es un array

Según el motor (WEBJS o NOWEB) WAHA manda una de estas formas. Hay que aceptar las tres.

Array (WEBJS):

```json
[
  {
    "id": "120363025246125738@g.us",
    "name": "Cobranza",
    "description": "Pagos"
  }
]
```

El `id` a veces es un objeto, y el nombre viene en `subject` en lugar de `name`:

```json
{
  "id": {
    "_serialized": "120363111111111111@g.us",
    "user": "120363111111111111",
    "server": "g.us"
  },
  "subject": "Operación"
}
```

Envuelto en un objeto: `{ "data": [ ... ] }`, `{ "groups": [ ... ] }` o `{ "chats": [ ... ] }`.

Mapa de NOWEB (la clave es el id del grupo):

```json
{
  "120363025246125738@g.us": {
    "id": "120363025246125738@g.us",
    "subject": "Cobranza",
    "desc": "Pagos"
  },
  "120363111111111111@g.us": {
    "subject": "Operación"
  }
}
```

Un chat de persona (`525512345678@c.us`) **no** es un grupo. Descártalo.

## 3. Si `/groups` viene vacío, lee `/chats`

Con motor `NOWEB`, `GET /groups` a veces responde `200` con `[]` o con un objeto que no se puede leer, aunque el WhatsApp sí tiene grupos. Si el parseo da **cero** grupos, o si `/groups` falla, pide los chats y quédate solo con los id que terminan en `@g.us`.

```http
GET {WAHA_BASE_URL}/api/{session}/chats?limit=200&offset=0
X-Api-Key: <WAHA_API_KEY>
```

Página de 200. Sube `offset` de 200 en 200 (`0`, `200`, `400`…). Para cuando la página trae menos de 200 o viene vacía. Tope: 10 páginas (2000 chats). Si la respuesta no es un array, no pagines: parsea esa página y termina.

`/chats` mezcla personas y grupos. El filtro `@g.us` es el que separa los grupos.

## 4. Cómo queda cada grupo

Devuelve a tu frontend solo esto, ordenado por nombre:

```json
{
  "data": [
    {
      "id": "120363025246125738@g.us",
      "name": "Cobranza",
      "description": "Pagos"
    }
  ]
}
```

Reglas de normalización (las mismas que usa Pollux):

| Campo | De dónde sale |
|---|---|
| `id` | Tiene que terminar en `@g.us`. Si WAHA manda el id como objeto, usa `_serialized`, o `user` cuando `server` es `g.us`. |
| `name` | El primer texto no vacío de `name`, `subject` o `Name`. Si no hay, usa el propio `id`. |
| `description` | `description` o `desc`. Si no hay, `null`. |

Del id:

- Acepta `120363025246125738@g.us` o, si tu usuario pega solo el número, `120363025246125738` (tú le agregas `@g.us`).
- La parte de antes de `@` mide entre 8 y 40 caracteres y solo lleva letras, números, `.`, `_` y `-`.
- `@c.us` (persona), `@s.whatsapp.net` y cualquier otro servidor se rechazan.
- No conviertas un teléfono suelto en grupo. Un id de WAHA solo cuenta como grupo si **ya trae** `@`.
- Quita duplicados por `id`.

El id que guardas y el que mandas después es siempre `120363025246125738@g.us`.

## 5. Escribir al grupo

Ese `id` es el `chatId`. No llames a `check-exists`: eso es solo para teléfonos.

```http
POST {WAHA_BASE_URL}/api/sendText
X-Api-Key: <WAHA_API_KEY>
Content-Type: application/json

{
  "session": "miapp_42",
  "chatId": "120363025246125738@g.us",
  "text": "Hola grupo"
}
```

Archivo o foto: el mismo `chatId` en `POST /api/sendFile` o `POST /api/sendImage`.

Si el usuario manda teléfono y grupo a la vez, usa el grupo.

## 6. Errores que vas a ver

| HTTP de WAHA | Qué pasó | Qué hacer |
|---|---|---|
| 401 | API key incorrecta | Revisar `WAHA_API_KEY`. No se lo muestres al usuario. |
| 404 | La sesión no existe | Volver a crear la sesión y escanear el QR. |
| 422 / 409 | Sesión apagada o sin vincular | Pedir que conecte el WhatsApp. |
| 200 y lista vacía | NOWEB no llenó `/groups`, o el número no está en ningún grupo | Probar `/chats`. Si sigue vacía, el WhatsApp no tiene grupos. |
| Sin respuesta | WAHA caído o timeout | Reintentar. Timeout razonable: 30 s. `/groups` con participantes puede tardar más; por eso se excluyen. |

No regreses al cliente el cuerpo crudo de WAHA: puede traer la URL interna. Traduce a un mensaje tuyo («No se pudieron cargar los grupos. Intenta de nuevo.»).

## 7. Código de referencia (TypeScript, Node 18+)

Pégalo en el backend del otro proyecto. Sustituye `wahaGet` por tu cliente HTTP (el de [EXTERNAL_INTEGRATION_GUIDE.md](./EXTERNAL_INTEGRATION_GUIDE.md), sección 3.6).

```typescript
export interface WhatsappGroup {
  id: string;
  name: string;
  description: string | null;
}

const GROUP_ID = /@g\.us$/i;

export function normalizeGroupId(raw: string): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const withSuffix = value.includes('@') ? value : `${value}@g.us`;
  const at = withSuffix.lastIndexOf('@');
  const user = withSuffix.slice(0, at);
  const server = withSuffix.slice(at + 1);
  if (!user || user.length < 8 || user.length > 40) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(user)) return null;
  if (server.toLowerCase() !== 'g.us') return null;
  return `${user}@g.us`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function idIfGroup(value: string): string | null {
  return value.includes('@') ? normalizeGroupId(value) : null;
}

function extractGroupId(row: unknown): string | null {
  if (typeof row === 'string') return idIfGroup(row);
  const rec = asRecord(row);
  if (!rec) return null;
  for (const key of ['id', 'jid', 'JID', 'gid', 'chatId', 'chat_id']) {
    const value = rec[key];
    if (typeof value === 'string') {
      const id = idIfGroup(value);
      if (id) return id;
    }
    const nested = asRecord(value);
    if (typeof nested?._serialized === 'string') {
      const id = idIfGroup(nested._serialized);
      if (id) return id;
    }
    if (typeof nested?.user === 'string' && String(nested.server ?? '') === 'g.us') {
      const id = normalizeGroupId(String(nested.user));
      if (id) return id;
    }
  }
  return null;
}

function looksLikeGroupMap(rec: Record<string, unknown>): boolean {
  return Object.keys(rec).some(
    (key) => GROUP_ID.test(key) || !!extractGroupId(rec[key]),
  );
}

function rowsFrom(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const rec = asRecord(payload);
  if (!rec) return [];
  for (const key of ['data', 'groups', 'chats']) {
    const nested = rec[key];
    if (Array.isArray(nested)) return nested;
    const nestedRec = asRecord(nested);
    if (nestedRec && looksLikeGroupMap(nestedRec)) {
      return Object.entries(nestedRec).map(([id, value]) => {
        const row = asRecord(value);
        return row ? (row.id ? row : { ...row, id }) : { id };
      });
    }
  }
  if (looksLikeGroupMap(rec)) {
    return Object.entries(rec).map(([id, value]) => {
      const row = asRecord(value);
      return row ? (row.id ? row : { ...row, id }) : { id };
    });
  }
  return extractGroupId(rec) ? [rec] : [];
}

/** Acepta array, `{ data }` y el mapa de NOWEB. Ignora chats `@c.us`. */
export function mapWahaGroups(payload: unknown): WhatsappGroup[] {
  const seen = new Set<string>();
  const groups: WhatsappGroup[] = [];
  for (const row of rowsFrom(payload)) {
    const id = extractGroupId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const rec = asRecord(row);
    const text = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : null;
    groups.push({
      id,
      name: text(rec?.name) || text(rec?.subject) || text(rec?.Name) || id,
      description: text(rec?.description) || text(rec?.desc),
    });
  }
  groups.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return groups;
}

/**
 * `wahaGet` hace GET con X-Api-Key y devuelve el JSON.
 * Sesión ya en WORKING.
 */
export async function listGroups(
  wahaGet: (path: string) => Promise<unknown>,
  session: string,
): Promise<WhatsappGroup[]> {
  const name = encodeURIComponent(session);
  try {
    const raw = await wahaGet(`/api/${name}/groups?exclude=participants`);
    const groups = mapWahaGroups(raw);
    if (groups.length) return groups;
  } catch {
    // /groups falló: se intenta /chats
  }

  const pageSize = 200;
  const rows: unknown[] = [];
  for (let page = 0; page < 10; page += 1) {
    const raw = await wahaGet(
      `/api/${name}/chats?limit=${pageSize}&offset=${page * pageSize}`,
    );
    if (!Array.isArray(raw)) return mapWahaGroups(raw);
    if (!raw.length) break;
    rows.push(...raw);
    if (raw.length < pageSize) break;
  }
  return mapWahaGroups(rows);
}
```

## 8. Checklist

- [ ] La llamada sale del backend, con `X-Api-Key`. El front solo ve `{ data: [{ id, name, description }] }`.
- [ ] La sesión está en `WORKING` y el nombre es el de **tu** prefijo.
- [ ] `GET /api/{session}/groups?exclude=participants`.
- [ ] Si eso da 0 grupos, `GET /api/{session}/chats` paginado y filtro `@g.us`.
- [ ] Se acepta array, `{ data | groups | chats }` y el mapa `{ "…@g.us": {…} }` de NOWEB.
- [ ] Se ignoran los `@c.us`.
- [ ] Para enviar, `chatId` = ese `id`. Sin `check-exists`.
