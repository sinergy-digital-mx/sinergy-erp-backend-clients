# Changelog de solicitudes

Generado desde `scripts/changelog.json`. No editar a mano.

Cada solicitud terminada entra en **Pendientes**. `npm run deploy:both` y `npm run deploy` del backend escriben en el commit solo esas entradas y las pasan a **Enviados**.

## Pendientes

No hay solicitudes pendientes de deploy.

## Enviados

### Versión 0.0.115 · 2026-11-10

- aplicación · El buscador de inventario filtra al escribir con una pausa de 300 ms y también al pulsar Enter.
- aplicación · El detalle de transferencia muestra el aviso de posición más chico, el estado como pastilla y la fecha en palabras.
- aplicación y servidor · El lote avisa si tiene un cambio de posición o una transferencia pendiente y abre el detalle para recibirlo.
- aplicación · En contratos, el contador de filtros ya no se pinta como texto: los atributos quedaron en el componente.
- aplicación y servidor · Lotes filtra por manzana: dropdown exacto que también aplica a las tarjetas.

### Versión 0.0.114 · 2026-11-10

- aplicación · Órdenes de venta, compras y cotizaciones también abren con la sucursal principal del usuario seleccionada.
- aplicación · En transferencias de inventario el listado solo muestra Ver detalle; recibir, cancelar, crear envío y PDF quedan dentro del detalle.

### Versión 0.0.113 · 2026-11-10

- aplicación · Órdenes de venta, órdenes de compra y cotizaciones abren con la razón social de la sucursal principal del usuario.

### Versión 0.0.112 · 2026-11-10

- aplicación y servidor · Transferencias de la misma razón social ya no piden envío: se indica en el detalle, se reciben directo y al crearlas desde el lote queda preseleccionada esa razón social.
- aplicación y servidor · El envío se omite solo si la transferencia cambia de almacén dentro de la misma sucursal; si cambia de sucursal sí pide envío. Desde el lote quedan preseleccionadas la razón social y la sucursal del lote.

### Versión 0.0.109 · 2026-11-09

- servidor · Se documentó, a nivel negocio, cómo están hechos cuentas por pagar, cuentas por cobrar y flujo de deuda para replicarlos en otro proyecto.

### Versión 0.0.108 · 2026-11-09

- aplicación · El botón Información de factura a público en general abre un modal chico, y se cierra con la X, el fondo o Escape.
- aplicación · En factura a público en general, la fila de la orden abre el modal de esa orden de venta. La casilla no lo abre.
- aplicación · En Cuentas por cobrar, el clic en cualquier columna de la fila abre las órdenes de esa razón social.

### Versión 0.0.107 · 2026-11-09

- aplicación · El menú vuelve a mostrar Polux | ERP. La estrella queda solo en el favicon.
- aplicación y servidor · En factura a público en general quedó el botón Información, y en cada razón social la zona horaria, la hora de cierre, el timbrado automático del último día del mes y el bloqueo para no facturar la orden por separado después de esa hora. El
- servidor · Se corrigió la migración de factura a público en general para que compilara y se aplicó en la base.

### Versión 0.0.106 · 2026-11-06

- aplicación y servidor · Listas de precio con número y margen, y hoja de actualización de precio (últimas compras, promedio y precios por unidad) solo para la verdulería.
- aplicación y servidor · En Flota y remolques, cada unidad muestra un badge de Disponible o En uso con el folio del envío activo.

### Versión 0.0.105 · 2026-11-04

- aplicación · En crear orden de venta, la búsqueda queda bajo las pestañas y al elegir el producto entra a la misma lista para editarlo ahí, sin una segunda fila de confirmar.
- servidor · Se activó Cobranza/Contabilidad y Empleados (RH) para el rol Admin de la verdulería. La maderería ya los tenía.
- aplicación y servidor · Cuentas por pagar no cargaba: faltaban columnas de domicilio del proveedor y ya quedaron en la base. La lista vuelve a mostrar la razón social, con Mes y Rango para recortar por fecha, y al abrir sigue el saldo completo.
- aplicación · En el detalle del cliente, Listas de precio recibía el id como texto y el componente lo espera numérico; ya usa el id de la ruta.

### Versión 0.0.103 · 2026-11-04

