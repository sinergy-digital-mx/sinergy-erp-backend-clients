# UI — Tab Registro (sucursal y quién registró)

Guía para Pollux: tab **Registro** en el modal Crear / Editar cliente.

Son datos **solo informativos**. No restringen en qué sucursal puede comprar el cliente.

**No usar `warehouse_id`.** Ese campo es otro (almacén asignado). Aquí es sucursal de facturación.

---

## Ubicación

Cuarto tab del modal **Crear Cliente** / **Editar Cliente**:

1. Información del Cliente
2. Credito — `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`
3. Información Fiscal
4. **Registro**

Ningún campo de este tab es obligatorio. El cliente se puede guardar sin llenarlos.

```
┌─────────────────────────────────────────────────────┐
│ Crear Cliente                                 [ X ] │
├─────────────────────────────────────────────────────┤
│ Información del Cliente   Credito   Información     │
│ Fiscal                    Registro                  │
├─────────────────────────────────────────────────────┤
│ Sucursal de registro                                │
│ [ Sin sucursal                              ▼ ]     │
│                                                     │
│ Registrado por                                      │
│ [  (usuario de la sesión)                   ▼ ]     │
│                                                     │
│              [ Cancelar ]              [ Crear ]    │
└─────────────────────────────────────────────────────┘
```

---

## Catálogo (dropdowns)

No usar `GET /tenant/billing/branches` (pide otro permiso) ni `GET /tenant/users`.

```
GET /api/tenant/customers/registration-options
Permiso: customers:Read
```

Cargar **al abrir** el modal crear/editar. Cachear en memoria de esa pantalla. No cachear entre organizaciones ni en localStorage.

```json
{
  "branches": [
    { "id": "uuid", "name": "Sucursal Buenos Aires" }
  ],
  "users": [
    {
      "id": "uuid",
      "first_name": "Ana",
      "last_name": "García",
      "email": "ana@ejemplo.com"
    }
  ]
}
```

| Select | Origen | Label | Valor vacío |
|--------|--------|-------|-------------|
| Sucursal de registro | `branches` | `name` | `Sin sucursal` → `null` |
| Registrado por | `users` | `{first_name} {last_name}` (fallback `email`) | `Sin usuario` → `null` |

---

## Prefill al crear

| Campo | Prefill | Si no hay dato |
|-------|---------|----------------|
| Sucursal de registro | `user.billing_branch_id` de la sesión (si existe en `branches`) | `null` |
| Registrado por | `user.id` de la sesión | `null` |

El usuario puede cambiarlos o dejarlos vacíos. En **editar**, mostrar lo guardado; no pisar con la sesión.

Si el front no envía `registered_by_user_id` al crear, el backend asigna al usuario de la sesión. Para dejarlo vacío: enviar `null`.

---

## Guardar

```
POST /api/tenant/customers
PUT  /api/tenant/customers/:id
```

```json
{
  "name": "María",
  "lastname": "López",
  "registered_billing_branch_id": "uuid-sucursal",
  "registered_by_user_id": "uuid-usuario"
}
```

Para quitarlos en edición:

```json
{
  "registered_billing_branch_id": null,
  "registered_by_user_id": null
}
```

`400` si el uuid no pertenece a esta organización.

---

## Lectura (detalle / editar)

`GET /api/tenant/customers/:id` incluye:

```json
{
  "registered_billing_branch_id": "uuid",
  "registered_billing_branch": {
    "id": "uuid",
    "code": "Sucursal Buenos Aires"
  },
  "registered_by_user_id": "uuid",
  "registered_by_user": {
    "id": "uuid",
    "first_name": "Ana",
    "last_name": "García",
    "email": "ana@ejemplo.com"
  }
}
```

Label sucursal: `registered_billing_branch?.code ?? '—'`.
Label usuario: `registered_by_user` → `{first_name} {last_name}` o `email`, si no hay → `—`.

Opcional en tabla de clientes: no es obligatorio mostrar columnas.

---

## Qué no hacer

- No filtrar ventas, POS, inventario ni listados por estos campos.
- No exigirlos para crear el cliente.
- No hardcodear sucursales ni usuarios.

---

## Checklist Pollux

- [ ] Tab **Registro** (después de Información Fiscal)
- [ ] Campos opcionales: Sucursal de registro, Registrado por
- [ ] Catálogo: `GET /tenant/customers/registration-options`
- [ ] Prefill al crear: sucursal de la sesión + usuario actual
- [ ] `POST`/`PUT` con `registered_billing_branch_id` y `registered_by_user_id` (o `null`)
- [ ] En editar, pintar desde `registered_billing_branch` / `registered_by_user`

Tab Información Fiscal (domicilio SAT): `src/api/customers/docs/UI_CUSTOMER_FISCAL.md`
