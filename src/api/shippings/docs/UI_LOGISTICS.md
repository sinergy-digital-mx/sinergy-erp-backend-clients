# UI — Logística (camiones + envíos)

## Pantallas mínimas

1. **Catálogo camiones** — CRUD `/tenant/trucks`.
2. **Lista / calendario envíos** — filtros status / chofer / camión / fechas.
3. **Wizard crear envío** — form + **Vista previa** (lista A/B/C + mapa).
4. **Detalle envío** — paradas, km, cambiar status.
5. **Tab Envío en OV** — bloque `shipping` del GET detalle.
6. **Direcciones cliente** — lista en detail + modal GPS.

---

## Origen = CEDIS (almacén)

El punto **A** de la ruta es siempre el **almacén origen** (`origin_warehouse_id`), no un campo aparte.

- Se guarda en el envío como `origin_warehouse_id`.
- Debe tener `latitude` / `longitude` en `warehouses`.
- Si el CEDIS no tiene GPS → preview marca `origin.location_status = "without_location"` y `origin_missing_location: true`.

### Cargar GPS del CEDIS

El origen de ruta es el **almacén** (`origin_warehouse_id`), no la sucursal fiscal.

Reutilizar el **mismo modal Google Maps** que direcciones de cliente / sucursales:

- **Sin campo `type`** (no aplica: es el CEDIS mismo).
- Campos: calle, ciudad, estado, C.P., país, lat, lng (llenados por el mapa).
- Guardar:

```http
PUT /api/tenant/warehouses/:id
{
  "street": "...",
  "city": "...",
  "state": "...",
  "zip_code": "...",
  "country": "México",
  "latitude": 32.5149,
  "longitude": -117.0382
}
```

En la vista previa: si el origen no tiene coords, aviso  
**“Este CEDIS no tiene ubicación registrada”** + **Agregar / editar ubicación** (modal con mapa → `PUT warehouses/:id`). Luego `POST /preview`.

### Patrón UI único (Google Maps)

| Caso | Endpoint | ¿Campo `type`? |
|------|----------|----------------|
| Dirección cliente | `POST/PUT .../customers/:id/addresses` | Sí (`shipping` = Entrega) |
| Sucursal fiscal | `POST/PUT .../fiscal-configurations/:id/branches` | No |
| Almacén (en sucursal) | `warehouses[]` dentro del PUT de sucursal | No |
| CEDIS en preview de ruta | `PUT /tenant/warehouses/:id` | No |

Misma UX: buscador Places / pin en mapa → rellena dirección + lat/lng.

---

## Vista previa del envío (layout requerido)

Al pulsar **Vista previa**, llamar:

```http
POST /api/tenant/shippings/preview
{
  "origin_warehouse_id": "uuid-cedis",
  "orders": [
    { "sales_order_id": "uuid-ov-1", "stop_sequence": 1 },
    { "sales_order_id": "uuid-ov-2", "stop_sequence": 2 }
  ]
}
```

> El back **reordena automáticamente** por distancia Haversine desde el CEDIS (más cerca primero) y reasigna `stop_sequence`. Los `stop_sequence` del request son solo un hint temporal.

### Layout sugerido

| Izquierda | Derecha |
|-----------|---------|
| Lista de puntos **A → B → C…** con distancia del tramo | Mapa con markers + polyline de la ruta |

### Respuesta (campos clave)

```json
{
  "origin": {
    "label": "A",
    "warehouse_id": "...",
    "name": "Zona Norte Tijuana",
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

### CEDIS (origen)

Misma lógica con `origin.location_status` / `origin_missing_location` → modal editar warehouse (arriba).

---

## Flujo wizard

1. Form: CEDIS origen, fecha, chofer, camión, notas, OV `Surtida` del mismo almacén.
2. **Vista previa** → `POST /preview`.
3. Completar ubicaciones faltantes (CEDIS y/o clientes) sin salir del wizard.
4. Re-preview hasta `missing_location_count === 0` (ideal) o permitir crear con aviso.
5. **Crear envío** → `POST /` con el mismo body (el back vuelve a ordenar por distancia).
6. OV pasan a `En Camino`.

### Create body

```json
{
  "shipping_date": "2026-07-29",
  "driver_id": "uuid-user",
  "truck_id": "uuid-truck",
  "origin_warehouse_id": "uuid-warehouse",
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

Solo OV con `general_status = Surtida` del mismo almacén. Al crear/agregar → `En Camino`. Al cancelar envío → `Surtida`.

## Distancia

Haversine (línea recta), no Google Directions. Suficiente para ordenar y estimar km en MVP.
