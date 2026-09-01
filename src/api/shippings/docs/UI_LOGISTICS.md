# UI — Logística (camiones + envíos)

## Pantallas mínimas

1. **Catálogo camiones** — CRUD `/tenant/trucks`. Modal con tabs **General** + **Fotos** (mismo patrón que catálogo de productos). Ver `src/api/trucks/docs/UI_TRUCK_PHOTO.md`.
2. **Lista / calendario envíos** — filtros status / chofer / camión / fechas.
3. **Wizard crear envío** — form + **Vista previa** (lista A/B/C + mapa).
4. **Detalle envío** — paradas, km, cambiar status.
5. **Tab Envío en OV** — bloque `shipping` del GET detalle.
6. **Direcciones cliente** — lista en detail + modal GPS.

---

## Wizard crear envío — cascada (igual que OV)

**No hay almacén en este modal.** Quitar el combo **CEDIS origen / almacén**. Una OV puede surtirse de varios almacenes de la misma sucursal; el envío sale de la **sucursal**.

Mismo patrón que el listado OV (`src/api/sales-orders/docs/UI_SALES_ORDER_LIST.md`): **razón social → sucursal**.

### Form izquierda

| # | Campo UI | Obligatorio | Binding |
|---|----------|-------------|----------|
| 1 | **Razón social** | Sí | `fiscal_configuration_id` (solo UI; no va en POST) |
| 2 | **Sucursal** | Sí | `billing_branch_id` |
| 3 | Fecha | Sí | `shipping_date` |
| 4 | Camión | Sí | `truck_id` |
| 5 | Chofer | Sí | `driver_id` |
| 6 | Notas | No | `notes` |

Placeholder razón: `Selecciona una razón social`  
Placeholder sucursal: `Selecciona una sucursal`  
Sucursal **deshabilitada** hasta elegir razón.  
Lista **Órdenes elegibles** vacía hasta elegir sucursal: *“Selecciona una sucursal para listar órdenes”*.

### Combos (cascada)

**Razón social**

```
GET /api/tenant/fiscal-configurations?status=active&limit=100
```

Label: `razon_social` · Value: `id`

**Sucursal** (solo de esa razón)

```
GET /api/tenant/fiscal-configurations/{fiscalConfigId}/branches
```

Label: `code` o `name` (ej. `SUCURSAL BUENOS AIRES`) · Value: `id`  
No uses `GET /tenant/warehouses` ni `GET /tenant/billing/branches` en este modal (el segundo lista todas las sucursales de la organización; aquí deben filtrarse por razón).

### Cascada (obligatoria)

```
Sucursal: disabled + vacía mientras razón === null
Órdenes elegibles: no cargar mientras sucursal === null
```

1. Cambia razón social → `billing_branch_id = null`, vaciar selección de OV, recargar sucursales de esa razón.
2. Cambia sucursal → vaciar selección de OV y recargar:

```
GET /api/tenant/shippings/available-orders?billing_branch_id={uuid}&fiscal_configuration_id={uuid}&search=&page=1&limit=50
```

`fiscal_configuration_id` es opcional en API (la sucursal ya implica la razón). **Mándalo** para validar que la sucursal pertenece a esa razón (400 si no).
3. No enviar `origin_warehouse_id` ni `warehouse_id`.

### Órdenes elegibles (derecha)

OV `Surtida` o `Lista para entrega` de **cualquier almacén de esa sucursal**, sin envío activo.

| Columna sugerida | Campo |
|------------------|--------|
| Folio | `folio` |
| Cliente | `customer_name` / `customer.company_name` |
| Razón social | `razon_social` |
| Sucursal | `sucursal` o `billing_branch.code` |
| Estado | `general_status` |
| Total | `total` |

**No mostrar almacén.**

---

## Origen = sucursal (punto A)

El punto **A** de la ruta es la **sucursal** (`billing_branch_id`), no un almacén.

- Se guarda en el envío como `origin_billing_branch_id`.
- GPS: `billing_branches.latitude` / `longitude`.
- Si la sucursal no tiene GPS → preview marca `origin.location_status = "without_location"` y `origin_missing_location: true`.

