# UI — Almacenes Mesa de Control (usuario)

Tab o bloque **Almacén(es) Mesa de Control** en el modal de usuario, junto a **Sucursales asignadas**.

Ya está en API.

---

## Cuándo mostrar

Siempre visible en crear / editar usuario. Sirve para el rol **Jefe de almacén** (permisos `WarehouseControl` en RBAC). La asignación recorta el tablero a esos almacenes.

Si el usuario tiene sucursal (`billing_branch_id`), el combo de almacenes **solo** lista almacenes de esa sucursal.

```
GET /api/tenant/inventory/locations
```

o el catálogo de almacenes de la sucursal ya usado en inventario.

---

## Cargar

`GET /api/tenant/users/:userId` incluye:

```json
{
  "assigned_warehouses": [
    {
      "id": "uuid",
      "name": "Almacén Frio",
      "code": "FRIO",
      "billing_branch_id": "uuid-sucursal",
      "billing_branch": {
        "id": "uuid-sucursal",
        "code": "TIJ-1",
        "display_name": "TIJ-1 — Tijuana"
      }
    }
  ]
}
```

Login y refresh traen el mismo arreglo en `user.assigned_warehouses`.

---

## Guardar

En crear / editar:

```json
{ "warehouse_ids": ["uuid-almacen-1", "uuid-almacen-2"] }
```

O endpoint propio (reemplaza el set):

```http
PUT /api/tenant/users/:userId/warehouses
{ "warehouse_ids": ["uuid-almacen-1"] }
```

`[]` quita todos. El almacén debe ser de la sucursal del usuario si tiene sucursal (400 si no).

Al cambiar de sucursal, el back suelta almacenes que ya no pertenecen.

---

## Checklist

- [ ] Selector multi-almacén en el modal de usuario
- [ ] Precargar `assigned_warehouses`
- [ ] Filtrar almacenes por sucursal del usuario
- [ ] Usar `user.assigned_warehouses` del login para la vista de Mesa de Control
