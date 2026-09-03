# UI — Sucursales del usuario

Tab **Sucursales asignadas** en el modal de usuario (`Configuración → Usuarios`).

Un usuario puede tener **varias sucursales**. Una se marca como **principal**. En POS, `billing_branch_id` es la **sucursal activa** (inventario y corte).

---

## Configurar (backoffice)

Ruta: `/settings/users` → abrir usuario → tab **Sucursales asignadas**.

- Usuario **no POS**: puede dejar vacío = acceso a todas.
- Usuario **POS**: al menos una sucursal. Marca una como **Principal**.
- Almacenes de Mesa de Control: se listan los de **todas** las sucursales marcadas.

Guardar en crear / editar:

```json
{
  "billing_branch_ids": ["uuid-a", "uuid-b"],
  "primary_billing_branch_id": "uuid-a",
  "billing_branch_id": "uuid-a"
}
```

O endpoint propio:

```http
PUT /api/tenant/users/:userId/branch
{
  "billing_branch_ids": ["uuid-a", "uuid-b"],
  "primary_billing_branch_id": "uuid-a"
}
```

`billing_branch_ids: []` y `billing_branch_id: null` = todas (solo no POS).

Si un admin edita a un usuario cobranza/ambos con **corte abierto**, no puede quitar ni cambiar su sucursal. Cierra el corte primero. En POS, el usuario sí puede cambiar su sucursal activa: el corte de la sucursal anterior permanece ahí.

---

## Respuesta de usuario / login

```json
{
  "billing_branch_id": "uuid-activa",
  "primary_billing_branch_id": "uuid-a",
  "assigned_branches": [
    {
      "id": "uuid-a",
      "code": "TIJ-1",
      "display_name": "TIJ-1 — Tijuana",
      "is_primary": true,
      "fiscal_configuration_id": "uuid"
    }
  ],
  "can_switch_branch": true,
  "has_all_branches_access": false
}
```

Login y refresh traen los mismos campos en `user`.

---

## Cambiar sucursal activa (POS)

Si `can_switch_branch === true`, el POS pide sucursal al entrar (si aún no eligió en esta sesión) y muestra un selector para cambiar.

```http
PUT /api/tenant/users/me/active-branch
{ "billing_branch_id": "uuid-b" }
```

También: `GET /api/tenant/users/me/branches`.

Efecto: inventario POS y corte de cobranza usan esa sucursal. Si no hay corte abierto ahí, las ventas quedan en cola. El corte de la sucursal anterior no se cierra.

400 si la sucursal no está asignada.

---

## Checklist

- [ ] Multi-select de sucursales + una principal
- [ ] POS: mínimo una sucursal
- [ ] No POS: opción “Todas”
- [ ] Login trae `assigned_branches` y `can_switch_branch`
- [ ] POS pide sucursal si hay más de una y aún no hay selección de sesión
- [ ] Cambiar sucursal recarga inventario y corte