### Cargar GPS de la sucursal

Reutilizar el **mismo modal Google Maps** que direcciones de cliente / sucursales:

- **Sin campo `type`**.
- Campos: calle (`address`), ciudad, estado, C.P. (`postal_code`), país, lat, lng.
- Guardar:

```http
PUT /api/tenant/fiscal-configurations/:fiscalConfigId/branches/:id
{
  "address": "...",
  "city": "...",
  "state": "...",
  "postal_code": "22000",
  "country": "México",
  "latitude": 32.5149,
  "longitude": -117.0382
}
```

`fiscalConfigId` = `origin.fiscal_configuration_id` del preview.  
`id` = `origin.billing_branch_id`.

En la vista previa: si el origen no tiene coords, aviso  
**“Esta sucursal no tiene ubicación registrada”** + **Agregar / editar ubicación** (modal con mapa → PUT de sucursal). Luego `POST /preview`.

### Patrón UI único (Google Maps)

| Caso | Endpoint | ¿Campo `type`? |
|------|----------|----------------|
| Dirección cliente | `POST/PUT .../customers/:id/addresses` | Sí (`shipping` = Entrega) |
| Sucursal fiscal | `POST/PUT .../fiscal-configurations/:id/branches` | No |
| Almacén (en sucursal) | `warehouses[]` dentro del PUT de sucursal | No |
| Origen de ruta (wizard envío) | `PUT .../fiscal-configurations/:id/branches/:branchId` | No |

Misma UX: buscador Places / pin en mapa → rellena dirección + lat/lng.

---

## Vista previa del envío (layout requerido)

Al pulsar **Vista previa**, llamar:

```http
POST /api/tenant/shippings/preview
{
  "billing_branch_id": "uuid-sucursal",
  "orders": [
    { "sales_order_id": "uuid-ov-1", "stop_sequence": 1 },
    { "sales_order_id": "uuid-ov-2", "stop_sequence": 2 }
  ]
}
```

> El back **reordena automáticamente** por distancia Haversine desde la sucursal (más cerca primero) y reasigna `stop_sequence`. Los `stop_sequence` del request son solo un hint temporal.

### Layout sugerido

| Izquierda | Derecha |
|-----------|---------|
| Lista de puntos **A → B → C…** con distancia del tramo | Mapa con markers + polyline de la ruta |

### Respuesta (campos clave)

```json
{
  "origin": {
    "label": "A",
    "billing_branch_id": "...",
    "fiscal_configuration_id": "...",
    "name": "SUCURSAL BUENOS AIRES",
    "address_summary": "Calle X, Tijuana, BC",
    "latitude": 32.51,
    "longitude": -117.03,
    "location_status": "ok"
  },
  "orders": [
    {
      "label": "B",
      "sales_order_id": "...",
      "folio": "OSV-000019",
      "customer_id": 108,
      "customer_name": "Sinergy",
      "customer_address_id": 7,
      "address_type": "shipping",
      "address_summary": "Callejon Rio Bravo, Tijuana, Baja California",
      "location_status": "ok",
      "delivery_latitude": 32.52,
      "delivery_longitude": -117.04,
      "stop_sequence": 1,
      "distance_from_previous_km": 4.2,
      "distance_from_origin_km": 4.2
    }
  ],
  "route_points": [ /* A + paradas, listo para mapa */ ],
  "estimated_distance_km": 12.5,
  "missing_location_count": 0,
  "origin_missing_location": false
}
```

- `route_points[]`: usar para pintar el mapa (kind `origin` | `stop`).
- `distance_from_previous_km`: km del tramo anterior → este (A→B, B→C…). Mostrar en la lista.
- `estimated_distance_km`: suma de tramos con GPS. `null` si faltan puntos.

---

## Alertas sin dirección / sin GPS

### Cliente (parada)

Preferencia del back: dirección `type = "shipping"` (UI: **Entrega**).

| Situación | UI |
|-----------|-----|
| `location_status === "without_location"` y **no** hay `customer_address_id` | Texto: **“Este cliente no tiene dirección de entrega registrada”** + botón **Agregar dirección** |
| `without_location` pero sí hay `customer_address_id` | Texto: **“La dirección de entrega no tiene coordenadas”** + botón **Editar dirección** |
| `location_status === "ok"` | Mostrar dirección + coords OK |

