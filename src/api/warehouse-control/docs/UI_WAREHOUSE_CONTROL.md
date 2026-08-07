# UI — Control de almacén (corroboración / picking)

Módulo para almacén: listar OV en **En Selección**, ver qué tomar y de qué almacén, y confirmar corroboración → **Lista para entrega**.

Ruta API base: `/api/tenant/warehouse-control`  
Código módulo RBAC: `warehouse_control`  
Visible solo si la organización tiene el módulo habilitado (permiso `ViewMenu`).

---

## Flujo de negocio (resumen)

| Estado OV | Significado |
|-----------|-------------|
| `Creada` | Sin proceso de selección; no indica picking. Puede ir a fulfill (entrega rápida) → `Surtida`. |
| `En Selección` | Checkbox al crear: necesita selección/armado. Aparece en esta pantalla. |
| `Lista para entrega` | Ya corroborada por almacén (inventario FIFO asignado). Lista para envío. |
| `Surtida` | Cumplida vía POS/fulfill clásico (sin Control de almacén). |
| `En Camino` | Subida a un envío (shipping). |

```
Crear OV + checkbox ON  → En Selección
        ↓
Control de almacén (corroborar)
        ↓
Lista para entrega
        ↓
Envío (shipping) → En Camino
```

---

## Menú

Ítem **Control de almacén**. Mostrar solo si el usuario tiene permiso `WarehouseControl` + `ViewMenu` y el módulo está enabled.

---

## Pantalla lista (mismo patrón OV / OC)

### Search

Campo search libre (igual que lista OV):

- Folio
- Nombre / apellido de cliente

Query: `GET /api/tenant/warehouse-control?search=...`

### Filtros

| Filtro UI | Query param | Notas |
|-----------|-------------|--------|
| **CEDIS** | `billing_branch_id` | Sucursal (`billing_branches`). Filtra por `warehouse.billing_branch_id`. |
| **Almacén** | `warehouse_id` | Opcional. Tras elegir CEDIS, cargar almacenes de esa sucursal y permitir filtrar. También puede usarse sin CEDIS. |

Paginación: `page`, `limit` (default 20). Orden: más antiguas primero (`created_at ASC`).

### Columnas sugeridas

| Columna | Campo |
|--------|--------|
| Folio | `folio` |
| Cliente | `customer.display_name` |
| CEDIS | `billing_branch.display_name` / `code` |
| Almacén | `warehouse.name` |
| Fecha entrega | `expected_delivery_date` |
| Total | `total` |
| Pago | `payment_status` |
| Creada | `created_at` |
| Creada por | `created_by_user` |

Badge de estado fijo: **En Selección** (solo llegan esas).

### Click fila

Abrir **side panel** (preferido) o modal ancho con el detalle de corroboración (`GET /:id`).

---

## Panel / modal de corroboración

### Header

- Folio, cliente, CEDIS, almacén origen, fecha entrega, notas, total.

### Tabla de líneas (qué tomar)

| Columna | Campo |
|---------|--------|
| Producto | `product_name` (+ `product_sku`) |
| Unidad | `uom_name` |
| Cantidad | `quantity` |
| Cant. base | `quantity_base_uom` (opcional / tooltip) |
| Almacén | `warehouse_name` |
| Stock disp. | `available_quantity` |

Si `available_quantity < quantity_base_uom` → aviso visual (el back rechazará la corroboración por stock insuficiente).

### Acciones

| Botón | Acción |
|-------|--------|
| Cancelar / Cerrar | Cierra panel sin cambios |
| **Confirmar corroboración** | `POST /api/tenant/warehouse-control/:id/corroborate` |

Body opcional:

```json
{ "notes": "Armado completo rack 3" }
```

Éxito:

1. Toast: orden corroborada / lista para entrega.
2. Cerrar panel y quitar fila de la lista (o refrescar).
3. OV queda en `Lista para entrega` con `corroborated_by` + `corroborated_at`.

---

## Crear Orden de Venta (modal Información)

Entre **Fecha de entrega** y **Notas**:

```
☐ Necesita proceso de selección y armado
```

Al crear `POST /api/tenant/sales-orders`:

```json
{
  "requires_selection_assembly": true,
  ...
}
```

| Checkbox | `general_status` resultante |
|----------|----------------------------|
| Off (default) | `Creada` |
| On | `En Selección` |

Solo aplica a órdenes **MANUAL**. En POS el flag se ignora.

Edición (`PUT /sales-orders/:id`) permitida en `Creada` y `En Selección`; puede cambiar el flag y el estado entre esos dos.

### Badges en lista OV

Agregar estados:

- `En Selección`
- `Lista para entrega`

(además de Creada, Surtida, En cola, En Camino, Cancelada).

### Detalle OV

Mostrar si aplica:

- `requires_selection_assembly`
- `corroborated_by_user` / `corroborated_at` (cuando ya corroboró almacén)

`GET /api/tenant/sales-orders/:id` incluye `corroborated_by_user` en el header.

---

## Después de Lista para entrega

1. **Envío (flujo principal):** wizard shipping — OV elegibles = `Surtida` **o** `Lista para entrega` del mismo almacén → al crear envío pasan a `En Camino`.
2. **Entrega rápida** desde detalle OV: sigue siendo `POST .../fulfill` solo desde `Creada` (sin pasar por este módulo). Órdenes en `En Selección` **no** pueden fulfill; deben corroborarse aquí.

---

## Checklist UI

- [ ] Menú Control de almacén (`ViewMenu`)
- [ ] Lista con search + CEDIS + Almacén
- [ ] Side panel con líneas (producto, UOM, qty, almacén, stock)
- [ ] Confirmar corroboración
- [ ] Checkbox en crear OV
- [ ] Badges nuevos en lista OV
- [ ] Mostrar quién/cuándo corroboró en detalle OV