- servidor · El interés moratorio del estado de cuenta quedó en cada mensualidad, además del total de la cabecera. Si la cuota no tiene interés, sale un guion.
- aplicación · Se pidió quitar el cuadro blanco de los filtros de Productos; quedaron en fila como Clientes y Proveedores, y en móvil el tipo se abre con el botón Filtros.

### Versión 0.0.102 · 2026-11-04

- aplicación y servidor · En el cliente se habilitan una o varias listas de precio, con una predeterminada, y esa se preselecciona al crear una orden o cotización.
- aplicación y servidor · En proveedor nacional, al crear y al editar, se puede subir la constancia del SAT para llenar RFC, razón social y domicilio, y esos datos se pueden corregir antes de guardar.
- servidor · Se pidió cargar los clientes de Verdulería que venían en la hoja Clientes VTI; quedaron 254 en la organización, separados de los de Central por razón social, con crédito cuando el archivo traía límite.

### Versión 0.0.101 · 2026-11-04

- aplicación · Polux ERP queda en el nombre de la pestaña, junto a la estrella. Arriba del menú ya no va el texto: se ve la estrella, o el logo de la razón social si está activo.
- aplicación · En la alta de orden, la búsqueda de producto queda arriba y alineada con la lupa. Al elegir, los campos salen debajo, sin desbordarse al pie.

### Versión 0.0.100 · 2026-11-03

- servidor · Factura público en general dejaba de cargar: faltaba la columna de sucursal en la factura global y ya quedó aplicada.
- aplicación y servidor · Cobranza POS abre en el mes actual y, bajo el folio, indica si la venta es anticipo, crédito o contado.
- aplicación y servidor · Cobranza: Flujo de deuda y Rep. Vent. Cost. Prom. leen la sucursal de billing_branch_id, la misma URL que el resto de pestañas.
- aplicación · En Flujo de deuda los filtros quedan sueltos como en las otras pestañas de Cobranza, y Descargar Excel queda junto al periodo.
- aplicación · En el selector de periodo, al picar Mes se cierra el calendario del rango que se había quedado abierto.
- aplicación y servidor · Se pidió que el menú y la URL dejen de llamarse Reportes; quedó Reporte de requerimiento en /reporte-requerimiento, en la pantalla y en el API.
- aplicación · Se pidió achicar el reporte de requerimiento, ocultar los CEDIS y bajarlo a Excel; quedó más compacto, con engrane para elegir sucursales y botón Excel de lo que se ve.
- aplicación y servidor · Se pidió juntar código y nombre en el reporte de requerimiento y explicar los badges; quedaron en la columna Producto, y chips, estados y tarjetas dicen al pasar el mouse qué son y cómo se calculan.
- aplicación · En la alta de orden de venta y cotización, el producto se captura en una barra fija abajo: búsqueda por código o nombre, y al elegirlo se confirman unidad, lista, cantidad, precio, descuento e IVA 0/8/16 sin abrir otro modal.

### Versión 0.0.99 · 2026-11-03

- aplicación y servidor · Facturas globales: la lista y Generar facturas quedan por sucursal y mes. Una vigente por sucursal, con el código postal de esa sucursal.
- aplicación y servidor · En Cobranza la pestaña se llama Factura público en general, igual que los avisos y la cancelación.
- aplicación y servidor · Al registrar venta faltaba la nota de observaciones: el modal ya la pide y se guarda en la orden para imprimirla en el ticket.
- aplicación y servidor · Cobranza POS vuelve a listar todas las ventas cobradas con su forma de pago, y de crédito solo los abonos ya pagados, con las tarjetas de totales sin permiso extra.
- aplicación · Cobranza POS vuelve a mostrar los totales por forma de pago: transferencias, efectivo, tarjetas, cheques y crédito, con ventas, monto y ticket.
- aplicación y servidor · Cobranza POS agrega en la fila de filtros Envío, Efectivo, Tarjeta y el resto de formas, cada uno con conteo y monto.
- servidor · El anticipo ya no descuenta crédito: en Cobranza POS su total es lo que falta por cobrar, y solo la orden a crédito usa el disponible.
- aplicación y servidor · Cuentas por cobrar: el periodo solo muestra Mes y rango; se quitaron Hoy y Semana.
- servidor · El flujo de deuda solo cuenta órdenes a crédito y deja fuera el anticipo: el cargo es la parte a crédito y el abono de anticipo no entra.
- aplicación · El build del punto de venta vuelve a compilar: el anticipo se lee solo cuando la confirmación es de cotización.
- aplicación y servidor · Se pidió un módulo Reportes solo para Madería con existencias por proveedor y cuánto comprar; quedó la hoja por sucursal, con mínimos, máximos, utilidad y cantidad editable.
- aplicación y servidor · La orden de compra impresa ahora muestra la unidad (pie lineal), las notas y la factura del proveedor; al guardar notas o factura se regenera el documento.

