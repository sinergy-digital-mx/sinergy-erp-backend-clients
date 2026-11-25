# UI — Anticipo, cobro al convertir y reversas

## 2026-11-25 — Tickets y ambiente

Demo y Producción están en Anticipo y en Cotizar. Caja timbra con el que se eligió.

Cuando el anticipo ya se cobró, el folio aparece en **Tickets** de POS Ventas. Se abre, se agregan los productos (si ya venían, salen cargados) y **Registrar venta** crea la orden, la factura de productos y la nota de crédito. Si el total es mayor, la diferencia pasa a caja.

## 2026-11-25 — Textos del wizard

En punto de venta el diálogo pregunta **Sin productos** o **Con productos**. El monto va con IVA y se envía a caja. Al regresar, **Generar venta** pide los productos.

## 2026-11-25 — Wizard en punto de venta y en el detalle

El anticipo se pide desde POS Ventas, botón **Anticipo**, o desde el detalle de la cotización, **Pedir anticipo**. Las dos opciones mandan el monto con IVA a la caja de la sucursal. La factura se timbra al cobrar, siempre con el concepto «Anticipo del bien o servicio».

Sin productos: la cotización no lleva líneas. Con productos: guarda los del ticket, y la factura de anticipo sigue siendo el mismo concepto.

Cuando el anticipo ya está cobrado, **Generar venta** (Folios o el detalle) arma los productos, crea la orden y timbra la factura de mercancía con descuento, tipo de relación 07 y la nota de crédito. Si la venta es mayor, caja cobra la diferencia. Si es menor, no pasa.

Notas para la junta: [junta-anticipo-dos-casos-2026-11-25.pdf](junta-anticipo-dos-casos-2026-11-25.pdf).

Contrato para Pollux. La cotización sigue sin facturar la madera. Si la razón social tiene `advance_invoicing_enabled`, se puede timbrar un CFDI de anticipo. El cobro de la venta, cuando se convierte, entra al corte abierto de caja.

Interruptor: Configuración fiscal de la razón social, **Permitir factura de anticipo**.

## 2026-11-21 — Proceso para la maderería

El paso a paso para el equipo está en `proceso-factura-anticipo-madereria.pdf`, en esta misma carpeta. Cubre el anticipo desde POS Ventas, el cobro en caja, la diferencia al entregar y la aplicación del CFDI.

La diferencia se cobra en POS Caja, pestaña Por cobrar, sobre la orden. La pantalla muestra Total orden, Ya pagado y Por cobrar. El botón Confirmar cobro ya trae la diferencia. En efectivo se capturan los billetes o el monto manual. Si el anticipo cubrió el total, la orden queda pagada y no vuelve a caja.

## 2026-11-03 — El saldo fuera del anticipo usa crédito

Pedir un anticipo menor al total deja el resto en el crédito del cliente, en la razón social de la cotización. Hace falta crédito activo y disponible. Al editar la cotización, o la orden que salió de ella, ese saldo se ajusta. No se suma dos veces: abierta cuenta la cotización; convertida, la orden. En caja el anticipo muestra lo cobrado y lo pendiente. Cobranza POS y Puntos de venta traen las columnas Anticipo y Pendiente.

En el detalle de la cotización, tab **Instrucciones**, se explican los dos casos de operación.

## 2026-10-22 — RFC en caja y badge Anticipo

Si el catálogo tiene al cliente como física pero el RFC es de 12 (moral), el cobro ya no manda régimen 612. El RFC manda: 12 → 601, 13 → 612.

En POS Caja, el anticipo muestra badge **Anticipo**. En Cliente se ve RFC, razón, CP y régimen. **Editar RFC** abre la ficha fiscal. **Regresar a ventas** sigue en el header y en el aviso si los datos no cuadran. Caja puede cambiar de cliente; `collect-advance` guarda ese `customer_id` antes de timbrar.

## 2026-10-22 — Saldo en el detalle de la cotización

Cuando ya hay anticipo cobrado o CFDI vigente, el detalle (`GET /quotations/:id`) trae `amount_paid` y `amount_pending` en el header. En TOTALES se ve igual que en caja: **Total**, **Ya pagado**, **Por cobrar**. En Documentos, la tarjeta de la factura de anticipo también muestra lo pagado y lo que resta. No hay que convertir a venta para verlo.

## 2026-10-22 — Mixto al cobrar el anticipo en caja

