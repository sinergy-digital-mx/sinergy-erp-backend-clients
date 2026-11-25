# UI — Listado de clientes por razón y sucursal

El vendedor abre **Clientes** con su razón social y su sucursal ya elegidas en los selects. Puede cambiar a todas. No se ocultan clientes en el API.

## Cambios

- 2026-11-24: Prefiltro configurable y select de sucursal. Permiso `customers:ViewAll`.

---

## Dónde se configura

Configuración → **Clientes** (`/settings/customer-list`).

| Valor | Quién entra con su razón y sucursal |
| --- | --- |
| `sellers` | Quien no es admin y no tiene `customers:ViewAll`. Es el valor si la organización no ha guardado nada. |
| `everyone` | Todos, incluido admin. |
| `off` | Nadie. El listado abre sin ubicación. |

Guardar pide `customers:Update`. Leer pide `customers:Read`.

```http
GET /api/tenant/customers/list-settings
PUT /api/tenant/customers/list-settings
{ "prefilter": "sellers" }
```

`sellers` | `everyone` | `off`.

El rol Admin recibe `customers:ViewAll` en la migración. Otro rol lo recibe en Roles y permisos si debe entrar viendo todas las razones.

La ubicación es la sucursal principal del usuario (`assigned_branches` / `is_primary`) y la razón de esa sucursal. Si no tiene sucursal, el listado abre sin ese filtro.

---

## Listado

Dos selects:

1. **Razón social** — opción vacía: «Todas las razones sociales».
2. **Sucursal** — solo si hay una razón elegida. Opción vacía: «Todas las sucursales».

Al entrar sin query de ubicación, si el prefiltro aplica, la URL queda con:

```http
GET /api/tenant/customers?registered_fiscal_configuration_id={razon}&registered_billing_branch_id={sucursal}
```

Elegir todas las razones manda `location_scope=all` en la ruta de la pantalla (el API no usa ese parámetro) y no manda los dos ids. Así se ven todos y, al volver a entrar a Clientes desde el menú, vuelve la razón y sucursal del usuario.

Limpiar todos los filtros también vuelve a la razón y sucursal del usuario cuando el prefiltro aplica. Quitar solo el chip de razón social deja ver todas.

El resumen y el Excel usan los mismos dos filtros.

```http
GET /api/tenant/customers/stats?registered_fiscal_configuration_id=&registered_billing_branch_id=
GET /api/tenant/customers/export/excel?registered_fiscal_configuration_id=&registered_billing_branch_id=
```

Filtra clientes cuya **razón y sucursal de registro** coinciden. No filtra por vendedor asignado.
