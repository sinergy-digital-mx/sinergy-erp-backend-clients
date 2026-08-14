# UI — Estatus y filtros de usuarios

Guía para Pollux: cambiar estatus en el **detalle** del usuario, botón **Eliminar** con confirmación, y filtros de listado (estatus + rol).

Ya está en API.

---

## Catálogo de estatus

Cargar **una vez** al abrir Gestión de Usuarios.

```http
GET /api/tenant/users/statuses
Authorization: Bearer <token>
Permiso: User:Read
```

```json
[
  { "id": 1, "code": "active", "name": "Activo" },
  { "id": 2, "code": "inactive", "name": "Inactivo" },
  { "id": 3, "code": "deleted", "name": "Eliminado" }
]
```

Usar `code` para lógica y color. `name` para el texto del select.

| code | Badge | En el select del detalle |
|------|-------|--------------------------|
| `active` | Verde | Sí |
| `inactive` | Gris | Sí |
| `deleted` | Rojo | **No** (solo el botón Eliminar) |

---

## Detalle — cambiar Activo / Inactivo

En el panel de detalle (no en el modal Editar), junto al badge **ACTIVE**:

- Select **Estatus** con `active` e `inactive` (ocultar `deleted`).
- Al cambiar, llamar de inmediato (no esperar a Guardar cambios del modal).

```http
PUT /api/tenant/users/:userId/status
Authorization: Bearer <token>
Permiso: User:Update
```

```json
{ "status_id": 2 }
```

```json
{
  "message": "Estatus actualizado",
  "user": {
    "id": "uuid",
    "status_id": 2,
    "status": { "id": 2, "code": "inactive", "name": "Inactivo" }
  }
}
```

Tras 200: actualizar el badge del detalle y de la tarjeta del listado.

Un usuario **inactivo** no puede iniciar sesión (`401` — `Tu cuenta no está activa`).

No se puede desactivar la cuenta con la que estás logueado (`403`).

---

## Detalle — Eliminar (botón + confirmación)

Botón **Eliminar** en el detalle (rojo, separado del select). **No** es un hard delete: pasa el usuario a `deleted`.

1. Click → modal de confirmación:  
   `¿Eliminar a Ariana Moreno? Dejará de poder iniciar sesión.`
2. Confirmar → `DELETE`.
3. Cancelar → no llama API.

```http
DELETE /api/tenant/users/:userId
Authorization: Bearer <token>
Permiso: User:Delete
```

```json
{
  "message": "Usuario eliminado",
  "user": {
    "id": "uuid",
    "status": { "id": 3, "code": "deleted", "name": "Eliminado" }
  }
}
```

Tras 200: quitar al usuario del listado (por defecto no se listan eliminados) o dejarlo con badge rojo si el filtro es Eliminado.

Ocultar el botón si no hay `User:Delete`. No mostrar si el usuario ya está `deleted`. No permitir eliminarte a ti mismo (`403`).

---

## Listado — filtros (estatus + rol)

A la derecha de **Filtrar por estado**, otro select **Filtrar por rol**.

```
[ Buscar por email...          ]
[ Filtrar por estado ▼ ]  [ Filtrar por rol ▼ ]
```

### Estatus

Opciones: **Todos** (sin `status_id`) + catálogo de `GET /statuses`.

- Sin `status_id`: activos e inactivos. **No** incluye eliminados.
- Con `status_id`: solo ese estatus (incluye eliminados si eliges Eliminado).

### Rol

Opciones: **Todos** (sin `role_id`) + roles de la organización.

```http
GET /api/tenant/roles
Permiso: User:Read
```

Usar `roles[].id` y `roles[].name`.

### Listado filtrado

```http
GET /api/tenant/users?status_id=1
GET /api/tenant/users?role_id=uuid-del-rol
GET /api/tenant/users?search=ariana&status_id=1&role_id=uuid-del-rol
```

`search` busca en email, nombre y apellido (el input actual puede seguir diciendo "Buscar por email...").

Omitir el query param cuando el select está en **Todos**. No enviar `role_id=` vacío.

Cada usuario del listado incluye `status_id` y `status`:

```json
{
  "users": [
    {
      "id": "uuid",
      "first_name": "Ariana",
      "last_name": "Moreno",
      "email": "contabilidad@mzn.mx",
      "status_id": 1,
      "status": { "id": 1, "code": "active", "name": "Activo" }
    }
  ]
}
```

---

## Errores

Toast con `message`.

| Status | Cuándo |
|--------|--------|
| 400 | Estatus inválido, o el usuario ya está eliminado |
| 403 | Intentaste desactivar/eliminar tu propia cuenta, o no tienes permiso |
| 404 | Usuario no existe |

---

## Permisos

| Acción | Permiso |
|--------|---------|
| Catálogo y listado | `User:Read` |
| Select Activo/Inactivo | `User:Update` |
| Botón Eliminar | `User:Delete` |
