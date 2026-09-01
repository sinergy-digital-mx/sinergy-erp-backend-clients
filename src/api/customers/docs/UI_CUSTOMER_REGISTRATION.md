# UI — Tab Registro (razón, sucursal, vendedor asignado e historial)

Guía para Pollux: tab **Registro** en el modal Crear / Editar cliente.

Hay **dos bloques distintos**:

1. **Registro** — en qué razón social / sucursal se dio de alta el cliente. Solo informativo. No restringe en qué sucursal puede comprar.
2. **Vendedor asignado** — quién comisiona por default en las ventas de este cliente. Independiente de quién lo registró.

**No usar `warehouse_id`.** El cliente no lleva almacén.

---

## Ubicación

Cuarto tab del modal **Crear Cliente** / **Editar Cliente**:

1. Información del Cliente
2. Credito — `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`
3. Información Fiscal
4. **Registro**

Ningún campo de este tab es obligatorio.

```
┌─────────────────────────────────────────────────────┐
│ Editar Cliente                                [ X ] │
├─────────────────────────────────────────────────────┤
│ Información del Cliente   Credito   Información     │
│ Fiscal                    Registro                  │
├─────────────────────────────────────────────────────┤
│ Razón social de registro                            │
│ [ Sin razón social                          ▼ ]     │
│                                                     │
│ Sucursal de registro                                │
│ [ Sin sucursal                              ▼ ]     │
│   (solo sucursales de la razón elegida)             │
│                                                     │
│ Registrado por                                      │
│ [  Ana García                               ▼ ]     │
│                                                     │
│ Vendedor asignado                                   │
│ [  Gerente Jose Rivera MZN (1974)           ▼ ]     │
│                                                     │
│ Historial de asignaciones                           │
│  · Ana García · 1 sep 2026                          │
│    Vendedor asignado: Sin asignar → Jose Rivera     │
│                                                     │
│              [ Cancelar ]              [ Guardar ]  │
└─────────────────────────────────────────────────────┘
```

---

## Historial (abajo del tab Registro del **cliente**)

Esto **no va en la orden de venta**. Es para ver si alguien le cambió el vendedor asignado al cliente (robo de cartera).

Solo cambios de:

- Vendedor asignado
- Razón social de registro
- Sucursal de registro

Quién lo cambió, cuándo, de qué a qué.

```
GET /api/tenant/customers/:id
→ assignment_history[]

GET /api/tenant/customers/:id/assignment-history
→ { data: assignment_history[], total }
```

Si el cliente ya tenía razón/sucursal/vendedor y nunca se había logueado un cambio, el primer GET crea una fila **Asignación inicial** con lo que tiene hoy.

Cada `PUT /customers/:id` que mueva esos campos agrega una fila **Cambio de asignación**.

Pinta `title` + `description` + `actor_name` + `occurred_at`. Más reciente primero.

---

## Catálogo (dropdowns)

```
GET /api/tenant/customers/registration-options
Permiso: customers:Read
```

Cargar **al abrir** el modal crear/editar. Cachear en memoria de esa pantalla. No cachear entre organizaciones ni en localStorage.

**Ya no uses `branches` plano.** Las sucursales se repetían (CEDIS Ensenada de cada razón). Ahora van **agrupadas por razón social**.

```json
{
  "fiscal_configurations": [
    {
      "id": "uuid-razon",
      "razon_social": "Madereria Zona Norte",
      "rfc": "MZN980826EF2",
      "status": "active",
      "branches": [
        { "id": "uuid-sucursal", "name": "CEDIS Ensenada" },
        { "id": "uuid-sucursal-2", "name": "CENTRO" }
      ]
    }
  ],
  "users": [
    {
      "id": "uuid",
      "first_name": "Ana",
      "last_name": "García",
      "email": "ana@ejemplo.com"
    }
  ],
  "sellers": [
    {
      "id": "uuid",
      "first_name": "Jose",
      "last_name": "Rivera",
      "email": "jose@ejemplo.com",
      "pos_user_code": 1974
    }
  ]
}
```

| Select | Origen | Label | Valor vacío |
|--------|--------|-------|-------------|
| Razón social de registro | `fiscal_configurations` | `razon_social` | `Sin razón social` → `null` |
| Sucursal de registro | `fiscal_configurations[i].branches` de la razón elegida | `name` | `Sin sucursal` → `null` |
| Registrado por | `users` | `{first_name} {last_name}` (fallback `email`) | `Sin usuario` → `null` |
| Vendedor asignado | `sellers` | `{first_name} {last_name} ({pos_user_code})` | `Sin vendedor` → `null` |

### Cascada razón → sucursal

1. Sucursal **deshabilitada** hasta elegir razón social.
2. Cambia razón → resetear sucursal a `null` y recargar sucursales de esa razón.
3. No pintar un combo plano de todas las sucursales de todas las razones.

