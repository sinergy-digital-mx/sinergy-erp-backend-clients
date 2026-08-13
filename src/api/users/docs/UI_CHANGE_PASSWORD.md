# UI — Cambiar contraseña

Guía para Pollux: tab **Seguridad** en el modal **Editar Usuario** y en el detalle de configuración del usuario logueado.

Ya está en API. Endpoint nuevo: `PUT /api/tenant/users/:userId/password`.

---

## Cuándo mostrar el tab

Mostrar el tab **Seguridad** solo si el usuario que se está editando es el mismo que el logueado.

```ts
const loggedInUserId = session.user.id; // login → user.id
const isOwnProfile = editedUser.id === loggedInUserId;
```

| Pantalla | Tab Seguridad |
|----------|----------------|
| Modal **Editar Usuario** (Gestión de Usuarios) | Solo si `editedUser.id === session.user.id` |
| Detalle / configuración del usuario logueado | Sí (siempre es el mismo) |
| Crear usuario | No |
| Editar a otro usuario | No |

No mezclar estos campos con **Guardar cambios** de Información general / POS / Empleado / Sucursales.

---

## Tab Seguridad

Después de **Sucursales asignadas**.

| UI | API | Tipo | Requerido | Mín. |
|----|-----|------|-----------|------|
| Nueva contraseña | `new_password` | `string` | Sí | 8 |
| Confirmar contraseña | `confirm_password` | `string` | Sí | 8 |

Inputs tipo `password`. Validar en front que coincidan antes de llamar.

Botones del tab (no usar el **Guardar cambios** global):

- **Cancelar** — cierra / limpia los inputs
- **Cambiar contraseña** — llama el endpoint de abajo

---

## Endpoint

```http
PUT /api/tenant/users/:userId/password
Authorization: Bearer <token>
```

`:userId` = `session.user.id` (el mismo que el logueado).

```json
{
  "new_password": "NuevaClave123",
  "confirm_password": "NuevaClave123"
}
```

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

Permiso: `User:Update` (el mismo del modal de edición).

**No** enviar `password` en `PUT /api/tenant/users/:userId`. Ese campo no es para este flujo.

---

## Errores

Toast con `message`.

| Status | Cuándo | Qué hacer |
|--------|--------|-----------|
| 400 | No coinciden o menos de 8 caracteres | Mostrar el `message` bajo los inputs |
| 403 | `userId` no es el logueado | No debería pasar si ocultas el tab |
| 404 | Usuario no existe | Toast y cerrar |

Tras 200: toast de éxito, limpiar inputs, no cerrar el modal.

---

## Permisos

Sin permiso nuevo: `User` + `Update`.
