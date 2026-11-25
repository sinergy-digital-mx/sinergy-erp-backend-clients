# UI — Factura público en general

Pestaña **Factura público en general** en Caja y cuentas. Una factura CFDI 4.0 a público en general por mes y sucursal, con las órdenes de clientes que todavía no tienen factura.

## Historial

### 2026-11-25
El menú de esta pantalla se llama **Caja y cuentas**.

En la columna Cliente solo se ve el cliente (y la empresa, si el nombre es distinto). La sucursal ya está en el filtro de arriba, así que no se repite en cada fila.

La moneda de la orden (MXN o USD) va en su columna, a la izquierda de Total.

### 2026-11-09
El botón **Información** abre un modal chico. Se cierra con la X, el fondo o Escape.

La fila de la orden abre el modal de la orden de venta. La casilla no lo abre.

### 2026-11-08
En la pestaña hay un botón **Información**. Explica que la factura lleva todas las órdenes de la sucursal que el cliente no facturó, que queda arriba, y que se puede cancelar y generar otra.

El mes de las órdenes usa la zona horaria de la razón social. Si no tiene, sigue siendo America/Tijuana. El filtro de sucursal no cambió.

En la razón social, pestaña **Público en general**, sección **Facturas a público en general**:

- Zona horaria
- Hora de cierre (en punto, 0–23). Si se enciende el automático o el bloqueo y no hay hora, quedan las 9:00
- **Timbrar automáticamente el último día del mes**. Desde esa hora, y mientras siga siendo el último día, el sistema timbra por sucursal las órdenes del mes que sigan sin factura. Si todavía no hay, sigue revisando ese día. Si la sucursal ya tiene una vigente, no la repite. Si falla, reintenta ese mismo día. En las notas de esas órdenes queda `Factura a público en general automática. Folio del proceso: FAPG-AAAAMMDD-NN`. El mismo folio se ve en la tarjeta de la factura
- **No permitir facturar órdenes después del mes de la orden**. A partir de esa hora del último día del mes de la orden, no se puede facturar por separado ni desde la orden ni en el portal. La factura a público en general sí se puede generar, cancelar y volver a generar

Las dos opciones nacen apagadas. Cada razón social elige la suya.

### 2026-11-03
Si la URL de Cobranza trae `billing_branch_id`, la pestaña abre con esa sucursal y no la borra al salir.

La pestaña fallaba con error del servidor porque la tabla `global_invoices` no tenía `billing_branch_id`. Se aplicó la migración `GlobalInvoiceByBranch1795300000000`.

La pestaña se llama **Factura público en general**. En la pantalla, los avisos y la confirmación de cancelar usan el mismo nombre.

La factura es por sucursal, también al generarla. El selector es la sucursal (la de Cobranza, si ya venía elegida). Lista y timbra solo las órdenes de esa sucursal en el mes. Una vigente por sucursal. El lugar de expedición es el código postal de esa sucursal. Si la razón social tiene varias sucursales, cada una lleva su folio para no repetirlo. `billing_branch_id` en el GET y en el POST.

Primera versión. Selector de mes, lista con el folio de la orden, fecha, cliente, estado, totales y pago. Si el pago es mixto se ven las dos formas y sus importes. El botón **Generar facturas** timbra todas las órdenes sin facturar de ese mes en un solo CFDI. Solo puede haber una vigente. Se puede abrir el PDF y cancelarla. Si el SAT la cancela, las órdenes vuelven a la lista y se puede timbrar otra.

El botón **Información** explica que son las órdenes de la sucursal que el cliente no facturó y que la factura se emite con todas.

## Quién la ve

Quien abre Cobranza (`Accounting:Read`).

Timbrar pide también `electronic_invoices:Stamp`. Cancelar pide `electronic_invoices:Cancel`. El PDF pide `electronic_invoices:Read`. Sin permiso de timbrar el botón queda deshabilitado.

## Pantalla

La pestaña no usa el periodo de las otras. Trae su propio mes (`AAAA-MM`) y la sucursal. El mes es el calendario de la zona horaria de la razón social; si no tiene, America/Tijuana. Si Cobranza ya tenía sucursal en la URL (`billing_branch_id`), abre con esa y al salir la deja en la URL. El emisor del CFDI es la razón social de la sucursal. El botón **Información** abre un modal con el cierre del mes.

Cada fila es una orden de venta que no está cancelada y no tiene CFDI de ingreso vigente (ni factura propia ni factura a público en general vigente). Muestra:

- Folio, el mismo badge de órdenes de venta. La fila abre el modal de esa orden
- Fecha de la orden
- Cliente (y la empresa, si el nombre es distinto). La sucursal no se repite: ya está en el filtro
- Estado
- Moneda de la orden (MXN o USD), a la izquierda del total
- Total, y debajo subtotal, descuento, IVA e IEPS cuando hay
- Pago: Pagado / Pendiente y la forma. En mixto, el desglose (`Efectivo + Tarjeta`) y el importe de cada una

Hay que dejar marcadas todas para generar. La factura es de todas las órdenes de esa lista, no de un subconjunto.

Si la sucursal ya tiene factura vigente en el mes, la lista es la de esa factura, sin casillas, y el botón no aparece. Se puede ver el PDF y cancelar. Otra sucursal del mismo mes puede generar la suya.

## API

`GET /api/tenant/accounting/global-invoices?month=2026-11&billing_branch_id=`

`POST /api/tenant/accounting/global-invoices`

```json
{
  "month": "2026-11",
  "billing_branch_id": "uuid",
  "order_ids": ["uuid"],
  "environment": "production"
}
```

`order_ids` tiene que ser exactamente las órdenes sin facturar de ese mes y esa sucursal. `environment` es `demo` en localhost y `production` en el resto, igual que el timbrado de una orden.

`POST /api/tenant/accounting/global-invoices/:id/cancel`

Cancela el CFDI con motivo 02. Si el SAT la deja en proceso, la factura sigue vigente y no se puede emitir otra. Cuando queda cancelada, `active_key` se libera y las órdenes vuelven a salir.

## Comprobante

Receptor: RFC `XAXX010101000`, nombre `PUBLICO EN GENERAL`, uso `S01`, régimen `616`, domicilio fiscal igual al lugar de expedición.

`InformacionGlobal`: periodicidad `04` (mensual), mes `01`–`12`, año del selector.

Cada partida lleva el folio de la orden en `NoIdentificacion` y en la descripción.

Una sola moneda. Si la sucursal mezcla pesos y dólares en el mes, no se timbra. En dólares, el tipo de cambio del comprobante es el de la orden más reciente.

La forma de pago es la de las órdenes cuando todas coinciden (efectivo 01, cheque 02, transferencia 03, tarjeta 04). Si hay varias, o alguna no está pagada, va `99`. Método `PUE` si todas están pagadas; si no, `PPD`.

El lugar de expedición es el código postal de la sucursal elegida.

Mientras la factura a público en general esté vigente, esa orden no se puede timbrar sola ni desde el portal de autofactura.
