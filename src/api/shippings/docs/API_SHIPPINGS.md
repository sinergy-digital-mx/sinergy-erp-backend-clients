# API — Envíos / Logística (`/api/tenant/shippings`)

Rutas de entrega del día: origen (sucursal con GPS) → órdenes surtidas → camión + chofer (usuario) → distancia Haversine.

Scoped por organización vía JWT. No enviar `tenant_id` / `organization_id` en el body.

## Permisos

| Acción | Permiso |
|--------|---------|
| Preview / listar / detalle / resolve | `Shipping` + `Read` |
| Crear / agregar paradas | `Shipping` + `Create` |
| Status / recalcular km | `Shipping` + `Update` |

## Flujo UI

1. Elegir **razón social → sucursal**, fecha, camión, chofer, OV `Surtida` o `Lista para entrega`.
2. `POST /preview` → ruta A/B/C + km + alertas sin GPS (origen y paradas).
3. Completar GPS faltante:
   - Sucursal: `PUT /tenant/fiscal-configurations/:id/branches/:branchId` (`latitude` / `longitude` + dirección).
   - Cliente: `POST/PUT /tenant/customers/:id/addresses` con `type: "shipping"`.
4. Re-preview. El back **ordena por distancia** desde la sucursal.
5. `POST /` → crea envío (misma orden por distancia); OV → `En Camino`.
6. `PATCH /:id/status` → `En Ruta` → `Completado` (o `Cancelado`).

Detalle de pantallas / layout: `UI_LOGISTICS.md`.

## Estados

```
Creado → En Ruta | Cancelado
En Ruta → Completado | Cancelado
Completado / Cancelado → terminal
```

Al cancelar, las OV vuelven a `Lista para entrega` (si tuvieron corroboración / selección) o `Surtida`, y pueden reasignarse (historial de paradas se conserva).

## Endpoints

| Método | Path | Acción |
|--------|------|--------|
| `POST` | `/preview` | Estima km sin guardar |
| `POST` | `/resolve-orders` | `{ sales_order_ids }` → GPS |
| `POST` | `/` | Crear |
| `GET` | `/` | Filtros: status, driver_id, truck_id, billing_branch_id, date_from/to |
| `GET` | `/available-orders` | OV `Surtida` \| `Lista para entrega` de la sucursal (sin envío activo) |
| `GET` | `/:id` | Detalle + stops |
| `POST` | `/:id/stops` | Agregar OV (solo `Creado`) |
| `POST` | `/:id/recalculate-distance` | Tras cargar GPS |
| `PATCH` | `/:id/status` | `{ status }` |

## Create body

```json
{
  "shipping_date": "2026-07-29",
  "driver_id": "uuid-user",
  "truck_id": "uuid-truck",
  "billing_branch_id": "uuid-sucursal",
  "notes": "Ruta matutina",
  "orders": [
    { "sales_order_id": "uuid-ov-1", "stop_sequence": 1 },
    { "sales_order_id": "uuid-ov-2", "stop_sequence": 2, "customer_address_id": 7 }
  ]
}
```

## Elegibilidad OV

1. Misma organización.
2. Misma sucursal (`warehouse.billing_branch_id` = `billing_branch_id`). **No** se filtra por almacén.
3. `general_status` ∈ `Surtida` | `Lista para entrega`.
4. No está en otro envío activo (≠ Cancelado).

Listado para el wizard:

```http
GET /api/tenant/shippings/available-orders?billing_branch_id={uuid}&fiscal_configuration_id={uuid}&search=&page=1&limit=50
```

`billing_branch_id` obligatorio. `fiscal_configuration_id` opcional (valida que la sucursal sea de esa razón).

Respuesta: `{ data, total, page, limit, ... }` con `folio`, `general_status`, `customer_name`, `razon_social`, `sucursal`, `total`, etc.

## Embebido en OV

`GET /tenant/sales-orders/:id` incluye:

```json
{
  "shipping": {
    "has_shipping": true,
    "shipping_id": "...",
    "status": "En Ruta",
    "driver_name": "Juan Pérez",
    "truck_name": "Rabón 01",
    "stop_sequence": 2,
    "route_summary": { "distance_km": 45.2, "stops_count": 5 }
  }
}
```

## Distancia

Haversine (`src/common/utils/geo.helper.ts`): línea recta, no Google Directions. Snapshot de lat/lng en cada parada al asignar.

En `POST /preview` y `POST /` las paradas se **ordenan por distancia desde la sucursal** (más cerca primero). Sin GPS del origen o de la parada → van al final.

Respuesta de preview incluye `origin` (label `A`), `orders` (labels `B`…), `route_points`, `distance_from_previous_km`, `origin_missing_location`.

Preferencia de dirección de cliente: `type = "shipping"` (Entrega), luego cualquier dirección con GPS.

## Seeds / migración de permisos

- Migración: `1784900000004-seed-logistics-module-permissions.ts`
  - Módulos `trucks` + `shippings` (el índice RBAC es único por `module_id` + `action`)
  - Habilita en todas las organizaciones + rol Admin
- Script: `npm run seed:logistics` (opcional `[organizationId]`)
