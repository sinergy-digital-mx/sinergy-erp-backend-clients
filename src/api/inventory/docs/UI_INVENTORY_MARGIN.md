# UI — Margen de inventario

## 2026-11-25 — Columnas de costo

El mismo permiso `inventory:ViewMargin` oculta las columnas de costo que seguían a la vista:

- Orden de compra: columna **COSTO**. El importe de la línea sigue.
- Lotes de la orden: **Costo**, **Real USD**, **Real MXN** e **Importe**. El API deja esos campos en null.
- Recibo: el dato **Costo unit.**
- Excel de detalle: la columna **Total unit.**
- Producto: el tab **Costos de Proveedor**. El API de costos de proveedor responde 403.
- Lote: la tarjeta de costos, incluido **Costo real**, solo con este permiso y, para el costo real, también `purchase_order_real_cost:Read`.

Al agregar o editar la línea, el campo de costo unitario sigue en el formulario para guardar la compra.

## 2026-11-25 — Permiso ViewMargin

Precio, costo y margen del inventario solo se ven con `inventory:ViewMargin`. Sin ese permiso no se pintan y el API no los entrega.

Dónde se oculta: columnas Precio, Costo y Margen de Totalizado, tab Margen del lote, tab Margen del producto, cards de costo, precio y margen, costo de Por sucursal, y columnas de dinero del reporte de existencia. El Excel de esos reportes tampoco lleva esas columnas.

El permiso se asigna en Roles. En la maderería lo tiene el rol Direccion. Los roles administrador de las otras empresas también lo reciben. Un operador no lo ve hasta que se lo marquen.

Quitar el permiso en Roles lo oculta, también en Direccion. Hay que recargar la sesión (`permissions_version`).

## 2026-11-23 — Recarga al cerrar el producto

Si desde un lote se guarda un precio o un costo y se cierran las ventanas, Totalizado y Por lotes vuelven a cargar esa página. Cerrar sin guardar no recarga.

## 2026-11-03 — Lista, lote y producto

El margen es unitario y en pesos. Cada lote elige un solo costo:

1. Costo final de su compra, si la orden lo tiene (`real_unit_cost_mxn`, ya en la unidad del inventario).
2. Si no, el costo de proveedor de esa compra. En dólares se pasa a pesos con el tipo de cambio de la orden. Si falta el tipo de cambio, esa compra no se usa.
3. Si no hay compra usable, el promedio de los costos de proveedor configurados en pesos para la misma unidad. Los costos en dólares no entran.

El renglón del producto en Totalizado es el **promedio simple** de los lotes con existencia de ese almacén. Un lote sin costo no entra al promedio.

`GET /tenant/inventory/summary` trae `margin` en el producto y en cada lote.

`GET /tenant/inventory/batches/:id` trae `margin_detail`.

`GET /tenant/inventory/products/:productId/margin` trae el promedio de todo el producto. Si no hay existencia, el costo de referencia es el configurado. Permiso: `inventory:Read`.

---

## Totalizado

### 2026-11-24 — Menú de la fila

Un clic normal en la fila (cualquier columna, salvo el botón de lotes) abre un menú en el cursor:

1. **Configuración de producto**: abre el producto.
2. **Expandir lotes** / **Ocultar lotes**: muestra u oculta los lotes de esa fila.

El botón de la columna Lotes sigue abriendo y cerrando directo. Escape, scroll o un clic afuera cierran el menú.

Columnas cortas, en este orden: **Disponible**, **Precio**, **Costo**, **Margen**. También en cada lote expandido.

La unidad ya no es una columna a la izquierda. Va pegada a la derecha de la cantidad (`1,250 PT`). El desglose por medida va debajo, en el mismo par cantidad + medida.

| Qué se ve | De dónde |
|-----------|----------|
| Margen % | `(precio − costo) / precio`. No es un porcentaje de la existencia |
| Monto del margen | Solo en el tooltip, junto al `hint` |
| Precio | Columna propia. Lista marcada para márgenes; si ese producto no tiene precio ahí, la lista activa más antigua. La misma de las cards |
| Costo | Columna propia. El del lote, o el promedio de los lotes en el renglón de arriba |
| Origen | Ícono de información. Al pasar el mouse: `Compra`, `Configuración`, `Mixto` o `Sin costo`, más el `hint` |

El tooltip dice cuántos lotes entraron. Mixto = unos lotes de compra y otros de configuración.

Verde si el % es positivo, rojo si es negativo.

### 2026-11-20

Precio y costo salieron de la columna Margen. El % queda solo, para que la fila no se estire.

Los encabezados van en caja normal, como el listado de órdenes de compra: gris `#374151`, 12px, sin mayúsculas. Precio y costo usan el mismo monto y la pastilla `MXN`.

Producto, sucursal y razón social van a 12px y 11px, aunque el texto esté en mayúsculas. La unidad de disponible es una pastilla de 16px. El origen del margen no se escribe en la fila: un ícono de información abre el tooltip del sistema al pasar el mouse. La cantidad de lotes y el botón de verlos son el mismo control. La fecha del lote sale humana y corta, `Ago 18 26`, en 11px.

El precio de la fila es el de la lista marcada con `is_margin_default`. El costo no cambia: sigue siendo la compra y, si no hay compra usable, la configuración. Si no hay lista marcada, o el producto no tiene precio en esa lista, el precio sigue siendo el de la lista activa más antigua. Punto de venta no usa esa marca.

## Detalle del lote

Tab **Margen**, después de General.

Arriba: precio, costo y margen. Abajo, la frase de origen, la cuenta y los renglones que entraron o que quedaron fuera (`No entra`).

No se edita desde aquí.

## Producto

Tab **Margen** en editar producto, solo bienes.

Un bloque por unidad que tenga existencia. Si no hay lotes, un bloque con el costo configurado. Misma lectura que el lote: de dónde salió el número y qué no se usó.

Servicios no llevan el tab.
