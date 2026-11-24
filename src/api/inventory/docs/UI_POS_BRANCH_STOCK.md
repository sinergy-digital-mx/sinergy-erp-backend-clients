# UI — Existencias por sucursal en POS

## 2026-11-24 — Código exacto con !

En el buscador del POS, `1x12` también encuentra códigos que lo traen adentro, como `L21X120`. Si el texto termina en `!`, el número de pieza o el código externo tiene que coincidir completo: `1x12!` solo deja `1X12`.

El hover del buscador lo indica: «Pon ! al final para buscar el código exacto. Ejemplo: 1x12!». La vista de todas las sucursales, vacía, dice lo mismo. Sirve en las tres vistas del catálogo porque es el mismo campo.

## 2026-11-23 — Tercera vista del catálogo

En la barra del catálogo de POS Ventas siguen las tres vistas, con la misma búsqueda:

| Ícono | Vista |
| --- | --- |
| Tarjetas | Catálogo en cards |
| Lista | Lista de la sucursal que se está consultando |
| Bodega | Tabla de todas las sucursales |

La tabla usa el texto del buscador de siempre. No abre otra pantalla ni otro campo de búsqueda. Columnas: producto, número de pieza, sucursal, existencia y unidad. Va ordenada por existencia, de mayor a menor. En cero también sale. No muestra costo, costo promedio, costo total, mínimo ni máximo.

El selector de sucursal de la barra es el select normal, sin texto encima.

`GET /tenant/inventory/pos/branch-stock?search=`

Permiso: `inventory:read`.

| Campo | Uso |
| --- | --- |
| `search` | Obligatorio. El mismo texto del buscador. Máximo 12 productos. |
| `branches[]` | Sucursales activas: `id`, `name`, `city`. |
| `products[].branches[]` | Una cantidad por sucursal. `0.000` si no hay. |
| `has_more` | Hay más coincidencias. Hay que afinar la búsqueda. |

Sin texto, no se llama. La vista pide escribir en la búsqueda.

## 2026-11-23 — Consulta desde Ventas

Primera versión: botón Existencias y panel aparte. Quedó reemplazada por la tercera vista del catálogo.
