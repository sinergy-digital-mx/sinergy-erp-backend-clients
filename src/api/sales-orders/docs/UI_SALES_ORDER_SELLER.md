# UI — Vendedor en detalle de orden de venta

## Lectura

```
GET /api/tenant/sales-orders/:id
```

En `data.header` / respuesta:

```json
{
  "seller_user": {
    "id": "uuid",
    "first_name": "Vendedor",
    "last_name": "Perez",
    "pos_user_code": 140696
  }
}
```

Mostrar: **Vendedor Perez (140696)**. Si `seller_user` es `null` → "Sin vendedor".

### Alta (crear orden)

| Tipo | `seller_user_id` |
|------|------------------|
| `POS` | Obligatorio en el body |
| `MANUAL` | Opcional: si se omite, el backend asigna al usuario que crea la orden |

---

## Editar vendedor

```http
PATCH /api/tenant/sales-orders/:id/seller
Content-Type: application/json

{
  "seller_user_id": "uuid-del-vendedor"
}
```

Respuesta: mismo shape que el detalle (`header.seller_user` actualizado).

### Reglas

| Regla | Detalle |
|-------|---------|
| Quién puede ser vendedor | Usuario del tenant con `is_pos_user = false` (quien usa código POS) |
| Bloqueado | Orden `Cancelada` |
| Lista para select | Usuarios no-POS del tenant (o los que tengan `pos_user_code`) |

### UI

En el detalle, junto al campo Vendedor:

```
Vendedor: Vendedor Perez (140696)  [Cambiar]
```

Modal/select → `PATCH .../seller` → refrescar `seller_user`.

---

## Checklist

- [ ] Mostrar `seller_user` en detalle
- [ ] Botón/select para cambiar vendedor
- [ ] `PATCH /tenant/sales-orders/:id/seller`
- [ ] Deshabilitar si orden cancelada
