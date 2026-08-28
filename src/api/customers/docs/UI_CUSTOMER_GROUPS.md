# UI — Grupos de clientes

Guía para Pollux: catálogo de grupos **por organización** (Configuración) y uso en el listado de Clientes.

> **No hardcodear grupos.** No reutilizar "Campestre Divino" ni ningún UUID fijo. Cada organización tiene su propio catálogo. El filtro y el select deben salir de la API de la sesión actual.

---

## Aislamiento

Los grupos viven en `customer_groups` con `tenant_id`. `GET/POST/PUT/DELETE` solo ven/modifican grupos de la organización del token.

Una organización **nunca** debe ver grupos de otra. Si el dropdown muestra un grupo que no creó esa empresa, el front está usando un array estático o el endpoint incorrecto.

### Organización Divino

La organización `54481b63-5516-458d-9bb3-d4e5cb028864` ya tiene grupos en uso (clientes, contratos, reportes). **No recrear esos registros ni cambiar su `id`.**

Esos grupos llegan con `is_system: true`: se pueden **editar** nombre/descripción, **no eliminar**.

---

## Ubicación en la UI

Menú **Configuración → Grupos de clientes**

| Dato | Valor |
|------|--------|
| Módulo | `customer-groups` |
| Categoría | `settings` |
| Permiso menú | `CustomerGroup:ViewMenu` |

Mostrar el ítem si `hasAdminRole` **o** `customergroup:ViewMenu` en `permissions_flat`.

---

## API — Configuración (CRUD)

Base: `/api/tenant/customer-groups`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| GET | `/` | `CustomerGroup:Read` | Tabla de administración |
| GET | `/:id` | `CustomerGroup:Read` | Detalle / modal editar |
| POST | `/` | `CustomerGroup:Create` | Crear |
| PUT | `/:id` | `CustomerGroup:Update` | Editar nombre/descripción |
| DELETE | `/:id` | `CustomerGroup:Delete` | Eliminar (si no tiene clientes y no es de sistema) |

### GET lista — respuesta

```json
[
  {
    "id": "uuid",
    "name": "Mayoreo",
    "description": "Clientes de mayoreo",
    "is_system": false,
    "customer_count": 12,
    "created_at": "2026-05-29T12:00:00.000Z",
    "updated_at": "2026-05-29T12:00:00.000Z"
  }
]
```

Orden: `name` ASC. **No incluye** campos de otra organización.

### POST crear

```json
{
  "name": "Mayoreo",
  "description": "Clientes de mayoreo"
}
```

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `name` | string | Sí | 1–255, único por organización |
| `description` | string | No | máx. 2000 |

`409` si el nombre ya existe en esa organización.

### PUT editar

Mismos campos, todos opcionales. El `id` no cambia.

### DELETE

- `400` si `is_system === true` → "Este grupo no se puede eliminar porque está en uso por datos históricos"
- `400` si `customer_count > 0` → "No se puede eliminar el grupo porque tiene clientes asignados"
- `404` si no existe en esta organización

Ocultar el botón eliminar cuando `is_system` o `customer_count > 0`.

---

## API — Listado de Clientes (filtro y select)

No usar el CRUD de Configuración para el dropdown de Clientes (exige `CustomerGroup:Read`). Usar el catálogo del módulo Clientes:

```
GET /api/tenant/customers/groups
Permiso: customers:Read
```

```json
[
  { "id": "uuid", "name": "Mayoreo" }
]
```

Cargar **al abrir Clientes** (y al abrir modal crear/editar cliente). También al abrir **Contratos** y **Lotes** (mismo GET). Cachear en memoria de esa pantalla. No cachear entre organizaciones ni en localStorage global.

Filtro de tabla:

```
GET /api/tenant/customers?group_id=<uuid>&page=1&limit=20
```

Al crear/editar cliente, enviar `group_id` (uuid de **esta** organización) o `null` para quitarlo:

```json
{ "group_id": "uuid" }
```

```json
{ "group_id": null }
```

`400` si el uuid no pertenece a la organización actual.

Columna **Grupo** en la tabla: `customer.group?.name ?? '—'`.

El mismo `group_id` aplica en **Contratos** (`GET /tenant/contracts` y `/stats`). En **Lotes** el param es `customer_group_id` (el `groupId` de lotes es el proyecto). Ver `src/api/contracts/docs/UI_CONTRACT_LIST.md` y `src/api/properties/docs/UI_PROPERTY_STATS.md`.

---

## Permisos (Roles)

Módulo **Configuración → Grupos de Clientes**:

| Acción UI | Permiso |
|-----------|---------|
| Ver ítem en Configuración | `CustomerGroup:ViewMenu` |
| Ver tabla | `CustomerGroup:Read` |
| Crear | `CustomerGroup:Create` |
| Editar | `CustomerGroup:Update` |
| Eliminar | `CustomerGroup:Delete` |
| Filtro/select en Clientes | `customers:Read` |

Comparar en minúsculas: `customergroup:read`, etc. Admin (`hasAdminRole`) bypass.

---

## Pantalla Configuración

Catálogo simple (como categorías / descuentos globales):

- Título **Grupos de clientes**
- Botón **+ Crear grupo** (`CustomerGroup:Create`)
- Tabla: Nombre, Descripción, Clientes (`customer_count`), acciones
- Modal crear / editar: Nombre *, Descripción
- Eliminar con confirmación

```
┌─────────────────────────────────────────────┐
│ Grupos de clientes          [ + Crear grupo ]│
├─────────────────────────────────────────────┤
│ Nombre        Descripción     Clientes      │
│ Mayoreo       …               12     ✎  🗑  │
│ Campestre …   (sistema)       340    ✎      │
└─────────────────────────────────────────────┘
```

---

## Checklist Pollux

- [ ] Ítem **Grupos de clientes** en **Configuración** (`customer-groups` / `CustomerGroup:ViewMenu`)
- [ ] CRUD contra `/api/tenant/customer-groups` (nunca un array estático)
- [ ] Dropdown Clientes: `GET /api/tenant/customers/groups`
- [ ] Mismo catálogo en filtros de Contratos (`group_id`) y Lotes (`customer_group_id`)
- [ ] Columna Grupo: `customer.group?.name ?? '—'`
- [ ] Select grupo en modal crear/editar cliente
- [ ] `PUT` con `group_id` o `null`
- [ ] No mostrar eliminar si `is_system` o `customer_count > 0`
- [ ] No hardcodear "Campestre Divino" ni UUIDs de grupos
