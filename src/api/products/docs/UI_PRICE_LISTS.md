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
