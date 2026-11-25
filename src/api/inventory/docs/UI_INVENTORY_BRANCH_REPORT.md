# UI — Inventario por sucursal

## 2026-11-25 — Código exacto con !

El buscador de Por sucursal usa la misma regla que POS: `1x12!` deja solo el SKU o el código externo exacto. El hover del campo lo indica.

## 2026-11-25 — Costo con permiso

Costo promedio y costo total solo salen con `inventory:ViewMargin`. Sin el permiso la ficha muestra la existencia.

## 2026-11-24 — Orden de sucursales

En el engrane, el filtro y los botones Todas / Ninguna van a la misma altura. Cada sucursal se arrastra por el asa. El orden en que quedan las activas es el orden de la ficha. `branch_ids` se guarda en ese orden.

## 2026-11-24 — Ficha más baja

En Por sucursal el nombre de la sucursal, la ciudad y los números de existencia y costo van al tamaño de Totalizado. Cada renglón ocupa menos alto para ver más sucursales sin bajar tanto.

## 2026-11-24 — Búsqueda de arriba

Al entrar a Por sucursal, el buscador toma el texto que ya estaba en Por lotes o Totalizado (`search` de la URL) y muestra los productos.

## 2026-11-24 — Sin aviso de unidades

En la ficha ya no sale el texto «Cada unidad va en su renglón. No se suman entre sí.». Con varias unidades siguen sin sumarse los tres totales; cada unidad queda en su renglón.

## 2026-11-24 — Ficha por sucursal

La ficha agrupa las unidades de una misma sucursal. Si hay varias unidades, no salen los tres totales en guion: cada unidad queda en su renglón. Las sucursales en cero se ven más tenues.

## 2026-11-24 — Buscador sin ícono

En Por sucursal el campo de búsqueda no lleva lupa. El placeholder queda separado del borde.

## 2026-11-24 — Reporte de un producto

En Inventario, junto a Por lotes y Totalizado, está **Por sucursal**.

Sirve para una sola pieza. Hay que buscarla por nombre, SKU o SKU externo y elegirla. Sin producto no hay lista.

La ficha muestra existencia, costo promedio y costo total de las sucursales activas, también las que están en cero. El costo unitario es el mismo de Totalizado: costo final de la compra en pesos o, si el lote no lo tiene, el costo configurado. El promedio se pondera con la existencia. Si una parte no tiene costo, el total solo suma los lotes que sí lo tienen.

Si el producto tiene existencia en dos unidades, no se suman. Cada unidad sale en su renglón.

El engrane elige qué sucursales aparecen. La selección se guarda y la ven todos los que entran a Inventario. Sin guardar, salen todas las sucursales activas. Permiso: `inventory:Read`, el mismo de Totalizado.

| Método | Uso |
| --- | --- |
| `GET /tenant/inventory/branch-report/products?search=` | Hasta 10 productos |
| `GET /tenant/inventory/branch-report?product_id=` | Ficha de esa pieza |
| `GET /tenant/inventory/branch-report/settings` | Sucursales y cuáles están activas |
| `PUT /tenant/inventory/branch-report/settings` | `{ branch_ids: [] }`. Al menos una. El orden del arreglo es el orden de la ficha |

Mínimo y máximo por sucursal no están en el inventario, así que el reporte no los muestra.