**Endpoints cliente:**

```http
GET  /api/tenant/customers/:customerId/addresses
POST /api/tenant/customers/:customerId/addresses
PUT  /api/tenant/customers/:customerId/addresses/:addressId
```

Al crear dirección de entrega enviar `type: "shipping"` + lat/lng (mapa).  
Tras guardar → volver a `POST /preview` (y opcional `POST /recalculate-distance` si el envío ya existe).

### Sucursal (origen)

Misma lógica con `origin.location_status` / `origin_missing_location` → modal editar sucursal (arriba).

---

## Flujo wizard

1. Form: razón social → sucursal, fecha, chofer, camión, notas. Cargar OV con  
   `GET /tenant/shippings/available-orders?billing_branch_id={sucursalId}&fiscal_configuration_id={razonId}`.  
   Seleccionar OV `Surtida` o `Lista para entrega` de esa sucursal.
2. **Vista previa** → `POST /preview` con `billing_branch_id`.
3. Completar ubicaciones faltantes (sucursal y/o clientes) sin salir del wizard.
4. Re-preview hasta `missing_location_count === 0` (ideal) o permitir crear con aviso.
5. **Crear envío** → `POST /` con el mismo `billing_branch_id` (el back vuelve a ordenar por distancia).
6. OV pasan a `En Camino`.

### Create body

```json
{
  "shipping_date": "2026-07-29",
  "driver_id": "uuid-user",
  "truck_id": "uuid-truck",
  "billing_branch_id": "uuid-sucursal",
  "notes": "Ruta matutina",
  "orders": [
    { "sales_order_id": "uuid-ov-1", "stop_sequence": 1, "customer_address_id": 7 },
    { "sales_order_id": "uuid-ov-2", "stop_sequence": 2 }
  ]
}
```

Usar `customer_address_id` del preview cuando exista.

---

## Direcciones en detail del customer

Request **separado** (no vienen en `GET /customers/:id`):

```http
GET /api/tenant/customers/:id/addresses
```

Los campos `fiscal_*` del customer **no** son la lista de Direcciones.

---

## Chofer (MVP)

Selector de usuarios activos. `driver_id` = `user.id`.

## Órdenes elegibles

```http
GET /api/tenant/shippings/available-orders?billing_branch_id={sucursalId}&fiscal_configuration_id={razonId}&search=&page=1&limit=50
```

OV con `general_status` = `Surtida` **o** `Lista para entrega` de la sucursal (cualquier almacén), sin envío activo. Al crear/agregar → `En Camino`. Al cancelar envío → se restaura `Lista para entrega` si la orden tuvo corroboración / `requires_selection_assembly`; si no, `Surtida`.

No uses el listado genérico de OV con `warehouse_id` para este wizard.

Las OV en **Lista para entrega** vienen de **Mesa de Control** (armado / corroboración). Ver `src/api/warehouse-control/docs/UI_WAREHOUSE_CONTROL.md`.

## Distancia

Haversine (línea recta), no Google Directions. Suficiente para ordenar y estimar km en MVP.

## Checklist Pollux (wizard Nuevo envío)

- [ ] Quitar combo **CEDIS origen / almacén**
- [ ] Combo **Razón social** (`fiscal_configuration_id`) — catálogo fiscales activas
- [ ] Combo **Sucursal** (`billing_branch_id`) — `GET .../fiscal-configurations/{id}/branches`
- [ ] Cascada: al cambiar razón, resetear sucursal y OV seleccionadas
- [ ] Sucursal disabled hasta elegir razón
- [ ] Órdenes: `GET /available-orders?billing_branch_id=&fiscal_configuration_id=`
- [ ] Empty state: *Selecciona una sucursal para listar órdenes*
- [ ] Preview / create: `billing_branch_id` (no `origin_warehouse_id`)
- [ ] GPS origen faltante → PUT sucursal, no warehouse
- [ ] No mostrar almacén en el listado de OV elegibles
