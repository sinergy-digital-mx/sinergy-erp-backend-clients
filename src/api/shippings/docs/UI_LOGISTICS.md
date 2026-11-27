# UI — Logística (camiones + envíos)

## 2026-11-27 — Dirección de la transferencia en el mapa

En el detalle del viaje, la tarjeta de cada transferencia muestra sucursal, almacén y dirección del destino. El mapa pinta ese punto con el GPS del almacén o, si no tiene, el de la sucursal. Si tampoco hay coordenadas, ubica la dirección. Cada tarjeta de la ruta (origen, orden y transferencia) tiene un botón con icono de mira: al pasar el cursor dice **Ubicar en el mapa** y centra el mapa en ese punto.

## 2026-11-25 — Origen y destino de transferencias

Un viaje que solo lleva transferencias ya no queda como “Sin destino”. La tarjeta y el detalle usan la sucursal de la bodega origen y la sucursal de la bodega destino (`source_branch_name`, `destination_branch_name`). Si el viaje también tiene entregas, el destino sigue siendo el cliente de la última parada.

## 2026-11-12 — Choferes al crear un envío

El combo de chofer ya no usa `GET /tenant/users`. Ese listado pide permiso de usuarios y el rol CEDIS no lo tiene, así que el combo salía vacío.

```http
GET /api/tenant/shippings/drivers
```

Permiso: `Shipping:Read`. Respuesta `{ data: [...] }` con usuarios marcados como chofer, activos, y `carta_porte_ready` / `carta_porte_missing`. Mismo origen en Nuevo viaje, en el viaje, en la transferencia y en el catálogo de choferes.

## 2026-11-06 — Uso de la unidad en flota

En **Flota y remolques** (`/logistics/trucks`) cada fila trae la columna **Uso**.

- Sin envío Creado o En Ruta: badge verde **Disponible**.
- Con envío activo: badge **En uso** y el folio corto del viaje (`#` + 8 caracteres del id). Índigo si está Creado, ámbar si está En ruta. El tooltip muestra estado, fecha y chofer. El badge abre el detalle del envío.

Los datos ya vienen en el listado: `active_shipping_id`, `active_shipping_status`, `active_shipping_date`, `active_shipping_driver_name`.

## 2026-11-03 — Varias transferencias por envío

Un viaje en **Creado** acepta varias transferencias de su sucursal. En la ruta, **Agregar transferencia** abre las pendientes y las suma al mismo envío. El folio abre el detalle de la transferencia.

Desde ese detalle también se puede crear el envío o agregarla a uno existente. El alta sigue siendo `POST /tenant/shippings/:id/transfers`.

## 2026-10-28 — Chofer y camión editables

Al crear el viaje y dentro de uno existente se ve si el chofer y el camión ya pueden carta porte. **Editar** abre la ficha después de elegirlos. En un viaje creado o en ruta también se pueden cambiar. Detalle en `UI_CARTA_PORTE.md`.

## 2026-10-28 — Carta porte en demo

En el envío, pestaña Carta porte, se puede timbrar en **Demo** para ver el PDF sin validez fiscal. El detalle está en `UI_CARTA_PORTE.md`.

## 2026-10-16 — Unidad en otro envío

En Nuevo viaje y en el envío de una transferencia, un camión en estado Creado o En Ruta no se puede elegir. La opción dice la fecha, el chofer y el estado de ese viaje. Si solo falta información de carta porte, la unidad sí se puede seleccionar.

## 2026-10-16 — Envío de transferencia

Un viaje puede ser entrega de órdenes, transferencia de inventario o ambas (`cargo_kind`: `order_delivery`, `inventory_transfer`, `mixed`). El alta acepta `inventory_transfer_ids`. La carta porte y el cierre están en `src/api/inventory/docs/UI_TRANSFER_SHIPMENT.md`. En Control logístico, debajo de Rastreo GPS, la pantalla Proceso de transferencia explica los pasos.

## 2026-10-09 — Dirección de la parada

La tarjeta de la orden muestra solo la dirección elegida. Un solo botón, **Dirección**, abre las del cliente: se elige una, se agrega otra o se edita el mapa de la fila. Al elegir una, el viaje en **Creado** hace `PATCH .../stops/:salesOrderId/address`. En el alta del viaje se vuelve a pedir el preview con ese `customer_address_id`. Si el viaje ya salió, el mismo botón solo corrige el mapa.

## 2026-10-09 — Detalle de viaje

El diálogo del viaje ocupa casi toda la pantalla. La fecha va en un bloque aparte del folio. Carta porte está en su pestaña; la ruta y el mapa quedan en **Ruta**.

## 2026-10-09 — Viajes: calendario y lista

Envíos deja de ser una pantalla del menú. Viajes y envíos son lo mismo.

