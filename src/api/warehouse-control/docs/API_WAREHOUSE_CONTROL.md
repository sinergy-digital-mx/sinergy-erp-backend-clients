# API — Mesa de Control (`/api/tenant/warehouse-control`)

Picking por almacén y armado de OV en **En Selección**. Mensajes al cliente hablan de **organización**, nunca de tenant.

## Permisos

| Acción | Permiso |
|--------|---------|
| Tablero / detalle / posiciones (lectura) | `WarehouseControl` + `Read` |
| Picking, posición, armar, corroborar | `WarehouseControl` + `Update` |
| CRUD posiciones | `WarehouseControl` + `Create` |
| Menú | `WarehouseControl` + `ViewMenu` |

Módulo RBAC: `warehouse_control` (enabled en la organización).

Alcance de datos: si el usuario tiene `assigned_warehouses` y **no** es Admin, solo ve/actúa tareas de esos almacenes. Armar y corroborar son de supervisor (Admin o sin almacén asignado).

`:jobId` acepta el id del job **o** el id de la OV.

## Endpoints

| Método | Path | Notas |
|--------|------|-------|
| `GET` | `/` | Tablero: `stats`, `positions`, `queue`, `jobs` |
| `GET` | `/stats` | Solo conteos |
| `GET` | `/:jobId` | Detalle |
| `POST` | `/:jobId/assign-position` | `{ position_id? }` |
| `POST` | `/:jobId/tasks/:taskId/start` | Picking |
| `POST` | `/:jobId/tasks/:taskId/complete` | FIFO de **ese** almacén |
| `POST` | `/:jobId/assemble` | `assembling` → `assembled` |
| `POST` | `/:jobId/corroborate` | `Lista para entrega` (sin re-FIFO) |
| `GET` | `/positions?billing_branch_id=` | Catálogo + ocupación |
| `POST` | `/positions` | Alta |
| `PUT` | `/positions/:positionId` | Edición |
| `DELETE` | `/positions/:positionId` | Solo si no está ocupada |

## Board — query

```http
GET /api/tenant/warehouse-control?search=&billing_branch_id=&warehouse_id=&status=&view=admin&page=1&limit=50
```

- `view`: `admin` \| `warehouse`
- `status`: status del job (`released`, `picking`, …)

Cada item de `queue[]` / `jobs[]`:

```json
{
  "id": "5f4e6b16-f761-417b-8fa4-d5add4dbf65c",
  "folio": "OSV-000004",
  "customer_name": "58RESTAURANT",
  "customer_display_name": "58RESTAURANT",
  "expected_delivery_date": "2026-09-05",
  "status": "released",
  "has_shortage": false,
  "progress": { "warehouses_done": 0, "warehouses_total": 2 },
  "sales_order": {
    "id": "…",
    "folio": "OSV-000004",
    "customer_display_name": "58RESTAURANT",
    "expected_delivery_date": "2026-09-05",
    "customer": {
      "id": 15047,
      "name": "58RESTAURANT",
      "lastname": null,
      "display_name": "58RESTAURANT",
      "phone": "6641234567",
      "company_name": "CESAR JAVIER ESCANDON OJEDA"
    }
  }
}
```

`id` = job (para POST). Título UI = `folio`.

Cada `pick_tasks[]` (vista jefe) incluye resumen + líneas. **No** pintar `lines[]` en la card de la lista; van en el drawer.

```json
{
  "id": "uuid-task",
  "status": "pending",
  "warehouse": { "id": "…", "name": "Almacén Frio", "code": "FRIO" },
  "lines_count": 12,
  "quantity_requested_total": 48,
  "lines": [
    {
      "id": "uuid-linea",
      "product_name": "LECHUGA ROMANA (OREJONA)",
      "product_sku": "LEC-001",
      "quantity": 12,
      "quantity_picked": 0,
      "uom_name": "KILOGRAMO",
      "quantity_base_requested": 12,
      "quantity_base_picked": 0,
      "quantity_base_missing": 12,
      "status": "pending"
    }
  ]
}
```

- `quantity` / `quantity_picked`: UOM de la OV (lo que pinta **Pedido**).
- `quantity_base_*`: UOM base (lo que manda `complete`).

## Complete picking

```json
{ "lines": [{ "id": "uuid", "quantity_base_picked": 2 }] }
```

Sin `lines` = surte lo pedido. Menor a lo pedido = `short`.

## Relacionado — crear OV

```http
POST /api/tenant/sales-orders
{ "requires_selection_assembly": true, ... }
```

Crea el job y las tareas en la misma transacción. Ignorado en POS.

## Usuarios — almacenes

```http
GET  /api/tenant/users/:userId/warehouses
PUT  /api/tenant/users/:userId/warehouses
{ "warehouse_ids": ["uuid"] }
```

También `warehouse_ids` en POST/PUT de usuario. Login expone `assigned_warehouses`.
