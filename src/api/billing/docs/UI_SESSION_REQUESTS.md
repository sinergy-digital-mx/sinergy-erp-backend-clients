# Solicitudes de esta conversación

Fecha: 2026-10-09.

Tabla viva. Cada pedido nuevo se agrega aquí con fecha.

| # | Fecha | Pedido | Dónde quedó |
|---|-------|--------|-------------|
| 1 | 2026-10-09 | Al crear cliente, Cancelar o la X del aviso de duplicados no debe crear el registro. | El diálogo cierra sin resultado. Solo **Continuar de todos modos** crea. Misma corrección en el aviso de proveedores. `src/app/features/customers/docs/UI_CUSTOMER_DUPLICATES.md`. |
| 2 | 2026-10-09 | Quitar IEPS de órdenes de compra, órdenes de venta y cotizaciones, pero que sea configurable por razón social. Otros clientes sí pueden tenerlo. Esta organización de madería no. | Tab **Impuestos y transferencias** en la razón social: **IEPS habilitado**. La migración lo deja apagado en madería y encendido en el resto. Si está apagado, el campo no se muestra y el porcentaje se guarda en 0. Ver `UI_FISCAL_TAX_TRANSFERS.md`. |
| 3 | 2026-10-09 | IVA también configurable por razón social: unos solo IVA, otros IVA e IEPS. | Mismo tab: **IVA habilitado**. En madería queda encendido. |
| 4 | 2026-10-09 | Transferencias solo de la misma razón social a la misma razón social, configurable. Nombre: transferencias multi razón social habilitado. | Mismo tab: **Transferencias multi razón social habilitadas**. Apagado = el destino solo ofrece almacenes de la razón origen. La migración lo apaga en madería y lo deja encendido en el resto. Ver `src/api/inventory/docs/UI_INVENTORY_TRANSFERS.md`. |
| 5 | 2026-10-09 | Doble ingreso de mercancía. Una orden ya recibida y cerrada puede traer después otros productos, o haberse recibido menos de lo solicitado. Hay que reabrir, agregar productos y recibir de nuevo sin borrar los lotes ya ingresados. | En el detalle de una orden `Recibida`: **Reabrir para agregar productos**. Luego se agregan líneas nuevas y se recibe. **Cerrar ingreso** vuelve a `Recibida` si no hay un ingreso nuevo. Los lotes anteriores se conservan. Ver `src/api/purchase-orders/docs/UI_PURCHASE_ORDER_REVERSAL.md`. |
| 6 | 2026-10-09 | El PDF de orden de compra y de venta se sale del margen. El nombre del producto se parte palabra por palabra. | Montos del PDF como `$4,320.00`. La moneda queda en la etiqueta `TOTAL (MXN)`. Columnas y márgenes internos más angostos para que la tabla quepa en la hoja. La cotización usa el mismo PDF de venta. |
| 7 | 2026-10-09 | MXN sigue saliendo abajo del total en la tabla de la orden de compra. | El pie de la tabla de productos ya no pinta la etiqueta de moneda junto al importe. En el resumen lateral el monto y MXN quedan en la misma línea. |
