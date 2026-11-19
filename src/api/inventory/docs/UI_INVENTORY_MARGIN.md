# UI — Margen de inventario

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

Columna **Margen**, a la derecha de Disponible. También en cada lote expandido.

| Qué se ve | De dónde |
|-----------|----------|
| % y monto | `(precio − costo) / precio` |
| Precio | Primera lista activa, la misma de las cards |
| Costo | El del lote, o el promedio de los lotes en el renglón de arriba |
| Badge | `Compra`, `Configuración`, `Mixto` o `Sin costo` |

El badge es el origen. El tooltip (`hint`) dice cuántos lotes entraron. Mixto = unos lotes de compra y otros de configuración.

Verde si el % es positivo, rojo si es negativo.

## Detalle del lote

Tab **Margen**, después de General.

Arriba: precio, costo y margen. Abajo, la frase de origen, la cuenta y los renglones que entraron o que quedaron fuera (`No entra`).

No se edita desde aquí.

## Producto

Tab **Margen** en editar producto, solo bienes.

Un bloque por unidad que tenga existencia. Si no hay lotes, un bloque con el costo configurado. Misma lectura que el lote: de dónde salió el número y qué no se usó.

Servicios no llevan el tab.
