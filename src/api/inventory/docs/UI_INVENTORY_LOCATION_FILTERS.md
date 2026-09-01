# UI — Filtros de inventario (razón social → sucursal → almacén)

Guía para Pollux: reemplazar el dropdown único **Todos los almacenes** por tres filtros en cascada.

Jerarquía:

```
Razón social (fiscal_configuration)
 └── Sucursal (billing_branch)
      └── Almacén (warehouse)
           └── Lote / totalizado
```

**POS no cambia.** `GET /tenant/inventory/pos/summary` sigue usando la sucursal de la terminal.

---

## 1. Qué quitar

| Hoy | Acción |
|-----|--------|
| Un solo dropdown **Todos los almacenes** | Eliminar |
| `GET /api/tenant/warehouses` como catálogo plano de este listado | No usarlo aquí |
| Enviar solo `warehouse_id` en lotes / totalizado / Excel | Prohibido. 400 si falta sucursal |

---

## 2. Qué poner (barra de filtros)

Misma fila que la búsqueda, estilo actual del dashboard:

```
[ Buscar... ]  [ Razón social ▼ ]  [ Sucursal ▼ ]  [ Almacén ▼ ]  [filtros]
```

| UI | Query param | Default visual | Enabled |
|----|-------------|----------------|---------|
| Razón social | `fiscal_configuration_id` | Todas las razones sociales | Siempre |
| Sucursal | `billing_branch_id` | Todas las sucursales | Solo si hay razón social |
| Almacén | `warehouse_id` | Todos los almacenes | Solo si hay sucursal |

Aplica a **Por Lotes** y **Totalizado**. Los mismos params van al Excel.

---

## 3. Catálogo de dropdowns (un request)

```
GET /api/tenant/inventory/locations
```

Permiso: `inventory:read`. **No** uses `FiscalConfiguration:Read` ni `Warehouse:Read` para esta pantalla.

```json
{
  "data": [
    {
      "id": "fiscal-uuid",
      "razon_social": "MADERERIA ZONA NORTE",
      "rfc": "MZN010101XXX",
      "status": "active",
      "branches": [
        {
          "id": "branch-uuid",
          "name": "Tijuana",
          "status": 1,
          "warehouses": [
            { "id": "wh-uuid", "name": "Mostrador", "status": "active" },
            { "id": "wh-uuid-2", "name": "Enrejado", "status": "active" }
          ]
        }
      ]
    }
  ]
}
```

Cargar **una vez** al entrar a Inventario. Filtrar en cliente.

`data[]` llega ordenado por `created_at` DESC (la razón social más reciente primero). **No** reordenar alfabéticamente en cliente.

| Dropdown | `value` | `label` |
|----------|---------|---------|
| Razón social | `data[i].id` | `razon_social` (RFC a la derecha, opcional) |
| Sucursal | `branches[j].id` | `name` |
| Almacén | `warehouses[k].id` | `name` |

Opciones extra:

- Razón: `{ value: null, label: 'Todas las razones sociales' }`
- Sucursal: `{ value: null, label: 'Todas las sucursales' }`
- Almacén: `{ value: null, label: 'Todos los almacenes' }`

Puedes ocultar `status !== 'active'` / `status !== 1`. Si hay stock en inactivos, mejor mostrarlos.

---

## 4. Cascada (obligatoria)

```
Sucursal: disabled + vacía mientras razón === null
Almacén:  disabled + vacío mientras sucursal === null
```

1. Cambia razón social → `billing_branch_id = null`, `warehouse_id = null`. Recargar sucursales de esa razón. Almacén sigue disabled.
2. Cambia sucursal → `warehouse_id = null`. Recargar almacenes de esa sucursal.
3. Cambia a “Todas las razones” → reset sucursal y almacén; ambos disabled (sucursal disabled, almacén disabled).
4. Cambia a “Todas las sucursales” → reset almacén; almacén disabled. Listado = todos los almacenes de esa razón.
5. **No** permitir sucursal sin razón. **No** permitir almacén sin sucursal.

```typescript
fiscalId: string | null = null;
branchId: string | null = null;
warehouseId: string | null = null;
locations: InventoryLocationFiscal[] = [];

get selectedFiscal() {
  return this.locations.find((f) => f.id === this.fiscalId) ?? null;
}

get branchOptions() {
  return this.selectedFiscal?.branches ?? [];
}

get warehouseOptions() {
  return this.branchOptions.find((b) => b.id === this.branchId)?.warehouses ?? [];
}

onFiscalChange(id: string | null) {
  this.fiscalId = id;
  this.branchId = null;
  this.warehouseId = null;
  this.reloadInventory();
}

onBranchChange(id: string | null) {
  this.branchId = id;
  this.warehouseId = null;
  this.reloadInventory();
}

onWarehouseChange(id: string | null) {
  this.warehouseId = id;
  this.reloadInventory();
}

buildInventoryQuery(): URLSearchParams {
  const params = new URLSearchParams();
  if (this.fiscalId) params.set('fiscal_configuration_id', this.fiscalId);
  if (this.branchId) params.set('billing_branch_id', this.branchId);
  if (this.warehouseId) params.set('warehouse_id', this.warehouseId);
  return params;
}
```

