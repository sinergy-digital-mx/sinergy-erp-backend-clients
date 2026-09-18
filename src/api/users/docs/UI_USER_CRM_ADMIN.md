# UI — Administrador de CRM

Guía para Pollux: checkbox **Administrador de CRM** en el tab **Información general** del modal de usuario.

---

## Dónde va

Tab **Información general**, no un tab nuevo. Junto a nombre / correo / estatus.

| UI | API | Tipo |
|----|-----|------|
| Administrador de CRM | `is_crm_admin` | `boolean` |

Hint: *Puede ver y dar seguimiento a las actividades de todos los usuarios en el portal CRM.*

---

## Crear / editar

Va en el mismo **Guardar cambios** que el resto del usuario:

```http
POST /api/tenant/users
PUT  /api/tenant/users/:userId
```

```json
{
  "is_crm_admin": true
}
```

`GET /api/tenant/users` y `GET /api/tenant/users/:userId` incluyen `is_crm_admin`.

El login y el refresh también: `user.is_crm_admin` y el JWT.

Si el usuario **editado** es el que está logueado, conviene recargar sesión (refresh) para que el inbox CRM tome el flag.

---

## Efecto en CRM

| Valor | Inbox `/crm` |
|-------|----------------|
| `false` | Solo actividades propias |
| `true` | Todas. Filtro por autor |

El rol **Admin** también ve todas, aunque `is_crm_admin` sea `false`.

Detalle: `src/api/crm/docs/UI_CRM_INBOX.md`.