### Versión 0.0.98 · 2026-11-03

- aplicación y servidor · El saldo que queda fuera de un anticipo usa el crédito del cliente, sin duplicar cotización y orden, y Cobranza POS y punto de venta muestran lo cobrado y lo pendiente.

### Versión 0.0.97 · 2026-11-03

- aplicación y servidor · Cobranza POS lista solo órdenes a crédito de clientes con crédito habilitado, pagadas o pendientes, y quita público en general y los filtros de forma de pago.
- servidor · En el estado de cuenta se pidió el total vencido y los intereses moratorios: el PDF ya los muestra, sin sumarlos al saldo. El recibo no se guarda: al descargarlo usa la razón social del contrato.

### Versión 0.0.96 · 2026-11-03

- aplicación · En Facturas globales, un texto indica que la lista son las órdenes que el cliente no facturó y que la factura global se emite con todas.

### Versión 0.0.95 · 2026-11-03

- aplicación y servidor · En inventario totalizado el margen muestra precio y costo: cada lote usa su compra o, si no tiene, el costo configurado, y el producto es el promedio de esos lotes. El detalle del lote y el producto explican de donde sale.
- aplicación y servidor · En Cobranza se agregó la pestaña Facturas globales: por mes y razón social lista las órdenes de clientes sin facturar, con folio, fecha, totales y forma de pago, y timbra una sola factura; se puede consultar y cancelar.

### Versión 0.0.94 · 2026-11-03

- servidor · El reporte de flujo de deuda, la antigüedad y su Excel muestran solo órdenes a crédito.
- aplicación y servidor · Un envío puede llevar varias transferencias: desde el detalle se crea el envío o se agrega a uno existente, y en el viaje se pueden sumar más.

### Versión 0.0.93 · 2026-11-03

- aplicación y servidor · En Cobranza POS, junto a Todas, Público en General y Facturadas, los filtros de forma de pago llevan ícono y se puede filtrar Crédito; las columnas también filtran e incluyen Crédito.

### Versión 0.0.92 · 2026-11-02

- aplicación y servidor · El envío de la factura por WhatsApp ahora manda primero una foto: tu pago está pendiente, o ya está pagada, con el total y los datos del CFDI.

### Versión 0.0.91 · 2026-11-02

- aplicación y servidor · En la factura de la orden se puede enviar por WhatsApp a un teléfono o a un grupo, con el PDF y el XML.

### Versión 0.0.90 · 2026-11-02

- servidor · Clonar una orden de venta ya no se bloquea si el comisionado no tiene código POS; se copia igual que en la orden original.

### Versión 0.0.88 · 2026-11-02

- aplicación y servidor · En el reporte de punto de venta de cobranza, la fecha de pago del abono queda aparte de la fecha de cobro en caja, en la tabla y en el Excel.
- aplicación y servidor · Se pidió marcar órdenes de venta como para envío al crearlas en el alta, el listado y el punto de venta, y poder agregarlo después en caja o en el detalle. El reporte de puntos de venta en cobranza muestra la marca y un total de envío.

### Versión 0.0.86 · 2026-11-02

- aplicación y servidor · El historial de versiones se arma en memoria con el catálogo y los módulos de cada organización, sin copiar filas, y la pantalla usa un cargador centrado.
- aplicación · El nombre visible pasó de Pollux a Polux: la pestaña dice Polux, arriba dice Polux ERP y el favicon es una estrella en PNG sin fondo.
- aplicación y servidor · El aviso de actualización lista las notas publicadas en app-version.json, sin consultar el historial, y Ver todas las versiones quedó como botón.
- aplicación y servidor · Productos y Proveedores salen de Configuración y quedan en el menú principal, con permiso ViewMenu como el resto de vistas.

### Versión 0.0.85 · 2026-11-02