**Todas = no enviar el param.** No mandar `"null"` ni string vacío.

---

## 5. Listados

### Por Lotes

```
GET /api/tenant/inventory/batches
```

### Totalizado

```
GET /api/tenant/inventory/summary
```

### Query params de ubicación

| Parámetro | Tipo | Obligatorio | Efecto |
|-----------|------|-------------|--------|
| `fiscal_configuration_id` | uuid | No | Inventario de esa razón (todas sus sucursales/almacenes) |
| `billing_branch_id` | uuid | Solo si hay almacén | Inventario de esa sucursal |
| `warehouse_id` | uuid | No | Inventario de ese almacén |

Ejemplos:

```
GET /api/tenant/inventory/batches?page=1&limit=20
GET /api/tenant/inventory/batches?fiscal_configuration_id={uuid}
GET /api/tenant/inventory/batches?fiscal_configuration_id={uuid}&billing_branch_id={uuid}
GET /api/tenant/inventory/batches?fiscal_configuration_id={uuid}&billing_branch_id={uuid}&warehouse_id={uuid}
GET /api/tenant/inventory/summary?fiscal_configuration_id={uuid}&billing_branch_id={uuid}
```

### Errores 400

| Condición | Mensaje |
|-----------|---------|
| `billing_branch_id` sin `fiscal_configuration_id` | `Selecciona una razón social antes de filtrar por sucursal` |
| `warehouse_id` sin `billing_branch_id` | `Selecciona una sucursal antes de filtrar por almacén` |
| Sucursal de otra razón | `La sucursal no pertenece a la razón social seleccionada` |
| Almacén de otra sucursal | `El almacén no pertenece a la sucursal seleccionada` |

Mostrar el `message` en toast. No debería ocurrir si la cascada UI está bien.

---

## 6. Columnas de tabla

Mantener **Almacén**. Agregar **Razón social** y **Sucursal** (pueden ir a la izquierda de Almacén).

### Lotes — binding

| Columna | Campo |
|---------|-------|
| Lote | `batch_number` |
| Producto | `product_name` |
| Razón social | `razon_social` (fallback `—`) |
| Sucursal | `sucursal` (fallback `—`) |
| Almacén | `warehouse_name` |
| Cantidad | `quantity` |
| Orden de compra | `purchase_order_folio` |
| TAG | `source_tag_identifier` |
| Medida | `measure_label` (`—` si `null`). Nunca concatenar con `uom_name` |
| Fecha | `created_at` |

### Totalizado — binding

| Columna | Campo |
|---------|-------|
| Producto | `product_name` / `product_sku` |
| Razón social | `razon_social` |
| Sucursal | `sucursal` |
| Almacén | `warehouse_name` |
| Cantidad | `total_available_quantity` + `uom_name` (PT, ft²) |
| Por medida | `measure_totals[].measure_label` (solo si `length > 0`) |

Chips: `8 Foot → 80.000`. No pintar `8 ft²` / `8 PT`. Ver `UI_INVENTORY_MEASURE.md`.

Detalle de lote (`GET /batches/:id`) trae los mismos campos: `razon_social`, `sucursal`, `fiscal_configuration_id`, `billing_branch_id`. Pedimento de la OC de origen: `pedimento_number` (ver `UI_INVENTORY_BATCH_PEDIMENTO.md`).

---

## 7. Excel

Reutilizar los mismos tres ids del listado activo. Ver `UI_INVENTORY_EXPORT.md`.

```
GET /api/tenant/inventory/export/excel/batches?fiscal_configuration_id=...&billing_branch_id=...&warehouse_id=...
GET /api/tenant/inventory/export/excel/summary?fiscal_configuration_id=...&billing_branch_id=...
```

El archivo incluye columnas Razón social y Sucursal.

---

## Checklist Pollux

- [ ] Quitar dropdown plano **Todos los almacenes**
- [ ] Tres selects: Razón social → Sucursal → Almacén
- [ ] Sucursal disabled sin razón; almacén disabled sin sucursal
- [ ] Reset hijos al cambiar el padre
- [ ] `GET /tenant/inventory/locations` al entrar (permiso `inventory:read`)
- [ ] Mismos filtros en pestaña Lotes y Totalizado
- [ ] Columnas Razón social + Sucursal + Almacén
- [ ] Excel con los mismos query params
- [ ] POS sin cambios
- [ ] Recargar `GET /tenant/inventory/stats` al cambiar los tres filtros (cards arriba: `UI_INVENTORY_STATS.md`)
