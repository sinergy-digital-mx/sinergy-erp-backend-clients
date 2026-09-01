# UI — Mesa de Control

Picking por almacén, posiciones de piso y armado. Solo OV MANUAL con checkbox **Necesita proceso de selección y armado**.

Ruta API: `/api/tenant/warehouse-control`  
Código módulo RBAC: `warehouse_control`  
Menú: **Mesa de Control** (`WarehouseControl` + `ViewMenu`). El módulo debe estar enabled.

POS no entra. OV sin checkbox siguen `Creada` → fulfill.

---

## Flujo

```
Crear OV + checkbox ON
        ↓
Job + 1 tarea por almacén (según stock de la sucursal)
        ↓
Cada almacén surte en paralelo (start → complete)
        ↓
Posición de piso de la sucursal (dónde se arma)
        ↓
Marcar armando → Corroborar
        ↓
Lista para entrega → envío
```

La OV **no** cambia de estados finos. Mientras el job está vivo: `En Selección`. Al corroborar: `Lista para entrega`.

| Status job | UI | Tooltip (hover) |
|------------|----|-----------------|
| `released` | Por surtir | Liberada a los almacenes. Todavía nadie empezó a surtir. |
| `picking` | Picking | Al menos un almacén ya está surtiendo esta orden. |
| `waiting_assembly` | Esperando armado | Todos los almacenes cerraron. Lista para juntar en la posición. |
| `assembling` | Armando | Se está armando el pedido en el piso. |
| `assembled` | Armada | Armada. Falta corroborar para pasar a entrega. |

Tarea de almacén: `pending` → `in_progress` → `picked` o `short`.

---

## Login / usuario

`user.assigned_warehouses[]` en login, refresh, `GET /tenant/users` y `GET /tenant/users/:id`.

| `assigned_warehouses` | Vista default |
|-----------------------|---------------|
| Vacío, o rol Admin | **Admin** (tablero central) |
| Uno o más, sin Admin | **Jefe de almacén** (`view=warehouse`) |

Un Admin con almacenes puede mandar `view=warehouse` para verse como jefe.

---

## 1. Tablero admin

`GET /api/tenant/warehouse-control?billing_branch_id={sucursal}&search=&status=&page=1&limit=50`

La sucursal es **obligatoria para pintar el mapa**. Sin sucursal: cards + cola, mapa vacío.

### Cards (`stats`)

Usar `stats` del board (o `GET /stats` con los mismos filtros). **No** sumar `jobs[]`.

| Card | Campo |
|------|--------|
| En mesa | `stats.in_desk` |
| Por surtir | `stats.released` |
| Picking | `stats.picking` |
| Esperando armado | `stats.waiting_assembly` |
| Armando | `stats.assembling` |
| Armadas (pendiente corroborar) | `stats.assembled` |
| Con faltante | `stats.with_shortage` |
| Posiciones libres / ocupadas | `stats.positions_free` / `stats.positions_occupied` |

### Mapa de posiciones (`positions[]`)

Grid con `row` x `col`. Cada celda:

- `code` (A1)
- Si `occupied`: folio, chips por almacén (`{warehouse.name} {líneas cerradas}/{total}`), color por `job.status`
- Click → panel del job (`GET /:jobId`)

Sin catálogo de posiciones: empty state “Define posiciones de armado para esta sucursal”. El picking **sí** puede arrancar.

### Cola sin posición (`queue[]`)

Jobs sin `position`. Acción: **Asignar posición** o **Siguiente libre**.

**Título de la card = folio de la OV, nunca el `id` del job.**  
`id` (`5f4e6b16-…`) solo sirve para las llamadas (`assign-position`, detalle). No recortarlo ni mostrarlo.

Cada card:

| UI | Campo |
|----|--------|
| Folio (título) | `folio` o `sales_order.folio` (`OSV-000004`) |
| Cliente | `customer_name` / `customer_display_name` / `sales_order.customer.name` |
| Teléfono (opcional) | `sales_order.customer.phone` |
| Fecha de entrega | `expected_delivery_date` |
| Estado | `status` → label (Por surtir, …) |
| Progreso | `progress.warehouses_done` / `warehouses_total` |
| Faltante | chip si `has_shortage` |

Lo mismo en celdas ocupadas del mapa: folio + cliente, no UUID.

```http
POST /api/tenant/warehouse-control/:jobId/assign-position
{ "position_id": "uuid" }
```

Sin `position_id` → siguiente libre de la sucursal.

### Panel de la OV (drawer izquierda)

Click en card de cola o celda del mapa → **drawer que entra desde la izquierda** (`GET /:jobId`). No abrir modal centrado.

Agrupar `tasks[]` por almacén. Cada línea: producto, `quantity` (pedida) vs `quantity_picked` (surtida), faltante. UOM: `uom_name`.

`missing[]`: “Falta {product_name} — {warehouse_name}”.

| Estado | Acciones |
|--------|----------|
| Sin posición | Asignar posición |
| Todas las tareas `picked`/`short` | **Marcar armando** `POST /:jobId/assemble` |
| `assembling` | Otra vez assemble → `assembled` (opcional). **Corroborar** |
| `assembled` / `assembling` | `POST /:jobId/corroborate` `{ "notes": "opcional" }` |

Si la sucursal **no** tiene posiciones, se puede corroborar desde `waiting_assembly`.

Corroborar **no** vuelve a descontar inventario (ya se descontó al cerrar cada almacén). Pasa la OV a `Lista para entrega`.

---

## 2. Vista jefe de almacén

Misma ruta. Default `view=warehouse` si tiene almacenes y no es Admin.

**Header obligatorio:** qué almacén es este jefe. No adivinar por el nombre del usuario.

