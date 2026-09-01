# UI — Gerente (usuarios a cargo)

Guía para Pollux: tab **Gerente** en el modal **Editar Usuario** / **Crear Usuario**.

Ya está en API.

---

## Cuándo mostrar el tab

Siempre visible en el modal de usuario, junto a POS / Empleado / Sucursales asignadas / Almacenes Mesa de Control.

El contenido del tab (lista + agregar usuarios) solo se habilita si `is_manager === true`.

| Pantalla | Tab Gerente |
|----------|-------------|
| Crear usuario | Sí (toggle). La lista se usa después de guardar. |
| Editar usuario | Sí |

No mezclar estos campos con **Guardar cambios** de Información general / POS / Empleado / Sucursales. El toggle `is_manager` sí va en el PUT del usuario. Agregar/quitar gente a cargo usa endpoints propios.

---

## Toggle "Es gerente"

En el tab, un switch **Es gerente**.

| UI | API | Tipo |
|----|-----|------|
| Es gerente | `is_manager` | `boolean` |

Enviar junto a crear/editar usuario:

```http
POST /api/tenant/users
PUT  /api/tenant/users/:userId
```

```json
{
  "is_manager": true
}
```

La respuesta de `GET /api/tenant/users` y `GET /api/tenant/users/:userId` incluye:

```json
{
  "id": "uuid-gerente",
  "first_name": "Daniel",
  "last_name": "Arriaga",
  "is_manager": true,
  "manager": null
}
```

Si el usuario **tiene** un responsable, `manager` trae al gerente:

```json
{
  "manager": {
    "id": "uuid-gerente",
    "email": "d.arriaga@mzn.mx",
    "first_name": "Daniel",
    "last_name": "Arriaga"
  }
}
```

`GET /api/tenant/users/:userId` de un gerente también incluye `reports` (la lista del tab).

El login incluye `user.is_manager`.

Si el gerente también es POS (`is_pos_user: true`), en el tab **POS** puede elegir `pos_user_type: "AMBOS"` para ver **Ventas y Cobranza** en el menú. Un POS que no es gerente solo puede ser `VENTAS` o `COBRANZA`.

Detalle: `src/api/pos-shifts/docs/UI_POS_FLOW.md`.

---

## Lista del tab (usuarios a cargo)

Cuando el switch está ON, muestra las personas de las que este usuario es **responsable**.

```http
GET /api/tenant/users/:userId/reports
Authorization: Bearer <token>
```

`:userId` = el usuario que se está editando (el gerente).

```json
{
  "is_manager": true,
  "reports": [
    {
      "id": "uuid-vendedor",
      "email": "vendedor@mzn.mx",
      "first_name": "Ana",
      "last_name": "López",
      "phone": "+52664...",
      "status": { "id": 1, "code": "active", "name": "Active" }
    }
  ]
}
```

Cada fila: nombre, apellido, correo. Botón para quitar.

---

## Agregar usuario

Selector de usuarios de la misma organización. Excluir:

- El gerente que se está editando
- Usuarios que ya están en `reports`
- Usuarios que ya tienen `manager` (otro responsable)

```http
POST /api/tenant/users/:userId/reports
Authorization: Bearer <token>
```

```json
{
  "user_id": "uuid-vendedor"
}
```

```json
{
  "message": "Usuario asignado al gerente",
  "report": {
    "id": "uuid-vendedor",
    "email": "vendedor@mzn.mx",
    "first_name": "Ana",
    "last_name": "López",
    "phone": null,
    "status": { "id": 1, "code": "active", "name": "Active" }
  }
}
```

Tras 201: agregar la fila a la lista. No cerrar el modal.

Un usuario solo puede tener **un** responsable.

---

## Quitar usuario

```http
DELETE /api/tenant/users/:userId/reports/:reportUserId
Authorization: Bearer <token>
```

```json
{
  "message": "Usuario desasignado del gerente"
}
```

Tras 200: quitar la fila. No cierra el modal.

---

## Errores

Toast con `message`.

| Status | Cuándo | Qué hacer |
|--------|--------|-----------|
| 400 | El usuario no es gerente, o se asignó a sí mismo | Mostrar `message` |
| 404 | Usuario no existe | Toast |
| 409 | Ya está asignado a este u otro gerente | Toast; no duplicar en la lista |

---

## Permisos

Sin permiso nuevo: `User` + `Read` / `Update` (los mismos del modal).

---

## Orden de tabs sugerido

1. Información general
2. POS
3. Empleado
4. Gerente
5. Sucursales asignadas
5b. Almacenes Mesa de Control (`src/api/users/docs/UI_USER_WAREHOUSES.md`)
6. Seguridad (solo perfil propio)