`POST /api/tenant/pos/quotations/:id/collect-advance` admite `payment_method: "mixed"` con el mismo desglose de una venta. Crédito no. El corte guarda cada parte; solo el efectivo entra a caja. El CFDI se timbra con la forma de mayor importe (`01`/`02`/`03`/`04`), no con `99`, para poder seguir en PUE.

## 2026-10-22 — Regresar anticipo a ventas

Caja puede devolver el anticipo con el mismo botón **Regresar a ventas**. La COT sale de por cobrar (`pos_stage = ventas`) y aparece en Tickets de POS Ventas. Ahí se corrige y se pulsa **Enviar a caja**.

Si ya se timbró el CFDI, 400. Editar la cotización desde ERP mientras sigue en caja también 400: hay que regresarla primero.

## 2026-10-21 — Guardar cotización: ventana ancha, cliente editable y datos del CFDI

Verificado: el anticipo ya entra a caja. La cotización con `advance_requested_total` sale en `GET /api/tenant/pos/pending-sales` con `kind: "advance"` y caja la cobra con `collect-advance`. Lo que aparece como «Cobrada manual» es un pago capturado a mano en la orden (flujo anterior); el anticipo nuevo se registra como **Anticipo** en el corte.

En POS Ventas, **Guardar cotización** ahora es una ventana ancha:

- Izquierda: total, cliente (RFC, razón social y CP fiscal), observaciones. **Editar datos** abre la edición del cliente en la pestaña fiscal y recarga los datos sin salir del diálogo. **Cambiar** abre el selector de cliente.
- Derecha: **Factura de anticipo**. Monto con IVA, atajos 30 % / 50 % / Total, resumen (total, anticipo, pendiente), **Uso CFDI**, **Método de pago** (PUE o PPD) y régimen del receptor (solo lectura, sale del cliente).
- La forma de pago la define caja al cobrar (efectivo, tarjeta, transferencia, cheque o mixto).
- Con el anticipo encendido el botón dice **Guardar y mandar anticipo a caja** y sigue bloqueado mientras falten datos fiscales.

El CFDI se timbra solo cuando caja cobra, con el Uso CFDI y el método de pago capturados aquí. Si no se capturan: `G03` y `PUE`.

`POST /api/tenant/quotations` acepta, junto a `advance_amount`:

```json
{
  "advance_amount": 1000,
  "advance_uso_cfdi": "G03",
  "advance_metodo_pago": "PUE"
}
```

`pending-sales` (`kind: "advance"`) regresa `advance_uso_cfdi` y `advance_metodo_pago`. Migración: `1793200000000-add-quotation-advance-cfdi-preferences`.

## 2026-10-19 — Anticipo desde Guardar cotización y cobro en caja

En POS Ventas, **Guardar cotización** tiene la casilla **Factura de anticipo**.

- Si está apagada, la cotización se guarda como siempre.
- Si está encendida, se muestra si el cliente ya tiene RFC, razón social y código postal fiscal. Si falta algo, **Guardar cotización** queda deshabilitado.
- El monto se escribe. Puede ser parcial o el total de la cotización, siempre con IVA, y no puede pasar el total.
- Al guardar se manda `advance_amount` en `POST /api/tenant/quotations`. La cotización guarda `advance_requested_total`.

Esa cotización aparece en POS Caja, en la lista de por cobrar, junto a las órdenes. Trae `kind: "advance"`, el folio COT y `amount_pending` igual al anticipo. **Regresar a ventas** (`POST /pos/quotations/:id/return-to-sales`) la saca de caja; Ventas la ve en Tickets y la reenvía con `POST /pos/quotations/:id/send-to-caja`. Se cobra en efectivo, tarjeta, transferencia, cheque o mixto.

```
POST /api/tenant/pos/quotations/:id/collect-advance
```

El cuerpo es el mismo del cobro de una venta. Caja timbra el CFDI de anticipo (uso G03, PUE, régimen del cliente) y el dinero entra al corte abierto. Cuando el CFDI queda vigente, la COT sale de por cobrar.

## 2026-10-19 — Régimen del receptor y catálogos del diálogo

En **Factura de anticipo** y en **Aplicar anticipo**, Uso CFDI, Forma de pago y Método de pago (PUE o PPD) son listas, las mismas de la factura normal. El régimen del receptor no se elige: sale del cliente y se manda en `regimen_fiscal_receptor`.

- Público en general o mostrador sin RFC: `616`. Uso CFDI queda en `S01`.
- Persona física (`fiscal_person_type` o RFC de 13): `612`.
- Persona moral (RFC de 12) o sin RFC: `601`.

