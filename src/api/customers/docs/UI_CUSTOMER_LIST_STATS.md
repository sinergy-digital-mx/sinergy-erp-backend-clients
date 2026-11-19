# UI — Resumen del listado de clientes

Tarjetas arriba de la tabla de **Clientes**, antes del conteo de resultados.

## Cambios

- 2026-11-02: Sigue igual. Inventario, órdenes de compra y órdenes de venta usan el mismo permiso `ViewStats` en su módulo.
- 2026-10-09: Resumen y filtro por órdenes, datos fiscales, estatus y correo. Permiso `customers:ViewStats`.
- 2026-10-09: El resumen también respeta `registered_fiscal_configuration_id` (razón social asignada).

---

## Permiso

| Dato | Valor |
|------|--------|
| Módulo | `customers` |
| Acción | `ViewStats` |
| JWT | `customers:ViewStats` |

Sin ese permiso no se pintan las tarjetas y el query `insight` se ignora en el listado y en el Excel.

El rol Admin de cada organización lo recibe en la migración. El resto se asigna en Roles. Cada organización solo ve sus clientes.

Hay que correr la migración (o el seed) para que el permiso exista:

```bash
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-customers-view-stats-permission.ts
```

Después de aplicarla, la sesión refresca permisos (`permissions_version`).

---

## Endpoints

```http
GET /api/tenant/customers/stats
Permiso: customers:ViewStats
```

Query opcional, los mismos del listado excepto paginación e `insight`: `search`, `status_id`, `group_id`, `registered_fiscal_configuration_id`. Los números respetan esa búsqueda y no cambian al pulsar una tarjeta.

```http
GET /api/tenant/customers?insight=without_orders
Permiso de lista: customers:Read
Permiso del filtro: customers:ViewStats
```

```json
{
  "total": 248,
  "with_orders": 186,
  "without_orders": 62,
  "fiscal_ready": 92,
  "fiscal_not_ready": 156,
  "active": 230,
  "inactive": 18,
  "with_email": 210,
  "without_email": 38
}
```

### Valores de `insight`

| Valor | Lista |
|-------|--------|
| `with_orders` | Con al menos una orden de venta o POS no cancelada |
| `without_orders` | Sin órdenes vigentes |
| `fiscal_ready` | RFC real, razón social y CP de 5 dígitos |
| `fiscal_not_ready` | Les falta alguno de esos datos, o el RFC es genérico |
| `active` | Estatus `ACTIVE` |
| `inactive` | Otro estatus o sin estatus |
| `with_email` | Correo con texto |
| `without_email` | Sin correo |

RFC genérico: `XAXX010101000`, `XEXX010101000`. No cuenta como listo para facturar.

Las órdenes canceladas no cuentan. La orden tiene que ser de la misma organización que el cliente.

El Excel usa el mismo `insight` si la sesión tiene el permiso.
