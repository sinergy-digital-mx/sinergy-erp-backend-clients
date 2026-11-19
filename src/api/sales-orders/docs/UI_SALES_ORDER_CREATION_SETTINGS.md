# UI — Configuración del alta de órdenes de venta

## 2026-11-18 — Fecha de entrega

El valor por defecto de la fecha de entrega y de la fecha tentativa puede ser `today` o un día `YYYY-MM-DD`. En configuración se elige Hoy o Fecha fija. Si ya había un día guardado, se muestra esa fecha.

## 2026-11-13 — Envío, fecha tentativa y ruta

`for_shipping` es la bandera de **Requiere envío** (`requires_shipping` repite el mismo valor). Si está apagada, `estimated_delivery_date` se guarda en null y no se exige. La ruta (`route_id`) solo se pide si el catálogo de rutas está activo y el campo está visible; por defecto también solo cuando hay envío.

Al elegir cliente, el alta y POS Ventas preseleccionan `default_route_id`. Se puede asignar otra ruta a la orden sin cambiar la del cliente, o guardarla como habitual desde el mismo selector.

El detalle muestra mostrador o envío, la ruta y la fecha tentativa. La ruta se puede cambiar mientras la orden no esté cancelada ni en camino.

Catálogo: `GET/POST/PUT/DELETE /tenant/logistics-routes`. Se enciende con `routes_enabled` en `PUT /tenant/sales-orders/creation-settings`. Ruta del cliente: `PUT /tenant/customers/:id/default-route`.

## 2026-11-12 — Campos por organización

Cada organización define cómo se abre **Crear orden de venta**. Sin fila guardada, el alta sigue igual: todo visible, sucursal y fecha obligatorias, mesa de control y envío apagados.

Cliente y razón social no se pueden ocultar ni dejar opcionales. La razón social se preselecciona con la de la sucursal principal del usuario. Si la sucursal está oculta, o la razón social solo tiene una, el campo no se muestra y la orden lleva esa sucursal.

Mesa de control y Para envío son interruptores. Si se ocultan, el alta usa el valor por defecto y no los muestra.

### Lectura

`GET /tenant/sales-orders/creation-settings`

```json
{
  "fields": {
    "billing_branch_id": {
      "visible": false,
      "required": false,
      "default_value": "user_primary",
      "locked": false
    },
    "requires_selection_assembly": {
      "visible": true,
      "required": false,
      "default_value": true,
      "locked": false
    }
  }
}
```

Las claves que falten se completan con el comportamiento actual.

### Escritura

`PUT /tenant/sales-orders/creation-settings` con permiso `sales_orders:Update`.

```json
{ "fields": { "for_shipping": { "visible": false, "default_value": false } } }
```

Cliente y razón social se guardan siempre visibles y obligatorios. Si la sucursal queda visible, sigue siendo obligatoria.

Pantalla: **Configuración → Órdenes de venta** (`/settings/sales-order-creation`).

### Alta

El modal lee esta configuración al abrirse. Si el cliente no manda sucursal y el campo está oculto o solo hay una sucursal de esa razón social, el backend asigna la sucursal principal del usuario (o la única). La fecha, si no viene y no es obligatoria, nace en el día de operación.