Al timbrar el anticipo, la forma de pago del CFDI sigue siendo `01`, `02`, `03`, `04` o `28`. En cobro mixto se usa la de mayor importe. `99` no se ofrece en el diálogo de timbrado; al aplicar el anticipo sí se puede elegir `99`.

## 2026-10-14 — Error 401 de Finkok al timbrar

`401: Fecha y hora de generación fuera de rango` no es sesión. Finkok rechazó el XML: la `Fecha` va adelantada respecto al código postal de la sucursal, o tiene más de 72 horas. El anticipo la arma en hora `America/Tijuana`. Si vuelve a fallar, el mensaje incluye la fecha enviada, el CP y el detalle de Finkok.

## 2026-10-14 — Dónde se ve la factura de anticipo

Queda en la cotización que la timbró. El detalle la muestra en el panel izquierdo y en Documentos: folio, UUID, total, PDF y XML.

```
GET /api/tenant/quotations/:id/invoices/:invoiceId/pdf
GET /api/tenant/quotations/:id/invoices/:invoiceId/xml
```

Al convertir a venta, la orden guarda `advance_invoice_id`. En Facturación de esa orden aparece la misma factura, marcada como Anticipo, con PDF y XML. No se vuelve a timbrar.

## 2026-10-14 — Timbrar anticipo en demo

El diálogo **Factura de anticipo** (cotización y orden) tiene el mismo selector Demo / Producción que la factura normal. En localhost arranca en Demo. El POST manda `environment`: `demo` o `production`. Sin credenciales de ese ambiente, Timbrar queda deshabilitado.

Si el POST falla (por ejemplo **400** sin corte abierto), el mensaje del API se muestra fijo arriba de Cancelar / Timbrar y en un aviso. No queda escondido al final del formulario.

## 2026-10-13 — Dos casos y monto con IVA

- Caso A: líneas reales en la cotización → factura de anticipo (monto en pesos con IVA, no porcentaje) → caja recibe el dinero ligado a la cotización → al entregar, orden + CFDI de mercancía con descuento = lo anticipado y Tipo Relación 07.
- Caso B: igual, pero la cotización nace con la línea temporal «Anticipo del bien o servicio» (84111506 / anticipo_CFDI / ACT). Cuando sepan los productos, se quita esa línea y se agregan las reales; el anticipo vigente se conserva.
- El diálogo de timbrado captura **monto que dejó (con IVA)** y el total pendiente. La API sigue recibiendo `base_amount` sin IVA.

---

## 1. Factura de anticipo

Botón **Factura de anticipo** en el detalle de la cotización (`Creada`) o en el detalle de la orden, si `can_stamp_advance`.

La captura en UI es el total con IVA (tope = total de la cotización/orden). Pollux deriva `base_amount = monto / (1 + iva/100)` antes de POST.

```
POST /api/tenant/quotations/:id/invoices/stamp-advance
POST /api/tenant/sales-orders/:id/invoices/stamp-advance
```

```json
{
  "base_amount": 10000,
  "iva_percentage": 8,
  "uso_cfdi": "G01",
  "forma_pago": "01",
  "metodo_pago": "PUE",
  "regimen_fiscal_receptor": "601",
  "environment": "demo"
}
```

`base_amount` es sin IVA. El cliente paga el total (base + IVA). Si se omite la base, sale de subtotal − descuentos. El XML lo arma el backend: clave `84111506`, identificación `anticipo_CFDI`, unidad `ACT`, cantidad 1, descripción «Anticipo del bien o servicio». Ejemplo operativo: cotización $10,000, el cliente deja $8,000 o $10,000. Lo pendiente se cobra al recoger.

`forma_pago` es el dinero que entra al corte abierto de la sucursal de la cotización:

| Código | Corte |
|--------|--------|
| `01` | Efectivo (entra al efectivo esperado) |
| `04` o `28` | Tarjeta |
| `03` | Transferencia |
| `02` | Cheque |
| Mixto en caja | CFDI con la forma de mayor importe; el corte guarda cada parte |

Sin corte abierto de hoy: **400** y no se timbra. El detalle del corte lista esos cobros en `advance_payments` y los suma en `cash_drawer`.

## 2026-10-19 — El anticipo entra al corte abierto

