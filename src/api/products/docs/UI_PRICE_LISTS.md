# UI — Listas de precio

## 2026-11-04

Cada lista puede llevar un número y un porcentaje de margen. Los dos son opcionales.

- El número no tiene que ir en orden ni ser consecutivo. Sirve para identificar la lista (`L1`, `L4`) en Actualización de precio.
- El margen se usa en esa hoja para proponer el precio sobre el costo promedio. Si queda vacío, la lista no se recalcula sola.

Se capturan en **Gestionar listas de precios** y al crear una lista desde el producto.

`POST /api/tenant/price-lists` y `PATCH /api/tenant/price-lists/:id`:

```json
{
  "name": "Mayoreo",
  "list_number": 1,
  "margin_percent": 18,
  "description": ""
}
```

`list_number` en `null` quita el número. `margin_percent` en `null` quita el margen.

## 2026-11-20 — Precio de los márgenes

Una lista puede marcarse como predeterminada de márgenes. Solo puede haber una.

Esa marca no cambia ventas, cotizaciones ni punto de venta. Solo dice qué precio usar en:

- Inventario totalizado: columna Precio y el margen de la fila y de cada lote.
- Margen del producto (`GET /tenant/inventory/products/:id/margin`) y el del detalle de lote.
- El valor de venta de las cards de inventario.
- El precio de venta que se guarda en movimientos de inventario nuevos.

Si el producto no tiene precio en esa lista, se usa la lista activa más antigua que sí tenga precio. Si ninguna está marcada, el comportamiento sigue igual: la lista activa más antigua.

Hoy, sin marca, el inventario no muestra la última lista creada. Muestra la primera que se creó y sigue activa.

Se marca en el detalle del producto, en Precios, y en **Gestionar listas de precios**. Al crear una lista desde el producto también se puede prender.

`is_margin_default: true` en `POST /api/tenant/price-lists` o `PATCH /api/tenant/price-lists/:id` apaga la marca de las demás. `false` la quita y los márgenes vuelven a la lista activa más antigua.
