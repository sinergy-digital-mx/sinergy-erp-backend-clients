# API — Control de almacén (`/api/tenant/warehouse-control`)

Corroboración / picking de órdenes de venta en estado **En Selección**.

Mensajes al cliente hablan de **organización**, nunca de tenant.

## Permisos

| Acción | Permiso |
|--------|---------|
| Listar / detalle | `WarehouseControl` + `Read` |
| Corroborar | `WarehouseControl` + `Update` |
| Menú | `WarehouseControl` + `ViewMenu` |

Módulo RBAC: `warehouse_control` (debe estar enabled para la organización).

## Endpoints

| Método | Path | Notas |
|--------|------|-------|
| `GET` | `/` | Solo OV `En Selección`. Query: `search`, `billing_branch_id`, `warehouse_id`, `page`, `limit` |
| `GET` | `/:id` | Detalle para panel de corroboración |
| `POST` | `/:id/corroborate` | FIFO + `Lista para entrega` + `corroborated_by` / `corroborated_at` |

## Lista — query

```http
GET /api/tenant/warehouse-control?search=OSV&billing_branch_id=uuid&warehouse_id=uuid&page=1&limit=20
```

- `billing_branch_id`: CEDIS / sucursal (`warehouses.billing_branch_id`).
- `warehouse_id`: filtro opcional de almacén.

## Detalle — respuesta (shape)

```json
{
  "header": {
    "id": "...",
    "folio": "OSV-000001",
    "general_status": "En Selección",
    "expected_delivery_date": "2026-08-10",
    "customer": { "id": 1, "display_name": "..." },
    "warehouse": { "id": "...", "name": "..." },
    "billing_branch": { "id": "...", "code": "...", "display_name": "..." },
    "notes": null,
    "total": 100.0
  },
  "line_items": [
    {
      "product_id": "...",
      "product_name": "...",
      "product_sku": "...",
      "uom_name": "PZA",
      "quantity": 2,
      "quantity_base_uom": 2,
      "warehouse_id": "...",
      "warehouse_name": "...",
      "available_quantity": 15
    }
  ]
}
```

MVP: un almacén por OV (`sales_orders.warehouse_id`) en todas las líneas.

## Corroborar

```http
POST /api/tenant/warehouse-control/:id/corroborate
Content-Type: application/json

{ "notes": "opcional" }
```

Efectos:

1. Asigna lotes FIFO (misma lógica que fulfill).
2. `general_status` → `Lista para entrega`.
3. Guarda `corroborated_by` (usuario JWT) y `corroborated_at`.

Errores típicos: orden no en `En Selección`, stock insuficiente.

## Relacionado — crear OV

```http
POST /api/tenant/sales-orders
{
  "requires_selection_assembly": true,
  ...
}
```

Si `true` (MANUAL) → `En Selección`. Si `false`/omitido → `Creada`. Ignorado en POS.
