# UI — Cambiar / restablecer contraseña

Guía para Pollux: tab **Seguridad** en el modal **Editar Usuario** y en el detalle de configuración del usuario logueado.

Ya está en API. Endpoint: `PUT /api/tenant/users/:userId/password`.

---

## Cuándo mostrar el tab

Mostrar el tab **Seguridad** si el usuario editado es el logueado **o** el logueado puede restablecer contraseñas ajenas.

```ts
const loggedInUserId = session.user.id; // login → user.id
const isOwnProfile = editedUser.id === loggedInUserId;
const canResetOthers = hasPermission(
  session.user.permissions_flat,
  'User',
  'Reset_Password',
  { isAdmin: session.user.hasAdminRole },
);
const showSecurityTab = isOwnProfile || canResetOthers;
```

`hasPermission` es el helper de `src/api/rbac/docs/UI_ROLES_PERMISSIONS.md` (case-insensitive en la entidad). En `permissions_flat` la clave es `user:Reset_Password`.

| Pantalla | Tab Seguridad |
|----------|----------------|
| Modal **Editar Usuario** (Gestión de Usuarios) | Sí si `isOwnProfile` **o** `canResetOthers` |
| Detalle / configuración del usuario logueado | Sí (siempre es el mismo) |
| Crear usuario | No |

No mezclar estos campos con **Guardar cambios** de Información general / POS / Empleado / Sucursales.

---

## Tab Seguridad

Después de **Sucursales asignadas** (y del tab **Gerente** si aplica).

| UI | API | Tipo | Requerido | Mín. |
|----|-----|------|-----------|------|
| Nueva contraseña | `new_password` | `string` | Sí | 8 |
| Confirmar contraseña | `confirm_password` | `string` | Sí | 8 |

Inputs tipo `password`. Validar en front que coincidan antes de llamar.

Botones del tab (no usar el **Guardar cambios** global):

- **Cancelar** — cierra / limpia los inputs
- **Cambiar contraseña** / **Restablecer contraseña** — llama el endpoint de abajo

Si `isOwnProfile`: botón **Cambiar contraseña**.
Si `canResetOthers` y no es el propio perfil: botón **Restablecer contraseña**.

---

## Endpoint

```http
PUT /api/tenant/users/:userId/password
Authorization: Bearer <token>
```

`:userId` = el usuario que se está editando (propio o ajeno si hay `User:Reset_Password`).

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

Permisos del endpoint:

- Siempre: `User:Update` (el mismo del modal de edición).
- Contraseña ajena: además `User:Reset_Password` (Admin lo bypasea con `hasAdminRole`).

**No** enviar `password` en `PUT /api/tenant/users/:userId`. Ese campo no es para este flujo.

Tras 200: toast de éxito, limpiar inputs, no cerrar el modal. El otro usuario sigue con su sesión hasta que expire; no hay logout forzado.

---

## Errores

Toast con `message`.

| Status | Cuándo | Qué hacer |
|--------|--------|-----------|
| 400 | No coinciden o menos de 8 caracteres | Mostrar el `message` bajo los inputs |
| 403 | `userId` ajeno y sin `User:Reset_Password` | No debería pasar si ocultas el tab |
| 404 | Usuario no existe | Toast y cerrar |

---

## Cómo asignar el permiso (Roles)

Quien deba restablecer contraseñas de **cualquier** usuario necesita `User:Reset_Password` en su rol.

1. Roles → seleccionar el rol (ej. Admin, RRHH).
2. `GET /api/tenant/roles/{roleId}/permissions/available`
3. Categoría **Administración** → módulo **Usuarios**.
4. Marcar el permiso:

| Runtime (`permissions_flat`) | Editor Roles | Acción | Descripción |
|------------------------------|--------------|--------|-------------|
| `user:Reset_Password` | `entity: "User"`, `action: "Reset_Password"` | `Reset_Password` | Restablecer contraseñas de usuarios |

5. Guardar: `PUT /api/tenant/roles/{roleId}/permissions` con los `permission.id` marcados (incluir los que ya tenía el rol).
6. Los usuarios de ese rol: re-login o `POST /api/auth/refresh`.

Sin este permiso, el tab Seguridad **solo** aparece en el propio perfil.

Admin (`hasAdminRole: true`) ya puede restablecer cualquiera; igual conviene dejar el checkbox marcado para que salga en `permissions_flat`.
