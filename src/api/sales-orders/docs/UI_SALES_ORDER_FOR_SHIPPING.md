# UI — Orden marcada para envío

**2026-11-02.** Bandera `for_shipping` en la orden de venta. Solo la señala como para envío. No crea la ruta ni la mete en un envío.

## Alta

Checkbox **Para envío** en:

- Modal **Crear Orden de Venta** (listado de órdenes y alta desde cliente).
- Formulario de página `/sales-orders/create`.
- Punto de venta, al confirmar **Registrar venta** o **Enviar a caja**.

Body del `POST /api/tenant/sales-orders`:

```json
{ "for_shipping": true }
```

Si no se envía, queda `false`. En POS también se puede mandar al reemplazar el carrito de un ticket regresado (`PUT /api/tenant/pos/sales/:id/cart`).

## Después

Si no se marcó al crear, se puede poner o quitar en:

- Detalle de la orden, tarjeta **Envío** del panel izquierdo.
- POS Caja, en la orden de la lista izquierda (por cobrar y cobradas).

```
PATCH /api/tenant/sales-orders/:id/for-shipping
```

```json
{ "for_shipping": true }
```

Cualquier estado excepto **Cancelada**. Responde la orden.

La orden sigue igual: no cambia `general_status` ni aparece sola en logística. Más adelante se podrá tomar de las marcadas para armar el envío.
