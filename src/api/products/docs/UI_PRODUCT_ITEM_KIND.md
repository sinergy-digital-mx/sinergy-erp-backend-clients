# UI — Tipo de catálogo: producto o servicio

Contrato para Pollux. El catálogo (`products`) distingue mercancía de servicio. No hay flag por empresa: cualquier organización puede dar de alta ambos.

## Campo

| API | Valores | Default |
|-----|---------|---------|
| `item_kind` | `goods` · `service` | `goods` |

Los renglones existentes quedan `goods` tras la migración.

`sat_clave` (alias `sat_code`) sigue igual. En servicio usar clave SAT de servicio (ej. `81111810`). No hay catálogo SAT oficial: se captura a mano.

## Alta / edición

`POST /api/tenant/products` y `PATCH /api/tenant/products/:id`

- `item_kind` opcional; si se omite, `goods`.
- En servicio el SKU puede omitirse: el API genera `SRV-…`.
- `base_uom_catalog_id` (alias `base_uom_id`) opcional: si viene, crea la UOM base en la misma transacción. Obligatorio en el alta rápida desde OV.

Modal **Crear / Editar producto**:

- Selector **Tipo**: Producto | Servicio
- **Descripción** (texto). En servicio se muestra en el picker y en el renglón de la OV.
- Placeholder SAT: producto `01010101`, servicio `81111810`
- En servicio el SKU no es obligatorio

## Listado

`GET /api/tenant/products?item_kind=goods|service`

Filtro en catálogo: **Todos / Productos / Servicios**. Columna **Tipo**.

`GET /api/tenant/products/export/excel` acepta el mismo `item_kind`.

## Inventario y POS

Los pickers de stock (`products-summary` de inventario, POS, OC) solo listan `item_kind=goods`. Un servicio no aparece como existencia y no se surte.