| UI | Campo |
|----|--------|
| Título / chip | `scope_label` (`Almacén Frio` / `Bodega Seca`) |
| Almacenes | `assigned_warehouses[].name` + `code` |
| Combo sucursal | `billing_branches[]` del **board**, no otro catálogo |

Si `billing_branches.length === 1`: combo bloqueado o oculto; el back ya manda `billing_branch_id` y pinta el mapa.  
Si Pollux pide sucursales a Billing/Read, el jefe no las ve (por eso el combo sale vacío).

`user.assigned_warehouses` del login trae lo mismo (`name`, `billing_branch`).

Cards de **su** almacén: `stats.warehouse.pending`, `in_progress`, `picked_today`.

### Lista **Surtir estas N** (cards compactas)

`jobs[]` → cada job trae `pick_tasks[]` (solo su almacén). **Una card por job**, no por producto.

**No listar productos en la card.** Una OV puede tener decenas de líneas y la lista se vuelve inusable (el “Pedido 0” inline es el error). Los productos van en el **drawer izquierda**, igual que el panel de la OV del admin.

Card:

| UI | Campo |
|----|--------|
| Folio | `folio` (`OSV-000004`) |
| Cliente | `customer_name` |
| Posición | `position.code` o “Sin posición” |
| Almacén | `pick_tasks[0].warehouse.name` (chip) |
| Estado job / tarea | `status` + `pick_tasks[0].status` |
| Resumen (una línea) | `{pick_tasks[0].lines_count} productos · Pedido {pick_tasks[0].quantity_requested_total}` |
| Iniciar | `POST /:jobId/tasks/:taskId/start` — `taskId` = `pick_tasks[0].id` |
| Surtir 100% | `POST /:jobId/tasks/:taskId/complete` sin `lines` |
| Ajustar / ver pedido | abre el drawer |

Click en la card o **Ajustar** → drawer desde la **izquierda** (mismo patrón que el panel admin). Ahí sí las líneas.

### Drawer de surtido (izquierda)

Datos: `pick_tasks[0].lines[]` del board, o `GET /:jobId` si quieres fresco.

| UI | Campo | No usar |
|----|--------|---------|
| Producto | `product_name` | |
| Pedido | **`quantity`** | `qty`, `requested`, `sales_order_detail.quantity` (no vienen → sale 0) |
| Surtido | `quantity_picked` | |
| UOM | `uom_name` (`KILOGRAMO`, `PIEZA`) | |
| Faltante / short | `quantity_base_missing` > 0 o `status === 'short'` | |
| id al surtir | `id` de la **línea** (`lines[].id`) | `sales_order_detail_id` |

```json
{
  "id": "uuid-linea",
  "product_name": "LECHUGA ROMANA (OREJONA)",
  "quantity": 12,
  "quantity_picked": 0,
  "uom_name": "KILOGRAMO",
  "quantity_base_requested": 12,
  "quantity_base_picked": 0,
  "quantity_base_missing": 12,
  "status": "pending"
}
```

`quantity` ya viene en la UOM de la OV y **solo de este almacén** (si el producto se partió entre almacenes, no es el total de la OV).

Surtir con ajuste:

```json
{
  "lines": [
    { "id": "uuid-linea", "quantity_base_picked": 4 }
  ]
}
```

`quantity_base_picked` es en UOM **base** (igual que `quantity_base_requested`). Si omites `lines`, se surte el 100 % pedido. Short permitido (`quantity_base_picked` < pedido) → aviso visual, job `has_shortage`.

Mapa de piso **solo lectura** (a dónde llevar el bulto).

No puede asignar posición, armar ni corroborar (403).

---

## 3. Configurar posiciones

Permiso `WarehouseControl` + `Create`. Tab o subruta **Configurar**.

```
GET    /api/tenant/warehouse-control/positions?billing_branch_id=
POST   /api/tenant/warehouse-control/positions
PUT    /api/tenant/warehouse-control/positions/:positionId
DELETE /api/tenant/warehouse-control/positions/:positionId
```

Alta:

```json
{
  "billing_branch_id": "uuid",
  "code": "A1",
  "name": "Pasillo A · 1",
  "row": 0,
  "col": 0,
  "sort_order": 0
}
```

`code` único por sucursal. No borrar si está ocupada.

---

## 4. Crear OV

Sin cambio de campos. Checkbox + `requires_selection_assembly`. **No** pedir almacén por línea.

Ayuda: “La orden se surtirá por almacén (picking y armado en Mesa de Control)”.

Detalle: `src/api/sales-orders/docs/UI_SALES_ORDER_SELECTION_ASSEMBLY.md`.

---

## 5. Lista / detalle OV

Badges: `En Selección`, `Lista para entrega` (igual).

En `GET /sales-orders/:id` → `header.control_desk`:

- `progress.warehouses_done` / `warehouses_total` (ej. `2/3 almacenes`)
- `position.code`
- `missing[]`
- Link a Mesa de Control con `:jobId`

Si `control_desk` es `null`, no mostrar el bloque.

Editar líneas solo si el picking no empezó (400 si ya hay tarea `in_progress` / `picked`).

---

## Checklist UI

- [ ] Menú **Mesa de Control**
- [ ] Tablero admin: cards + mapa + cola
- [ ] Panel OV: progreso por almacén, faltantes, armar, corroborar
- [ ] Vista jefe: cards compactas (folio + resumen, **sin** listar productos)
- [ ] Drawer izquierda (igual que admin) con `lines[].quantity` = Pedido
- [ ] Start / complete / ajustar desde el drawer
- [ ] Configurar posiciones
- [ ] Tab almacenes en usuario (`UI_USER_WAREHOUSES.md`)
- [ ] Checkbox OV + helper
- [ ] Detalle OV: progreso / posición
