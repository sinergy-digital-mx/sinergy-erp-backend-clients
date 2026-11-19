# UI — Actualización de precio

## 2026-11-04

Hoja para revisar el costo de las últimas compras y capturar precios de lista. El módulo `price_updates` queda prendido solo para la verdulería, en el rol Admin.

Menú: **Operación → Actualización de precio**. Ruta: `/price-updates`.

### Listas de precio

En **Gestionar listas de precios** cada lista tiene:

- **Número**: libre, no tiene que ser consecutivo. En la hoja se muestra como `L1`, `L3`, etc. Al pasar el cursor se ve el nombre completo y el margen.
- **Margen %**: opcional. Si está vacío, esa lista no se recalcula sola.

`POST` y `PATCH /api/tenant/price-lists` aceptan `list_number` (entero 1–9999 o `null`) y `margin_percent` (–100 a 999.99, dos decimales, o `null`).

### Hoja

`GET /api/tenant/price-updates?page=1&limit=40&search=`

- Incluye el catálogo completo, activos e inactivos, igual que Productos. Página de 40.
- Columna izquierda: código y nombre. Abajo, la unidad base.
- **C1** y **C2**: costo de las dos últimas órdenes de compra con estatus Recibida, convertido a la unidad base.
- **PC**: promedio de C1 y C2. Si solo hay una compra, ese costo es el promedio.
- Después, una columna por lista activa. Cada producto usa hasta dos unidades: la base a la izquierda y la siguiente a la derecha. El nombre de la unidad va dentro de la celda porque cambia por producto.

Los campos se ven como texto. Al hacer clic se vuelve input y al salir se guarda. No hay un input por celda.

Al cambiar C1, C2 o PC se recalculan las listas que tienen margen:

`precio = PC × (factor de la unidad / factor base) × (1 + margen / 100)`

Ese resultado se guarda en el precio de lista del producto. Un precio capturado a mano en una celda se conserva hasta que se vuelva a cambiar el costo. Si no coincide con el margen, la celda muestra un punto.

`PATCH /api/tenant/price-updates/products/:productId`

```json
{ "average_cost": 18.5 }
```

Recalcula las listas con margen. Para un precio suelto:

```json
{
  "prices": [
    { "price_list_id": "uuid", "product_uom_id": "uuid", "price": 24.5 }
  ]
}
```

C1 y C2 no se guardan: al recargar vuelven a salir de las compras. Los precios de lista sí quedan guardados.

Permisos: `price_updates:ViewMenu`, `price_updates:Read`, `price_updates:Update`.