- aplicación y servidor · En la venta, si el producto o servicio no tiene unidad de medida, el mismo cuadro avisa y abre su ficha para asignarla. Al guardar un almacén de sucursal sin dirección válida, indica qué falta y permite usar la de la sucursal, en lugar de u
- aplicación y servidor · En caja, transferencia pide nombre o razón social, y tarjeta o cheque piden nombre y teléfono.
- aplicación y servidor · El crédito de cada razón social queda en pesos o dólares, y una venta en la otra moneda se convierte con el tipo de cambio de esa orden.
- aplicación y servidor · En caja, efectivo y mixto se cobran en pesos, en dólares o en las dos monedas.
- aplicación y servidor · Si IEPS está apagado en la razón social, ya no aparece en el producto, en órdenes de compra y venta, en el detalle, en PDF, Excel ni en la factura.
- aplicación y servidor · Cobranza POS: en la línea del reporte, un cobro mixto de caja muestra las formas usadas (efectivo + tarjeta, tarjeta + cheque, etc.) y el Excel usa el mismo texto.
- aplicación y servidor · En el corte parcial, el campo de cantidad de billetes en dólares se recortaba; ahora se ve completo.
- aplicación y servidor · En CRM, cada actividad muestra siempre el vendedor: el autor de la nota, o si no hay el vendedor del cliente, o quien lo registró.
- aplicación y servidor · En Cobranza, la sucursal queda en la URL de todos los reportes de contabilidad para que al recargar siga seleccionada.
- aplicación y servidor · En Cobranza POS, un cobro con importe muestra un ojo para ver el ticket, y vendedor y cajero ya no muestran el código.
- aplicación y servidor · Proveedores: se quitó el campo Nombre; el identificador queda en nombre de empresa en ficha, listados, compras, cuentas por pagar y Excel.
- aplicación y servidor · En caja, el cheque también se puede cobrar en dólares, con el tipo de cambio del corte.
- aplicación y servidor · Permiso ViewStats en inventario, órdenes de compra y órdenes de venta para ver las tarjetas de arriba; sin ese permiso no se muestran ni se entregan esos totales. Clientes ya lo tenía.
- aplicación y servidor · Pedimento en órdenes de compra: solo se guarda con el formato del SAT (15 dígitos) y el campo tiene máscara para capturarlo.
- aplicación · En el punto de venta las cartas del catálogo quedan más grandes: máximo tres por fila en monitor, y en pantallas angostas bajan a dos o una. El texto de stock y unidad queda centrado en las badges, sin pegarse arriba ni entre sí.

### Versión 0.0.83 · 2026-10-31

- servidor · Listado de empleados: se aplicó la columna work_schedule que faltaba y tiraba 500
- servidor · El PDF de la factura de OV no imprimía el IVA: el parser leía Impuestos del concepto en vez del comprobante; PDFs viejos se regeneran con ?regenerate=true

### Versión 0.0.82 · 2026-10-29

- aplicación y servidor · Horario laboral en Editar usuario (tab Empleado) y botón Editar en el expediente para el admin

### Versión 0.0.81 · 2026-10-29

- aplicación y servidor · Importar lotes: se quita la columna ubicacion; el grupo de cada fila es la ubicación
- aplicación y servidor · Portal de empleado: horario laboral semanal (lun-dom) que el empleado y RH pueden guardar

### Versión 0.0.80 · 2026-10-28

- aplicación y servidor · En el reporte de ventas a costo promedio, el folio de una cotización abre la cotización igual que el folio de una orden abre la orden.
- aplicación y servidor · Importar lotes: omite filas duplicadas o inválidas, importa el resto y deja lista copiable de las que no entraron

### Versión 0.0.79 · 2026-10-28

- aplicación y servidor · Junto a Editar, chofer y camión muestran palomita o aviso de carta porte en el cursor, y se creó un envío de prueba con la orden OSV-000315 de Rodolfo Sinergy.

### Versión 0.0.78 · 2026-10-28

- aplicación y servidor · En el alta y en un viaje existente, chofer y camión indican si la carta porte está completa y se pueden editar al elegirlos; se crearon 5 choferes y 5 camiones de prueba.

### Versión 0.0.77 · 2026-10-28

- aplicación y servidor · En la carta porte del envío se puede timbrar en demo para ver el PDF de prueba, y esa timbrada se puede reemplazar después por producción.

### Versión 0.0.76 · 2026-10-27

- aplicación y servidor · Las solicitudes del día quedan en un changelog. El deploy escribe en el commit solo las pendientes y después las marca como enviadas.
