# UI — Catálogo de productos al crear / editar OC

El modal **Agregar producto** no se limita a productos que ya tienen costo de ese proveedor.

## Endpoint

```
GET /api/tenant/vendors/:vendorId/products
```

| Param | Default | Uso |
|---|---|---|
| `search` | — | Nombre / SKU / SKU externo. Si viene, no hace falta devolver todo el catálogo. |
| `include_without_cost` | `true` | Incluir productos activos **sin** costo de este proveedor. |
| `only_with_cost` | — | `true` = comportamiento anterior (solo con costo). Gana sobre `include_without_cost`. |

Solo productos **activos** del catálogo. No filtra por “tuvo OC alguna vez”.

## Respuesta

Sin costo (combo UOM del producto; `currency` es `null`. **Sí se puede agregar** a la OC: el usuario captura costo + moneda y al crear la OC se guarda el costo de proveedor. Ver `UI_PURCHASE_ORDER_CURRENCY.md`):

```json
{
  "product_id": "uuid",
  "product_name": "ENCINO 1X6",
  "product_sku": "ENC16",
  "sku": "ENC16",
  "has_vendor_cost": false,
  "uoms": [
    {
      "product_uom_id": "uuid",
      "uom_id": "uuid",
      "uom_name": "Pieza",
      "factor": 1,
      "is_base": true,
      "cost": 0,
      "iva_percentage": 0,
      "ieps_percentage": 0,
      "iva_unit_total": 0,
      "ieps_unit_total": 0,
      "subtotal": 0,
      "currency": null
    }
  ]
}
```

Con costo:

```json
{
  "product_id": "uuid",
  "product_name": "1/2 LITRO TITEBOND II",
  "product_sku": "12LPAT2",
  "sku": "12LPAT2",
  "has_vendor_cost": true,
  "uoms": [
    {
      "product_uom_id": "uuid",
      "uom_id": "uuid",
      "uom_name": "Pieza",
      "factor": 1,
      "is_base": true,
      "cost": 30,
      "iva_percentage": 0,
      "ieps_percentage": 0,
      "iva_unit_total": 0,
      "ieps_unit_total": 0,
      "subtotal": 30,
      "currency": "MXN"
    }
  ]
}
```

Reglas:

- `has_vendor_cost = true` solo si hay al menos un UOM con costo de **ese** proveedor.
- `uoms` son **todas** las UOM del producto (base primero). Si esa UOM no tiene costo del proveedor, `cost` / IVA / IEPS van en `0` y `currency` es `null`.
- `currency` de una UOM con costo: `MXN` o `USD`.
- Tras `POST /products/:id/vendor-costs` para ese proveedor, el siguiente GET trae `has_vendor_cost: true`, el costo y `currency` en la UOM correspondiente.
- `sku` y `product_sku` son el mismo valor (compatibilidad con el modal actual).

## Pollux

1. Elegir proveedor → un GET (sin `only_with_cost`).
2. Autocomplete: filtrar en cliente esa lista. Opcional: `GET /products?search=` para no bloquear.
3. Combo **UOM**: `product.uoms[]` (`uom_id` / `uom_name`). Siempre las del producto, haya o no costo.
4. Si `has_vendor_cost === false` o `uom.currency === null`: badge “Sin costo de proveedor”. **Sí se puede agregar**: el usuario pone costo, IVA, IEPS y moneda (MXN/USD). Al crear la OC el backend guarda esa configuración.
5. Si `uom.currency` tiene valor: prellenar costo/IVA/IEPS/moneda. No dejar cambiar la moneda en este modal.
6. **Ver producto / Configurar costo** → modal de producto, pestaña Costos (ahí sí se edita moneda).
7. Al cerrar: repetir `GET /vendors/:vendorId/products`.
8. No mezclar monedas en la misma OC. Ver `UI_PURCHASE_ORDER_CURRENCY.md`.

Crear OC exige `product_id`, `uom_id`, `unit_total` y debe mandar `payment_currency` + `line_items[].currency`.