---

## Prefill al crear

| Campo | Prefill | Si no hay dato |
|-------|---------|----------------|
| Razón social de registro | Razón de `user.billing_branch_id` si esa sucursal está en el catálogo | `null` |
| Sucursal de registro | `user.billing_branch_id` de la sesión (si existe en las sucursales de esa razón) | `null` |
| Registrado por | `user.id` de la sesión | `null` |
| Vendedor asignado | `null` | `null` |

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
  "registered_fiscal_configuration_id": "uuid-razon",
  "registered_billing_branch_id": "uuid-sucursal",
  "registered_by_user_id": "uuid-usuario",
  "assigned_seller_user_id": "uuid-vendedor"
}
```

Para quitarlos en edición:

```json
{
  "registered_fiscal_configuration_id": null,
  "registered_billing_branch_id": null,
  "registered_by_user_id": null,
  "assigned_seller_user_id": null
}
```

| Error | Cuándo |
|-------|--------|
| `400` | uuid que no pertenece a esta organización |
| `400` | sucursal que no pertenece a la razón social enviada |
| `400` | vendedor asignado sin `pos_user_code` |

Si solo cambian la razón y no mandan sucursal, el backend **limpia** la sucursal si ya no pertenece a esa razón.

---

## Lectura (detalle / editar)

`GET /api/tenant/customers/:id` incluye:

```json
{
  "registered_fiscal_configuration_id": "uuid",
  "registered_fiscal_configuration": {
    "id": "uuid",
    "razon_social": "Madereria Zona Norte",
    "rfc": "MZN980826EF2"
  },
  "registered_billing_branch_id": "uuid",
  "registered_billing_branch": {
    "id": "uuid",
    "code": "CENTRO"
  },
  "registered_by_user_id": "uuid",
  "registered_by_user": {
    "id": "uuid",
    "first_name": "Ana",
    "last_name": "García",
    "email": "ana@ejemplo.com"
  },
  "assigned_seller_user_id": "uuid",
  "assigned_seller_user": {
    "id": "uuid",
    "first_name": "Jose",
    "last_name": "Rivera",
    "email": "jose@ejemplo.com",
    "pos_user_code": 1974
  },
  "assignment_history": [
    {
      "id": "uuid",
      "type": "assignment_updated",
      "type_label": "Cambio de asignación",
      "title": "Cambio de asignación",
      "description": "Vendedor asignado: Sin asignar → Jose Rivera (1974)",
      "actor_id": "uuid",
      "actor_name": "Ana García",
      "occurred_at": "2026-09-01T16:20:00.000Z",
      "changes": [
        {
          "field": "assigned_seller_user_id",
          "field_label": "Vendedor asignado",
          "from": null,
          "to": "Jose Rivera (1974)",
          "from_id": null,
          "to_id": "uuid"
        }
      ]
    }
  ]
}
```

| UI | Binding |
|----|---------|
| Razón social | `registered_fiscal_configuration?.razon_social ?? '—'` |
| Sucursal | `registered_billing_branch?.code ?? '—'` |
| Registrado por | `{first_name} {last_name}` o `email`, si no hay → `—` |
| Vendedor asignado | `{first_name} {last_name} ({pos_user_code})`, si no hay → `Sin vendedor` |

Refresh del historial (opcional):

```
GET /api/tenant/customers/:id/assignment-history
```

```json
{
  "data": [ { "id": "...", "title": "Cambio de asignación" } ],
  "total": 3
}
```

Orden: **más reciente primero**. No armes el copy en el cliente: pinta `title` + `description` + `actor_name` + `occurred_at`. Si `changes.length > 0`, puedes mostrar el diff.

---

## Qué no hacer

- No filtrar ventas, POS, inventario ni listados por razón/sucursal de registro.
- No exigirlos para crear el cliente.
- No listar sucursales de todas las razones en un solo combo.
- No usar el vendedor asignado del cliente como el **Vendedor** de la OV (ese es quien vendió). Al crear la OV se copia a **Comisionado**. Ver `src/api/sales-orders/docs/UI_SALES_ORDER_SELLER.md`.

---

## Checklist Pollux

- [ ] Tab **Registro**: Razón social → Sucursal (filtrada) → Registrado por → Vendedor asignado
- [ ] Catálogo: `GET /tenant/customers/registration-options` (`fiscal_configurations` + `sellers`)
- [ ] Cascada: cambia razón → reset sucursal
- [ ] `POST`/`PUT` con `registered_fiscal_configuration_id`, `registered_billing_branch_id`, `assigned_seller_user_id`
- [ ] Historial abajo: `assignment_history` del GET (o endpoint dedicado)
- [ ] En editar, pintar desde las relaciones, no pisar con la sesión

Tab Información Fiscal (domicilio SAT): `src/api/customers/docs/UI_CUSTOMER_FISCAL.md`
