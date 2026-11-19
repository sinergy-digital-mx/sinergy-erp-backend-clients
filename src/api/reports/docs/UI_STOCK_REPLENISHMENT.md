# UI — Reporte de requerimiento

**Fecha:** 2026-11-03

Módulo de requerimiento de compra. Solo está habilitado para Madereria Zona Norte. El menú se llama **Reporte de requerimiento** y abre las existencias por proveedor, con mínimos y máximos calculados desde las ventas.

---

## 1. Menú

- Etiqueta: **Reporte de requerimiento**
- Ruta: `/reporte-requerimiento`
- Permiso de menú: `stock_reports:ViewMenu`
- Permiso de consulta: `stock_reports:Read`
- Solo se muestra si la organización es Madereria Zona Norte.

Hay que correr la migración `1795400000000-seed-reports-module` para crear el módulo, prenderlo en esa organización y dárselo al rol Admin.

---

## 2. Pantalla

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Reporte de requerimiento                                                │
│  Existencias por proveedor · requerimiento de compra                     │
│                                                                          │
│  Razón social ▼          Buscar código o producto                        │
│  Ventas: 30  60  90      Cubrir: 15  30  45  60      Solo por comprar    │
│                                                                          │
│  Productos   Por comprar   Inversión   Venta potencial   Utilidad        │
│                                                                          │
│  Código | Producto |  CENTRO                 | NORTE            | Precio │
│                     | Existencia Venta Dif.  | Existencia ...   | prom.  │
│  ...                                                                     │
│  Totales                                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

- El proveedor se elige por **razón social**. Trae los productos activos ligados a ese proveedor.
- Código y nombre van en la misma columna, **Producto**.
- Al pasar el mouse, los días de venta, los días a cubrir, los badges del producto y las tarjetas explican qué son y cómo se calculan.
- Cada sucursal es un grupo de columnas, como en Excel: **Existencia**, **Venta**, **Diferencia**.
- Diferencia = existencia − venta del periodo. Negativo: en el periodo se vendió más de lo que hay hoy.
- **Precio promedio**: promedio ponderado de lo vendido en el periodo. Si no hubo ventas, usa el precio de lista de la unidad base.
- **Utilidad**: monto y porcentaje en la misma celda. Utilidad = precio promedio − costo del proveedor (en MXN). Si el costo está en USD, se convierte con el tipo de cambio del día.
- **Mínimo** y **máximo**: el piso de seguridad y el objetivo de inventario.
- **Recomendado**: cantidad sugerida. No se edita.
- **A comprar**: el mismo número, ya escrito en el campo, y se puede cambiar. Los totales de abajo usan lo que quedó en ese campo.
- **Restaurar recomendaciones** vuelve a poner la cantidad sugerida.
- El engrane **Sucursales** elige qué columnas se ven. La primera vez se ocultan las que dicen CEDIS. La elección queda guardada en el navegador. Ocultar una sucursal no cambia la cantidad recomendada.
- **Excel** descarga lo que está en pantalla: sucursales visibles, filtro de producto y la cantidad de **Comprar**, aunque se haya editado.

Los productos se ordenan con lo agotado y lo que hay que reponer primero.

---

## 3. Cómo se recomienda la compra

Ventas tomadas de órdenes **Surtida** del periodo (30, 60 o 90 días; 30 por defecto). La existencia es la suma de lotes disponibles por sucursal.

- Venta diaria = unidades vendidas ÷ días del periodo.
- Se compara con el periodo anterior del mismo largo. Si vendió más o menos, la venta diaria se ajusta entre **75%** y **150%**.
- Días de seguridad = 25% de los días a cubrir (en 30 días, son 8).
- Mínimo = venta diaria ajustada × días de seguridad.
- Máximo = venta diaria ajustada × días a cubrir (15, 30, 45 o 60; 30 por defecto).
- Recomendado = máximo − existencia, cuando hubo ventas y la existencia está debajo del máximo.
- Sin ventas no se recomienda comprar.
- Si una sucursal está corta pero el total de la empresa alcanza, el producto se marca **Traspasar**.

La recomendación es de todo el proveedor, no de una sola sucursal: la compra se le hace una vez.

---

## 4. Totales

Se recalculan al editar **A comprar**.

- Cantidad a comprar
- Inversión estimada = cantidad × costo
- Venta potencial = cantidad × precio promedio
- Utilidad potencial = cantidad × utilidad unitaria
- Margen = utilidad potencial ÷ venta potencial

Las tarjetas de arriba son del proveedor completo. El pie de la hoja, si hay filtro, suma solo lo que se está viendo.

---

## 5. Endpoints

```
GET /api/tenant/reporte-requerimiento/vendors
GET /api/tenant/reporte-requerimiento?vendor_id=&period_days=30&cover_days=30
```

`period_days`: 30 | 60 | 90.  
`cover_days`: 15 | 30 | 45 | 60.

Permiso: `stock_reports:Read`.

---

## 6. Historial

| Fecha | Cambio |
| --- | --- |
| 2026-11-03 | Alta del módulo para Madereria y del reporte de existencias por proveedor, con pronóstico de compra editable y utilidad. |
| 2026-11-03 | El menú y las rutas del frontend y del API pasan a llamarse Reporte de requerimiento (`/reporte-requerimiento`). |
| 2026-11-03 | La hoja se compactó. Un engrane elige las sucursales (CEDIS ocultos al inicio) y el botón Excel descarga esa vista. |
| 2026-11-03 | Código y nombre quedan en la columna Producto. Los chips, badges y tarjetas explican su cálculo al pasar el mouse. |