- `/logistics/trips` abre en **calendario**. Arriba se cambia a **lista**.
- `/logistics/shippings` redirige a `/logistics/trips`.
- La lista y el dashboard usan la misma tarjeta: fecha, origen → destino, y en una sola línea folio, unidad, chofer y km. Varios clientes se muestran como conteo.

## 2026-10-09 — Rastreo GPS

Módulo `gps_tracking`, habilitado solo en Verdulería y Maderería.

- Configuración del sistema → **Rastreo GPS**: usuario y contraseña de 3D Tracking. Se prueba la conexión y queda una configuración activa.
- Ejecución → **Rastreo GPS** (`/logistics/tracking`): lista de unidades y mapa. El camión se dibuja en su última posición.
- En el camión, **Unidad GPS**. Si no se elige, el enlace es la placa contra el nombre de la unidad.
- Al crear un envío, un camión en `Creado` o `En Ruta` no se puede volver a elegir.

## 2026-10-09 — Control logístico

Menú izquierdo del módulo (tema claro del ERP). No incluye costos de dedicado ni subcontratado, ni catálogos de clientes o evidencias.

| Sección | Pantalla | Ruta |
|---------|----------|------|
| Ejecución | Dashboard: resumen de viajes abiertos (cualquier mes) y actividad del mes | `/logistics/dashboard` |
| Ejecución | Viajes: calendario (por defecto) o lista | `/logistics/trips` |
| Ejecución | Transferencias de inventario | `/logistics/transfers` |
| Catálogos | Flota y remolques | `/logistics/trucks` |
| Catálogos | Choferes: usuarios marcados como chofer | `/logistics/drivers` |

**Nuevo viaje** abre el mismo wizard de creación. En la UI el viaje es un envío normal con camión y chofer del catálogo.

Flota, choferes y transferencias usan la tabla `variant="modern"`. Viajes usa calendario o tarjetas. El dashboard usa la misma tarjeta.

El botón de crear va en la fila del título. Búsqueda y estado van debajo, con el mismo alto y borde que los filtros de órdenes de venta.

## 2026-10-09 — Dashboard

El resumen es una sola barra horizontal: abiertos, km, paradas, unidades y el mes. Cada viaje abierto usa la tarjeta de Viajes: fecha, origen → destino y el estado a la derecha.

## 2026-10-09 — Carta porte

No había carta porte en el sistema. Finkok no tiene un método aparte: el complemento **Carta Porte 3.1** va dentro de un CFDI 4.0 de traslado y se timbra con el `sign_stamp` que ya usa la facturación.

- Usuario: opción **Es chofer**. Si está activa, licencia y RFC son obligatorios.
- Unidad y chofer exponen `carta_porte_ready` y la lista de lo que falta.
- En el viaje: **Generar carta porte** (pide el peso de la carga en kg) y **Descargar PDF** cuando ya está timbrada.

Detalle de campos y validaciones: `UI_CARTA_PORTE.md`.

`GET /tenant/shippings` pagina igual que antes y, además, devuelve paradas con orden y cliente para armar origen → destino en las tarjetas.

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
      "customer_addresses": [
        {
          "id": 7,
          "type": "shipping",
          "type_label": "Entrega",
          "address_summary": "Callejon Rio Bravo, Tijuana, Baja California",
          "is_primary": true,
          "has_gps": true
        }
      ],
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

Cada parada trae `customer_addresses[]` con todas las direcciones activas del cliente. Mostrarlas en la vista previa y en el detalle del envío. La marcada es `customer_address_id`.

Al elegir otra en la vista previa, volver a `POST /preview` con ese `customer_address_id`. En un envío **Creado**:

```http
PATCH /api/tenant/shippings/:id/stops/:salesOrderId/address
{ "customer_address_id": 7 }
```

Preferencia del back si no se envía id: dirección principal (`is_primary`). Si ninguna está marcada: Entrega con GPS, luego cualquier GPS, luego tipo Entrega, luego la primera.

| Situación | UI |
|-----------|-----|
| Hay dirección elegida | La tarjeta muestra esa dirección en una línea. |
| Siempre que haya `customer_id` | Botón **Dirección**: lista las del cliente (o las trae de `GET /customers/:id/addresses`) y permite **Agregar dirección**. Al usar una, queda `customer_address_id`. |
| `location_status === "without_location"` y **no** hay `customer_address_id` | Texto: **“Este cliente no tiene dirección de entrega registrada”** |
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

Selector de choferes activos. `driver_id` = `user.id`.

```http
GET /api/tenant/shippings/drivers
```

Permiso `Shipping:Read`. No uses `GET /tenant/users`: el rol CEDIS no lo tiene y el combo queda vacío.

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
