# UI — Crear orden de venta (razón social → sucursal)

Contrato para Pollux. Igual que OC en la cascada **razón social → sucursal**. A diferencia de OC, **no hay almacén** en el alta: la OV vende inventario de **todos los almacenes de esa sucursal**.

**POS no cambia.** Sigue mandando `warehouse_id` + `fiscal_configuration_id`. Ver `src/api/pos-shifts/docs/UI_POS_FLOW.md`.

---

## 1. Modal — tab Información

Dos combos en cascada (obligatorios), en este orden. **Quitar el dropdown Almacén.**

| # | Campo UI | Body POST | Catálogo |
|---|----------|-----------|----------|
| 1 | **Razón social** * | `fiscal_configuration_id` | Fiscales activas |
| 2 | **Sucursal** * | `billing_branch_id` | Sucursales de esa razón |
| 3 | **Cliente** * | `customer_id` | Búsqueda de clientes |
| 4 | **Fecha de entrega** * | `expected_delivery_date` | Date |
| 5 | Checkbox selección/armado | `requires_selection_assembly` | Solo si `warehouse_control` está enabled. **No** en Divino. Ver `UI_SALES_ORDER_SELECTION_ASSEMBLY.md` |
| 6 | **Notas** | `notes` | Texto opcional |

No pintar **Almacén**. No enviar `warehouse_id` en MANUAL.

El resto del modal (tab Productos, botones Cancelar / Crear Orden) se queda.

### Combos

**Razón social**

```
GET /api/tenant/fiscal-configurations?status=active&limit=100
```

Label: `razon_social` · Value: `id`  
Placeholder: `Selecciona una razón social`  
Sucursal **deshabilitada** hasta elegir razón.

**Sucursal** (solo de la razón)

```
GET /api/tenant/fiscal-configurations/{fiscalConfigId}/branches
```

Label: `code` (ej. `SUCURSAL BUENOS AIRES`) · Value: `id`  
Placeholder: `Selecciona una sucursal`  
Tab Productos **deshabilitado** hasta elegir sucursal.

### Cascada

1. Cambia razón → resetear sucursal y vaciar líneas del tab Productos; recargar sucursales.
2. Cambia sucursal → vaciar líneas; recargar inventario de esa sucursal.
3. No listar almacenes del sistema en este modal.

---

## 2. Tab Productos

Stock agregado de **todos** los almacenes de la sucursal. Un producto puede existir en Racks y Bodega: una sola fila, `total_available_quantity` sumado. `warehouse_names` es informativo.

```
GET /api/tenant/sales-orders/products-summary?fiscal_configuration_id={razonId}&billing_branch_id={sucursalId}&limit=40
```

Query:

| Param | Obligatorio |
|-------|-------------|
| `fiscal_configuration_id` | Sí |
| `billing_branch_id` | Sí |
| `search` | No. SKU exacto primero; el resto por relevancia (SKU, luego nombre). No reordenar en cliente. |
| `page` / `limit` | No (default 40, tope 40). Si `total` > filas, pedir `page` siguiente. |

**No** usar `GET /sales-orders/warehouse/:warehouseId/products-summary` en este modal (eso es legado / un solo almacén).

Respuesta (shape POS, agregado por sucursal):

```json
{
  "billing_branch_id": "uuid-sucursal",
  "fiscal_configuration_id": "uuid-razon",
  "warehouses": [{ "id": "...", "name": "Racks", "status": "active" }],
  "data": [
    {
      "product_id": "...",
      "product_name": "...",
      "product_sku": "...",
      "product_uom_id": "...",
      "uom_id": "...",
      "uom_name": "PZA",
      "warehouse_ids": ["uuid-racks", "uuid-bodega"],
      "warehouse_names": ["Racks", "Bodega"],
      "suggested_unit_price": "120.00",
      "total_available_quantity": "48.000"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 100,
  "totalPages": 1
}
```

Al agregar línea: `product_id`, `product_uom_id`, `quantity`, `unit_price`, impuestos. **No** mandar `warehouse_id` por línea.

`unit_price` admite hasta **4 decimales** (p. ej. `2.150`). No redondear a 2 en el cliente ni en el API. Los totales de cabecera siguen a 2 decimales.

Si `total_available_quantity` es 0, no dejar agregar (o avisar). El surtido/corroboración descuenta FIFO entre los almacenes de la sucursal.

---

## 3. POST

```
POST /api/tenant/sales-orders
```

```json
{
  "fiscal_configuration_id": "uuid-razon",
  "billing_branch_id": "uuid-sucursal",
  "customer_id": 14177,
  "expected_delivery_date": "2026-09-15",
  "notes": "opcional",
  "requires_selection_assembly": false,
  "line_items": [
    {
      "product_id": "uuid",
      "product_uom_id": "uuid",
      "quantity": 2,
      "unit_price": 2.15,
      "iva_percentage": 16,
      "ieps_percentage": 0
    }
  ]
}
```

- **No** enviar `warehouse_id` ni `sales_order_type` (queda `MANUAL`).
- Si sucursal ≠ razón → **400**.
- `billing_branch_id` es obligatorio en MANUAL.

Edición (`PUT /api/tenant/sales-orders/:id`) mismo body, mismos campos de ubicación. Solo `Creada` / `En Selección`.

---

## 4. Qué queda igual

- Checkbox **Necesita proceso de selección y armado** → `UI_SALES_ORDER_SELECTION_ASSEMBLY.md`
- Listado / detalle / Excel: razón + sucursal, sin almacén → `UI_SALES_ORDER_LIST.md`
- POS: `warehouse_id` obligatorio

---

## 5. Checklist Pollux

- [ ] Quitar combo **Almacén** del modal Crear OV
- [ ] Combo **Razón social** primero
- [ ] Combo **Sucursal** filtrado por razón; disabled sin razón
- [ ] POST manda `fiscal_configuration_id` + `billing_branch_id` (sin `warehouse_id`)
- [ ] Tab Productos usa `GET /sales-orders/products-summary`
- [ ] Al cambiar razón o sucursal, resetear productos
- [ ] POS sin cambios