El cobro del anticipo (el de la cotización, antes del saldo en POS) queda en el corte abierto de esa sucursal. En la orden el origen de ese pago es **Anticipo**, no «Cobrada manual». En Caja, pestañas Cortes y Órdenes cobradas, sale en **Anticipos** con el folio de la cotización. Al cerrar el corte, «Cobrado en efectivo» incluye ese importe. El segundo cobro (el saldo en POS) sigue siendo otro movimiento del mismo corte.

Al convertir, ese importe ya está pagado en la orden. Caja, si se envía, solo cobra la diferencia. Si el anticipo cubrió el total, la orden queda `Pagado` y no se vuelve a cobrar.

Cancelar el anticipo (motivo 02) mientras el corte siga abierto saca el dinero de ese corte. Si el corte ya cerró: **400**.

Solo puede haber un anticipo vigente. El header trae `advance_invoice` (`id`, `uuid`, `series`, `folio`, `subtotal`, `total`, `stamp_status`, `sat_status`, `applied`).

Cancelar el anticipo (motivo 02) mientras no esté aplicado:

```
POST /api/tenant/quotations/:id/invoices/:invoiceId/cancel
POST /api/tenant/sales-orders/:id/invoices/:invoiceId/cancel
{ "motivo": "02" }
```

Si ya hay factura de mercancía o nota de crédito ligadas, **400**: cancelar esas primero.

Con anticipo vigente no se editan líneas ni se cancela la cotización (`cancel_blocked_reason`).

Al convertir, la orden hereda `advance_invoice_id`.

## 2. Aplicar el anticipo

En el tab Facturación de la orden, si `can_apply_advance`:

```
POST /api/tenant/sales-orders/:id/invoices/apply-advance
```

```json
{
  "uso_cfdi": "G01",
  "uso_cfdi_aplicacion": "G02",
  "forma_pago": "03",
  "metodo_pago": "PUE",
  "regimen_fiscal_receptor": "601"
}
```

Timbre en este orden:

1. Factura de la mercancía (las líneas reales), descuento = base del anticipo, relación `07` al UUID del anticipo. Si el anticipo cubrió todo, el total es 0. Si la orden es mayor, el total es la diferencia.
2. Nota de crédito (egreso) por el mismo importe del anticipo, concepto `84111506`, descripción «Aplicación de anticipo», relación `07`.

Si la nota de crédito falla después de la mercancía, el mensaje lo dice. Volver a llamar el mismo endpoint: no repite la factura que ya quedó vigente.

**Nueva factura** del tab queda bloqueada mientras el anticipo no esté aplicado.

## 3. Cobro en el corte

Al convertir, `GET /api/tenant/quotations/:id/collection-preview`:

```json
{
  "sucursal": "BUENOS AIRES",
  "open_shift": { "id": "uuid", "shift_date": "2026-09-26" }
}
```

`open_shift` null = no hay corte de hoy.

| Respuesta | Body | Resultado |
|-----------|------|-----------|
| Sí, generar cobro | `send_to_pos_caja: true` | OV `POS`, surtida, en ese corte, `Pendiente`. Caja la ve con `quotation_folio` |
| No | `send_to_pos_caja: false` | OV `MANUAL`, sin inventario y sin deuda |
| Sí, pero no hay corte | — | **400**. La cotización sigue `Creada` |

Si dijeron que no:

```
POST /api/tenant/sales-orders/:id/send-to-collection
```

Solo si `can_send_to_collection` (viene de cotización, pendiente, hay corte abierto, no está ya en ese corte).

Si dijeron que sí por error y aún no se cobra:

```
POST /api/tenant/sales-orders/:id/withdraw-from-collection
```

Solo si `can_withdraw_from_collection`. Libera lotes, vuelve a `MANUAL` / `Creada` y sale de caja. No genera deuda.

## 4. Cancelar la venta y regresar la cotización

`POST /api/tenant/sales-orders/:id/cancel` en una orden con `converted_from_quotation_id`:

- Libera lotes.
- Pasa la orden a `Cancelada`.
- La cotización vuelve a `Creada` y `converted_to_sales_order_id` queda null.
- El anticipo, si sigue vigente en la cotización, se queda. No se timbra otro hasta cancelarlo.
- Se puede convertir otra vez o cancelar la cotización (si no hay anticipo vigente) y crear otra.

No regresa la cotización si:

| Bloqueo | Mensaje |
|---------|---------|
| Factura CFDI vigente en la orden | Cancela la factura primero |
| Ya cobrada o con pagos | No se puede cancelar ni regresar la cotización |

El anticipo de la cotización no bloquea cancelar la orden. Bloquea cancelar la cotización.
