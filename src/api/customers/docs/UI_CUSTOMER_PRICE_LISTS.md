# UI — Listas de precio del cliente

## 2026-11-04

En el detalle del cliente, tab **Listas de precio**, se habilitan una o varias listas. Una queda como predeterminada. Al elegir ese cliente en una orden o cotización nueva, la lista predeterminada se selecciona sola.

### Tab

Ruta: `/customers/detail/:id` — tab `price-lists`.

- El catálogo sale de `GET /api/tenant/price-lists`. Solo se pueden marcar listas activas.
- Las asignadas salen de `GET /api/tenant/customers/:id/price-lists`.
- Guardar reemplaza el conjunto con `PUT /api/tenant/customers/:id/price-lists`.

```json
{
  "price_lists": [
    { "price_list_id": "uuid", "is_default": true },
    { "price_list_id": "uuid", "is_default": false }
  ]
}
```

Lista vacía quita las asignaciones. Si hay filas y ninguna viene marcada, la primera queda como predeterminada. Si llegan dos marcadas, se conserva la primera.

### Respuesta

```json
{
  "price_lists": [
    {
      "id": "uuid",
      "price_list_id": "uuid",
      "name": "Mayoreo",
      "is_default": true,
      "is_active": true
    }
  ]
}
```

### Orden de venta y cotización

Al seleccionar el cliente se consultan sus listas.

- Si no tiene ninguna, el renglón sigue con todas las listas del producto y el precio sugerido.
- Si tiene alguna, el selector Lista muestra solo esas. Si el producto trae la predeterminada, queda elegida y se aplican su precio, IVA e IEPS.
- Si el producto no tiene precio en esas listas, queda en Sugerido.
- Al editar una cotización no se reescriben los precios ya guardados. Un producto nuevo sí usa la predeterminada.
