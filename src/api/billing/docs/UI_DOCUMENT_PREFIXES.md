# UI — Prefijos de razón social, sucursal y almacén

Guía para Pollux. Los prefijos arman el número de lote al **recibir una OC** (y al transferir inventario al almacén destino):

```
{razon}-{sucursal}-{almacen}-{numero}
MZN-SBA-BDGA-00011
```

| Segmento | Dónde se captura | Campos visibles | Ejemplo |
|----------|------------------|-----------------|---------|
| Razón social | Modal razón social → Configuración | Prefijo | `MZN` |
| Sucursal | Modal sucursal | **Nombre** + **Prefijo** | `Sucursal Buenos Aires` / `SBA` |
| Almacén | Modal almacén | **Nombre** + **Prefijo** | `Enrejado` / `VD` |
| Número | Lo genera el backend (5 dígitos) | — | `00011` |

**No concatenar en el front.** El `batch_number` llega ya armado al recibir.

---

## Cambio de campos (hacer esto)

### Sucursal — dejar de usar “Código”

El label **Código** confunde: ese valor es el **nombre** de la sucursal (`Sucursal Buenos Aires`), no un código corto.

| Antes (quitar) | Ahora (UI) | API |
|----------------|------------|-----|
| Código | **Nombre** * | `name` |
| Prefijo | **Prefijo** | `prefix` |

- Label: `Nombre *`
- Placeholder nombre: `Ej. Sucursal Buenos Aires`
- Placeholder prefijo: `Ej. SBA`
- Hint prefijo: *Segmento del lote al recibir mercancía (letras y números, máx. 10).*
- En tablas/listas: columna **Nombre** (`name`). Fallback: `name ?? code` por si llega un response viejo.
- **No** mostrar un campo “Código” en el modal ni en la tabla.

Body al guardar:

```json
{
  "name": "Sucursal Buenos Aires",
  "prefix": "SBA",
  "address": "Blvd. Cucapah 20204",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22207"
}
```

El GET lista/detalle ahora incluye `name` (igual al valor interno `code`). **No enviar `code`** en el POST/PUT nuevo.

```
POST /api/tenant/fiscal-configurations/:id/branches
PUT  /api/tenant/fiscal-configurations/:id/branches/:branchId
```

---

### Almacén — quitar Código

Nombre + Código + Prefijo es repetitivo. En **Nuevo almacén** / **Editar almacén** solo:

| Campo UI | API | Obligatorio en form | Notas |
|----------|-----|---------------------|--------|
| **Nombre** * | `name` | Sí | Etiqueta (`Enrejado`) |
| **Prefijo** | `prefix` | No al guardar; **sí antes de recibir OC** | Segmento del lote (`VD`, `BDGA`) |
| Status | `status` | No | |
| Descripción | `description` | No | |
| Ubicación | `street`, `city`, … | No | |

- **Quitar el input Código** del modal. No precargarlo, no enviarlo.
- El **prefijo sí se puede repetir** entre almacenes (varios con `RCK` / `BDGA` está bien).
- No usar helper *“Si el código tiene guión…”* — ya no aplica.
- No usar helper *“Si el código tiene guión…”* — ya no aplica.
- Hint prefijo: *Segmento del lote al recibir mercancía (letras y números, máx. 10, sin guiones).*
- Placeholder prefijo: `Ej. BDGA`

En `warehouses[]` al guardar la sucursal:

```json
{
  "name": "Enrejado",
  "prefix": "VD",
  "status": "active"
}
```

Si editas almacén por `PUT /api/tenant/warehouses/:id` (CEDIS / logística): mismos campos. **No mandar `code`.**

El GET puede seguir trayendo `code` (dato legado). **Ignorarlo en el form.**

---

## 1. Razón social — campo `prefix`

Pestaña **Configuración** del modal crear/editar razón social, junto a Razón social / RFC.

| Campo UI | API | Obligatorio en form | Notas |
|----------|-----|---------------------|--------|
| **Prefijo** | `prefix` | No al guardar; **sí antes de recibir OC** | Máx. 10. Solo letras y números. Sin guiones. Se guarda en mayúsculas. |

```
GET  /api/tenant/fiscal-configurations
POST /api/tenant/fiscal-configurations
PUT  /api/tenant/fiscal-configurations/:id
```

```json
{ "razon_social": "MADERERIA ZONA NORTE", "rfc": "MZN980826EF2", "prefix": "MZN" }
```

### Tabla Configuración Fiscal → Razones Sociales

`GET /api/tenant/fiscal-configurations` ahora incluye `prefix` en cada fila (`string` o `null`).

| Columna UI | API | Formato |
|------------|-----|---------|
| Razón Social | `razon_social` | Texto |
| RFC | `rfc` | Texto |
| **Prefijo** | `prefix` | Badge/texto (`MZN`). Si `null`, mostrar "—" |
| Tipo de Persona | `persona_type` | Texto |
| Status | `status` | `active` → Activo |

Poner **Prefijo** junto a RFC. El search del listado también filtra por `prefix`.

Placeholder form: `Ej. MZN`. Hint: *Se usa en el folio de lote al recibir mercancía.*

---

## 2. Validación de prefijo (los tres)

| Regla | Valor |
|-------|--------|
| Longitud | 1–10 |
| Caracteres | A–Z, 0–9 (uppercase al blur) |
| Guiones | No |

---

## 3. Recibir OC — lotes

Al confirmar recepción, cada lote nace con `batch_number` en formato `MZN-SBA-BDGA-00011`.

Mostrar ese valor en la UI de recepción / inventario. No inventar el folio en el cliente.

El backend **solo** usa `prefix` del almacén (ya no cae al código). Si el prefijo está vacío, 400.

| Causa | Mensaje |
|-------|---------|
| Razón sin prefijo | `La razón social no tiene prefijo. Configúralo en Configuración fiscal (ej. MZN).` |
| Sucursal sin prefijo | `La sucursal "…" no tiene prefijo. Configúralo en la sucursal (ej. SBA).` |
| Almacén sin sucursal | `El almacén "…" no está vinculado a una sucursal. …` |
| Almacén sin prefijo | `El almacén "…" no tiene prefijo. Configúralo en el almacén (ej. BDGA).` |
| Prefijo inválido al guardar | `El prefijo solo admite letras y números (máx. 10), sin guiones. Ejemplo: MZN` |

Lotes viejos (`MH-LOTE-000001`) no se migran; los nuevos usan el formato de 4 segmentos.

Las **transferencias** al almacén destino también usan este generador.

---

## Checklist Pollux

- [ ] Sucursal: label **Nombre** (API `name`). Quitar label **Código**
- [ ] Sucursal: tabla columna **Nombre** (`name ?? code`)
- [ ] Sucursal: guardar `{ name, prefix, … }` — no enviar `code`
- [ ] Almacén: quitar campo **Código** del modal crear/editar
- [ ] Almacén: solo **Nombre** + **Prefijo** (+ status, descripción, ubicación)
- [ ] Almacén: guardar `{ name, prefix, … }` — no enviar `code`
- [ ] Quitar hint de “si el código tiene guión…”
- [ ] Prefijo en razón social (`prefix`) — form y **columna en la tabla** del listado
- [ ] Tabla razones sociales: `prefix` → "—" si viene `null`
- [ ] Validación UI: 1–10, A–Z / 0–9, uppercase al blur
- [ ] Recibir OC: pintar `batch_number` del response
- [ ] Toasts con el `message` del 400 si faltan prefijos
