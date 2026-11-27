# Changelog de solicitudes

Lectura de `scripts/changelog.json`. No editar a mano.

Cada solicitud terminada entra en **Pendientes**. `npm run deploy:both` publica esas notas en la versión y las pasa a **Enviados**.

## Pendientes

No hay solicitudes pendientes de deploy.

## Enviados

### Noviembre 2026

#### Versión 0.0.213 · 27 nov

- Órdenes de compra · En el detalle, moneda y estado van en una sola franja y la ventana ocupa casi toda la pantalla. Razón social y sucursal quedan en dos líneas sin título; creado por, proveedor y almacén conservan el suyo.
- Cotizaciones · En el detalle, moneda y estado van en una sola franja y la ventana ocupa casi toda la pantalla. Razón social y sucursal quedan en dos líneas sin título; cliente conserva el suyo.
- Configuración · En roles, cada permiso muestra la descripción en negrita y el código abajo.

#### Versión 0.0.212 · 27 nov

- Órdenes de venta · En el detalle, razón social, sucursal, folio y envío quedan en dos líneas, más bajas y sin título. Cliente conserva el título y el nombre.

#### Versión 0.0.211 · 27 nov

- Configuración · En roles, el editor muestra cuántos módulos tiene el rol y permite ver solo asignados o sin asignar, y contraer o mostrar todo.

#### Versión 0.0.210 · 27 nov

- Órdenes de venta · En el detalle los estados del encabezado van en una sola franja y se quitó Mostrador. La ventana ocupa casi toda la pantalla y el encabezado de productos queda como el de mostrador.
- Configuración · En usuarios, el rol muestra cuántos módulos tiene y su lista, con acceso a editar el rol si hay permiso, y la búsqueda queda en la URL.

#### Versión 0.0.209 · 27 nov

- Órdenes de venta · En el detalle, la factura, el complemento, el ticket y los documentos se abren en el visor. En Documentos quedó el ojo para ver y el botón para descargar.
- Cotizaciones · El PDF de la cotización, el del anticipo y los documentos se abren en el visor. En documentos quedó el ojo y la descarga.
- Órdenes de compra · En documentos de la orden de compra el ojo abre el PDF en el visor y se conserva la descarga.
- POS Ventas · La cotización, la orden, el anticipo, la factura y el ticket se abren en el visor del sistema.
- Clientes · La factura y el ticket, desde el cliente, se abren en el visor.
- Contratos · El estado de cuenta y los recibos se abren en el visor.
- Logística · El PDF de la carta porte se abre en el visor.
- Inventario · El PDF de la transferencia se abre en el visor.
- Plataforma · El formato de reservación y el resumen de la suscripción se abren en el visor.
- Logística · En el viaje, la transferencia muestra sucursal, almacén y dirección, y se puede ubicar en el mapa.

#### Versión 0.0.208 · 27 nov

- Contabilidad · En Caja y cuentas el PDF de la factura se abre en un modal grande, sin salir de la página.
- Contabilidad · En Ventas cobradas la columna Total se llama Cobrado, ya no está Pendiente, y bajo el folio sale el COT si la orden vino de una cotización.

#### Versión 0.0.207 · 26 nov

- POS Ventas · En POS Caja se cambia quién cobra con su código, de caja o de ventas. El cobro, el anticipo, el abono y el corte parcial quedan a nombre de esa persona.

#### Versión 0.0.206 · 26 nov

- Órdenes de venta · El detalle de la orden respondía 500 porque a los camiones les faltaba la sucursal por defecto. Esa columna ya está en la base.

#### Versión 0.0.205 · 26 nov

- Contabilidad · En Caja del día cada orden tiene el ojo del ticket de compra y el botón PDF de la factura, con tooltip de lo que abre cada uno.
- Plataforma · Los títulos de los listados bajan a 18 px para quedar a la altura de los botones.
- Clientes · En Clientes el título queda a 18 px, a la altura de Descargar Excel y Crear.
- Inventario · En inventario, transferencias y existencia el título queda a 18 px, a la altura de los botones.
- Productos · En Productos el título queda a 18 px, a la altura de los botones.
- CRM · En CRM el título queda a 18 px, a la altura de los botones.
- Contabilidad · En Caja y cuentas y Flujo de deuda el título queda a 18 px.
- Proveedores · En Proveedores el título queda a 18 px, a la altura de los botones.
- Logística · En logística el título queda a 18 px, a la altura de los botones.
- Empleados · En Empleados el título queda a 18 px, a la altura de los botones.
- Órdenes de venta · En crear o editar una orden de venta el título queda a 18 px.
- Órdenes de compra · En el formulario y el detalle de compra el título queda a 18 px.
- Configuración · En las pantallas de configuración el título queda a 18 px, a la altura de los botones.
- WhatsApp · En WhatsApp el título queda a 18 px, a la altura de los botones.
- Plataforma · El botón de crear deja el borde oscuro y queda del mismo alto que Descargar Excel.
- Órdenes de venta · En órdenes de venta, Crear usa el mismo icono y alto que Descargar Excel.
- Órdenes de compra · En órdenes de compra, Crear usa el mismo icono y alto que Descargar Excel.
- Cotizaciones · En cotizaciones, Crear usa el mismo icono y alto que el resto de acciones.
- Clientes · En clientes, Crear Cliente usa el mismo icono y alto que Descargar Excel.
- Productos · En productos, el botón de alta usa el mismo icono y alto que Descargar catálogo.
- Contabilidad · En Caja del día, Ventas cobradas y Cuentas por cobrar cada orden abre el ticket y el PDF de la factura con el mismo tooltip. Las cartas de Cuentas por cobrar, Cuentas por pagar y Caja del día usan el resumen de órdenes de venta.
- Órdenes de venta · Si el detalle de la orden no carga, el modal muestra el motivo, Reintentar y la X para cerrar.

#### Versión 0.0.204 · 26 nov

- CRM · En el listado del CRM el nombre del cliente se corta al final si no cabe, sin partirse en dos líneas.
- Plataforma · El botón principal quedó en índigo sobrio, con un degradado muy leve y el mismo alto que el secundario.
- Inventario · En inventario los accesos de Existencia, Transferencias y Auditorías quedaron al mismo alto y estilo que Descargar Excel.

#### Versión 0.0.203 · 26 nov

- Plataforma · Los botones de acción quedaron en 32 px de alto, con texto de 12 px.
- CRM · En el CRM se quitó el subtítulo de seguimiento de todos los usuarios.

#### Versión 0.0.202 · 26 nov

- POS Ventas · En Caja, el panel de cobro entra deslizándose desde la derecha.
- POS Ventas · Al abrir Ventas o Caja el menú de la izquierda se cierra solo y se puede volver a abrir.
- POS Ventas · Se quitó estilo sin uso del cobro para que el build no pase de 60 kB.

#### Versión 0.0.201 · 26 nov

- POS Ventas · En Falta y Cambio cada monto lleva un badge chico de MXN o USD.
- POS Ventas · En el cobro, Para envío quedó chico en el encabezado, junto a cerrar.
- POS Ventas · En efectivo, las cartas de pesos y dólares quedan del mismo alto y el título más chico.
- POS Ventas · Sin crédito quedó como botón dentro de la fila del cliente, y el modal abre encima del panel de cobro.
- Clientes · Desde Caja, Sin crédito abre el crédito del cliente encima del panel de cobro.
- POS Ventas · En Ventas, C1 C2 y C3 quedaron en la misma pastilla, el icono del carrito en un círculo, y se quitó toca para el ticket.

#### Versión 0.0.200 · 26 nov

- POS Ventas · En efectivo, los billetes van en una barra segmentada del mismo ancho.

#### Versión 0.0.199 · 26 nov

- POS Ventas · En caja el listado y el cobro volvieron a verse dentro de su panel.
- POS Ventas · En caja las cartas de Por cobrar y de Órdenes cobradas quedan del mismo alto.
- POS Ventas · En caja, al elegir una venta el cobro abre en un panel lateral y el listado queda difuminado detrás.
- POS Ventas · En el panel de cobro el vendedor queda chico, debajo del folio.
- POS Ventas · En el cobro el cliente queda en una fila con Editar y Cambiar, y Generar factura se prende hasta elegir Demo o Producción.
- POS Ventas · En el cobro, Demo y Producción quedan dentro de la caja de Generar factura.
- POS Ventas · En el cobro, Marcar para envío queda pegado al total, sin el margen de más.
- POS Ventas · En Generar factura ya no sale el texto que pedía elegir Demo o Producción.
- POS Ventas · En el cobro la fila del cliente queda más baja, sin el texto Cliente seleccionado, y Editar y Cambiar son más chicos.
- POS Ventas · En Generar factura ya no salen los textos de timbrado ni de factura de prueba.
- POS Ventas · En el cobro, si el cliente no tiene crédito, la fila muestra Sin crédito y abre Editar en esa pestaña.
- Clientes · Editar cliente tiene la pestaña Crédito para dar de alta el crédito por razón social.
- POS Ventas · En Por cobrar los filtros quedan a la derecha del buscador, del mismo alto y en índigo.
- POS Ventas · En Por cobrar el select de vendedor mide lo mismo que Todos, Solo anticipos y Solo ventas.
- POS Ventas · En Por cobrar las acciones de la carta son iconos iguales: regresar, ver detalle y marcar envío.
- POS Ventas · En Por cobrar el nombre del icono sale pegado al botón, no en otra carta.
- POS Ventas · En el cobro, Sin crédito abre solo el alta de crédito y ya no abre también Editar o Cambiar.
- POS Ventas · En Por cobrar el listado ya no muestra la barra horizontal de abajo.
- POS Ventas · En el panel de cobro ya no está Regresar a ventas. Sigue en el icono de la carta.
- POS Ventas · En Por cobrar se quitó la barra del título y Actualizar quedó a la derecha de Vendedor.
- POS Ventas · En el cobro, falta y cambio van en su propia carta y se quitó el título Método de pago.

#### Versión 0.0.198 · 26 nov

- POS Ventas · En caja el buscador queda en su caja y las órdenes y el cobro van en cartas sueltas sobre el fondo.

#### Versión 0.0.197 · 25 nov

- POS Ventas · En Órdenes cobradas cada carta tiene Ticket y Factura, abre el mismo diálogo de impresión y todas quedan del mismo tamaño.
- POS Ventas · En caja el icono de búsqueda queda dentro del campo, separado del borde.

#### Versión 0.0.196 · 25 nov

- POS Ventas · En caja el efectivo en ambas monedas queda lado a lado. Al cobrar el ticket siempre está, y si hay factura se ve junto al PDF a casi toda la pantalla.

#### Versión 0.0.194 · 25 nov

- POS Ventas · En POS Caja el anticipo se cobra en el corte, con carta distinta a la venta, y el timbrado abre en demo. Quien ve POS puede regresarlo a ventas. El cliente sigue en el carrito y el buscador se mueve con las flechas.
- Cotizaciones · La cotización de anticipo entra a caja para cobrarse, aunque ya tenga la venta de los productos.
- POS Ventas · En caja el folio va en una barra con anticipo y saldo a favor, el cobro queda más compacto con fecha legible y los recibos se filtran por anticipo, venta y vendedor.
- Logística · Los camiones guardan sucursal por defecto y el listado prefiltra las del usuario sin bloquear otras. Los envíos de transferencia muestran sucursal origen y destino.
- Inventario · Transferencias quedó como módulo del menú principal, con listado compacto y PDF que encabeza sucursal origen hacia sucursal destino.

#### Versión 0.0.193 · 25 nov

- Órdenes de compra · En el PDF de la orden, el SKU sale chico debajo del producto y arriba de la unidad.
- POS Ventas · En Folios se ve si el anticipo ya tiene venta. Al continuar, el carrito conserva el precio y la ficha queda en una línea con el PDF.
- Cotizaciones · Folios de anticipo indica el folio de la venta cuando la cotización ya se convirtió.

#### Versión 0.0.191 · 25 nov

- POS Ventas · En POS Caja lo que llega o se regresa de Ventas aparece solo, lo nuevo queda arriba y el panel de cobro solo sale al elegir una orden.
- POS Ventas · En pago mixto se pueden registrar varias transferencias, cada una con monto y referencia propia, y los datos del ordenante se capturan una sola vez.
- POS Ventas · En Folios se abren primero las cotizaciones con anticipo y el detalle queda arriba del carrito. En caja, la orden abierta usa todo el ancho.

#### Versión 0.0.188 · 25 nov

- POS Ventas · En POS Ventas Tickets ya no se abre solo. La hora de En caja usa el reloj de Tijuana.
- POS Ventas · En Ventas, En caja abre con Información en la misma carta y ahí está Regresar a ventas.
- POS Ventas · En Cotizar el monto del anticipo es un solo campo, el cliente y los productos van en una linea y la cabecera queda a la mitad.
- POS Ventas · En Folios se busca por folio, cliente, empresa, RFC o telefono. Las pagadas quedan ocultas hasta Mostrar, y Con anticipo filtra ventas y cotizaciones.

#### Versión 0.0.187 · 25 nov

- Cotizaciones · En Cotizar se timbra el anticipo: sin productos queda la cotizacion, con productos abre la venta y aparta lo que hay. En Tickets se elige el carrito, se agregan productos y caja cobra solo si falta.
- POS Ventas · En el catálogo, sucursal, Filtros y el cambio de vista quedan al mismo alto chico.
- Plataforma · El build de producción acepta el estilo de toma de pedido hasta 60 kB.

#### Versión 0.0.186 · 25 nov

- Cotizaciones · El anticipo cobrado aparece en Tickets de ventas: se agregan los productos y al registrar se crea la orden. Demo o Producción se elige al pedirlo.
- POS Ventas · En pantallas chicas la barra de Ventas usa textos más chicos y las cartas del catálogo se achican para que quepan más productos.
- POS Ventas · En el catálogo, bodega y sin inventario quedan en el botón Filtros para que la búsqueda no se corte.

#### Versión 0.0.184 · 25 nov

- Cotizaciones · Al cotizar con factura de anticipo se elige Demo o Producción, y caja timbra con ese ambiente.

#### Versión 0.0.183 · 25 nov

- Cotizaciones · El anticipo en punto de venta pregunta sin productos o con productos, con el mismo estilo de los otros diálogos.

#### Versión 0.0.182 · 25 nov

- Inventario · En Inventario, el ! al final del buscador deja solo el código exacto, igual que en POS.

#### Versión 0.0.181 · 25 nov

- Órdenes de venta · La facturación de órdenes resuelve la dependencia circular con turnos de punto de venta para que el API arranque.
- Cotizaciones · El anticipo se pide por wizard en punto de venta y en la cotización, y al regresar se genera la venta con la factura ligada.

#### Versión 0.0.180 · 25 nov

- POS Ventas · En Folios, Cotizaciones lista todas las de la sucursal y la razón social, de cualquier vendedor.

#### Versión 0.0.179 · 25 nov

- POS Ventas · En Folios las cartas muestran empresa y persona, y ventas y cotizaciones van en filtros separados.
- Contabilidad · En el menú y en la vista, Cobranza pasa a Caja y cuentas. La pestaña Cobros pasa a Ventas cobradas.
- Contabilidad · En factura a público en general la columna Cliente ya no repite la sucursal del filtro.
- Contabilidad · En factura a público en general la moneda de cada orden queda en una columna a la izquierda del total.
- Inventario · El precio, el costo y el margen de inventario solo se ven con el permiso Ver margen. En la maderería quedó en el rol Dirección.
- POS Ventas · En Folios, las cotizaciones salen de la sucursal y la razón social, no solo las del usuario de la sesión.
- Cotizaciones · La búsqueda del listado también coincide con el nombre de la empresa.
- Cotizaciones · El listado guarda búsqueda, filtros y página en la URL.
- Órdenes de compra · La columna de costo de la orden, el costo de sus lotes y la columna del Excel quedan ocultos sin el permiso Ver margen.
- Productos · El tab de costos de proveedor queda oculto sin el permiso Ver margen.
- Inventario · El costo real del lote también queda oculto sin el permiso Ver margen.

#### Versión 0.0.178 · 24 nov

- POS Ventas · En Ventas, cambiar de carrito ya no arrastra ni borra los productos del otro.

#### Versión 0.0.177 · 24 nov

- POS Ventas · En Folios el copiar queda en un ícono junto al folio, sin meter Copiado en la fila.
- POS Ventas · En Folios, copiar a carrito pregunta C1, C2 o C3 y la fila se abre con los productos.
- POS Ventas · En la barra, al pasar el cursor por el corte la terminal sale abajo como submenú, sin mover el resto.

#### Versión 0.0.176 · 24 nov

- POS Ventas · En Ventas, Folios lleva cotizaciones y ventas a tres carritos con el precio vigente. En Caja, el abono queda en la orden y en el corte abierto.

#### Versión 0.0.175 · 24 nov

- POS Ventas · En POS, la barra muestra Corte abierto y el nombre de la terminal sale al pasar el cursor.

#### Versión 0.0.174 · 24 nov

- POS Ventas · En el modal de imprimir, el campo de copias queda compacto y el ícono del botón queda alineado.
- Clientes · El listado de clientes abre con la razón y sucursal del vendedor; se puede ver todas y configurarlo en Configuración.

#### Versión 0.0.172 · 24 nov

- POS Ventas · En la barra del POS el clic en el cuadrito de sucursal o vendedor abre el cambio, sin el texto Cambiar.

#### Versión 0.0.171 · 24 nov

- Plataforma · Se quitaron del API público las rutas de administración de organizaciones y de módulos. Las de cada empresa siguen registradas.

#### Versión 0.0.170 · 24 nov

- Inventario · En Por sucursal se quitó el texto de que cada unidad va en su renglón.
- Inventario · En inventario por sucursal el buscador toma el texto que ya estaba en la búsqueda de arriba.
- Inventario · En Por sucursal los nombres de sucursal y los números quedaron más chicos para ver más renglones sin bajar tanto.
- Inventario · En Por sucursal se arrastran las sucursales para ordenar la ficha, y el filtro queda a la altura de Todas y Ninguna.
- Inventario · En Por lotes y Totalizado el buscador muestra una X para borrar el texto.
- Plataforma · En el celular el logo queda centrado en la barra superior, ya no flota junto al menú.
- POS Ventas · En el buscador del POS, ! al final busca el código exacto. 1x12! ya no trae L21X120.

#### Versión 0.0.167 · 24 nov

- POS Ventas · En ventas el carrito queda un poco más angosto. El descuento global solo se muestra si hay uno aplicado, y el descuento en precio usa una pastilla con el porcentaje.
- Productos · En el catálogo, las pestañas del producto (Precios, UOMs y las demás) vuelven a cambiar al hacer clic.
- Inventario · En inventario por sucursal el buscador ya no lleva lupa, para que el texto no se monte sobre el ícono.
- Inventario · En inventario por sucursal la ficha agrupa las unidades de cada sucursal y ya no muestra tres guiones cuando hay varias unidades.

#### Versión 0.0.165 · 24 nov

- Configuración · En el modal de razón social el botón dice Cerrar.
- POS Ventas · En ventas la tercera vista es la tabla de todas las sucursales, con la misma búsqueda y ordenada por cantidad.
- Órdenes de venta · En el resumen, la barra de Abiertas y Entregadas queda a la misma altura que las demás y los montos van debajo.
- Órdenes de venta · En el listado, si la sucursal ya está elegida arriba, no se repite la columna. En la gráfica el mes sale Nov.
- Clientes · En la gráfica de compras el mes sale con inicial mayúscula: Nov.
- POS Ventas · El carrito de POS Ventas es más ancho y el ícono de descuento de cada línea queda alineado con la cantidad.
- Contabilidad · En Cobranza, Caja del día y Cobros explican cada pestaña al pasar el cursor, y los filtros quedan alineados en todas las vistas.
- Órdenes de compra · En el listado, la carta de deuda y las demás muestran el monto en pesos y en dólares, cada moneda en su renglón.
- Órdenes de venta · En el listado móvil el encabezado, la búsqueda y los filtros quedan como en clientes, y cada orden se ve en una tarjeta con total, pago y factura.
- Cotizaciones · En el listado móvil el encabezado, los filtros y cada cotización quedan en tarjetas como las de clientes.
- Órdenes de compra · En el listado móvil el encabezado, los filtros y cada orden de compra quedan en tarjetas como las de clientes.
- Inventario · En Inventario, Por sucursal muestra la existencia y el costo de un producto, y el engrane guarda qué sucursales se ven.
- Inventario · En Totalizado, un clic en la fila abre la configuración del producto o expande los lotes.
- Plataforma · El tope de estilos de una pantalla en el build de producción pasa de 50 kB a 56 kB.

#### Versión 0.0.161 · 23 nov

- POS Ventas · En el POS, la barra y el filtro cerrado muestran solo el nombre de la sucursal. La lista y el modal siguen con la ciudad.
- Órdenes de venta · La card de abiertas y entregadas muestra cada lado con su conteo y su monto, sin recortar el dinero.
- aplicación · La fecha corta del cobro POS muestra el mes con mayúscula: Nov 20 26.
- POS Ventas · En ventas, Existencias abre la búsqueda y muestra cantidades por sucursal, sin costos.
- Inventario · La consulta de existencias del POS devuelve solo cantidades por sucursal.
- aplicación y servidor · Un cobro mixto de POS ahora guarda un pago por cada tarjeta o medio, con su referencia, y se separaron los 93 que estaban totalizados.

#### Versión 0.0.160 · 23 nov

- POS Ventas · En el carrito de POS Ventas el botón % abre 5%, 3% y otro porcentaje en un panel flotante, para que la carta no crezca.
- Configuración · Con el menú abierto el logo ya no se recorta: queda arriba completo y la lista se desplaza debajo.
- POS Caja · En POS Caja, al terminar de cobrar se abre un modal para imprimir el ticket (2 copias) y, si se facturó, el PDF; al cerrarlo el contador de Órdenes cobradas sube animado.
- Configuración · Versiones carga de 8 en 8 y cada nota dice el módulo y qué se cambió. El deploy publica esas notas.
- Órdenes de venta · La card Creadas pasó a Abiertas contra entregadas, sin canceladas, con la barra en dos colores y el monto de cada lado.
- Cotizaciones · El cobro de anticipo en punto de venta devuelve el id de la factura timbrada.
- Órdenes de venta · El build de órdenes de venta vuelve a pasar: la barra de Abiertas conserva los tonos índigo y verde.

#### Versión 0.0.157 · 23 nov

- Órdenes de venta · Se quitó la card Surtidas y Órdenes, Creadas, Pagadas y Pendientes ahora suman todo el filtro, no solo la página.
- Órdenes de venta · Las bolitas para cambiar de vista quedaron a la izquierda del botón de recargar.
- Órdenes de venta · En el detalle de la orden, el cobro POS agrupa cada pago y la fecha queda corta, sin hora (ago 3 26).
- POS Ventas · Regresar a ventas, cargar ticket y descartar orden confirman con el diálogo de la app para no salir de pantalla completa.

#### Versión 0.0.156 · 23 nov

- Configuración · El logo del menú ya no se reescala al abrir y cerrar la barra: queda a tamaño fijo y el menú solo anima el ancho.
- POS Ventas · El descuento de precio en el carrito de POS quedó en un ícono y una fila del mismo alto que la cantidad.

#### Versión 0.0.155 · 23 nov

- Clientes · En Información Fiscal del cliente, una i junto a Cargar constancia SAT explica que el PDF se lee y se llenan solos RFC, razón social y domicilio.
- Configuración · En el listado la razón del menú se marca como Template, y POS Ventas y POS Caja pueden guardar cada una el color de su barra.
- POS Ventas · El modal de Ventas en caja quedó más grande, con cartas apaisadas y los productos en tabla con scroll; En caja, Tickets y Regresar a ventas quedaron en un tamaño intermedio.
- POS Ventas · Las cartas de Ventas en caja quedaron del mismo ancho y alto; la que se abre sigue ocupando todo el modal.
- aplicación · El build fallaba porque el CSS de POS Ventas pasaba 48 kB; el tope de error quedó en 50 kB.

#### Versión 0.0.153 · 23 nov

- Configuración · El logo del menú abierto quedó un poco más chico: hasta 92 px de alto, sin el cuadro blanco.
- Configuración · En Logo y color se puede poner una máscara de color al logo del menú: el dibujo queda de un solo color y el blanco se vuelve transparente.

#### Versión 0.0.150 · 23 nov

- Inventario · La búsqueda y los filtros quedan en la URL al recargar, y al guardar precio o costo desde un lote se recarga esa página.
- Empleados · Expediente de empleado más compacto: botones chicos y la incapacidad deja de ser un banner grande.
- Clientes · En editar cliente el RFC pasa a mayúsculas al escribir, y el modal de nueva dirección ya no se corta por la derecha.
- Configuración · En la razón social, junto al logo del sistema, se eligen los tres colores del degradado del menú; se guardan en la base y el navegador los aplica al entrar, incluido el fondo del celular.
- Configuración · El logo del menú queda más grande, sin el cuadro blanco, y si el PNG trae fondo blanco pegado al borde se recorta para asentarse en la barra.
- Órdenes de venta · Órdenes de venta y de compra usan la franja de resumen de clientes, con el mismo alto y skeleton, en web y móvil. En ventas, las bolitas de la gráfica quedan a la derecha de la búsqueda.
- Cotizaciones · Cotizaciones usa la misma franja de resumen que clientes, con el mismo alto y skeleton, en web y móvil.

#### Versión 0.0.149 · 23 nov

- Contabilidad · Cobranza: la pestaña, la búsqueda y los filtros quedan en la URL al recargar, y cada vista tiene un botón de actualizar junto al periodo.

#### Versión 0.0.148 · 23 nov

- POS Ventas · Las tarjetas de Ventas en caja quedaron en filas compactas para ver varios folios a la vez.
- Contabilidad · Cobranza POS: se quitó el ticket promedio de las tarjetas de forma de pago; quedan ventas y monto.
- POS Caja · Si Ventas regresa un folio que caja está cobrando, se le quita al momento y sale una ventana con el folio y el vendedor que lo regresó.

#### Versión 0.0.147 · 23 nov

- POS Ventas · Descuento porcentual al precio en el carrito (5%, 3% u otro), se guarda en la orden y solo se ve con el permiso Aplicar descuento al precio del módulo POS.

#### Versión 0.0.146 · 23 nov

- POS Caja · Ventas en caja se abre en un modal al centro: cada folio es una tarjeta con cliente, productos, totales y se puede desplegar para regresarla a ventas.
- aplicación · En el POS, Esc limpia la búsqueda y un segundo Esc sale de pantalla completa.
- aplicación y servidor · En POS Ventas se quitaron las franjas de tickets regresados y de corte; el aviso queda en la barra superior, en Tickets y Corte.
- servidor · El deploy del backend fallaba porque subtotal iba duplicado en las ventas y anticipos de caja. Se dejó una sola vez y el build ya pasa.

#### Versión 0.0.143 · 23 nov

- POS Caja · Los atajos del POS ya no usan teclas F: Ctrl+I abre el cliente, Ctrl+M las ventas en caja y Ctrl+Q el abono pendiente. F5 vuelve a recargar el navegador.

#### Versión 0.0.142 · 23 nov

- Clientes · En el POS, al buscar se marca el primer producto: las flechas lo mueven y Enter agrega ese. F1 abre el cliente. La lista tiene columnas y el precio ya no parece un botón.
- Productos · En el POS, el producto marcado de la búsqueda se pinta en violeta y los iconos de tarjetas y lista quedan centrados, con el activo resaltado.

#### Versión 0.0.141 · 23 nov

- Inventario · El ícono de margen en inventario totalizado muestra el origen con el tooltip del sistema al pasar el mouse.
- Configuración · El menú cerrado ya no dibuja dos líneas por sección y la P del logo no queda cortada.
- Inventario · Se puede marcar una lista de precios como predeterminada de márgenes. Inventario y el margen del producto usan ese precio; si no hay, siguen con la lista activa más antigua. Ventas no cambian.
- Cotizaciones · PDF del proceso de factura de anticipo para la madereria: desde la cotizacion en POS, el cobro en caja y la aplicacion al entregar la madera.
- POS Caja · El PDF de anticipo de la maderería ahora explica que la diferencia se cobra en POS Caja, sobre la orden, después de convertir.
- Productos · El PDF de factura de anticipo de la maderería quedó en lenguaje de usuario: habla de productos, no de líneas ni de solo madera.
- servidor · El PDF de anticipo ahora trae los clics de caja para cobrar la diferencia: Por cobrar, Ya pagado y Confirmar cobro.
- POS Ventas · Atajos F1 cliente y tecleo de producto, F5 para regresar lo que está en caja (si caja la tiene abierta se le quita y le avisa), título POS con ayuda, vista tarjetas o lista guardada, y consulta de otra sucursal sin vender. POS C
- Productos · Se corrigió el build: el margen del producto volvía a usar el mapa de precios tipado, así que price y price_list_name compilan.

#### Versión 0.0.139 · 20 nov

- Inventario · En inventario totalizado la cantidad de lotes abre el detalle, el origen del margen queda en un ícono al pasar el mouse y los tabs quedan pegados a la línea.
- Inventario · En los lotes de inventario totalizado la fecha queda corta, 18/08/2026, y más chica.
- Inventario · La fecha del lote en inventario totalizado queda humana y corta: Ago 18 26, en 11px.

#### Versión 0.0.138 · 20 nov

- Inventario · En inventario totalizado el nombre, la sucursal, la razón social, la unidad y la pastilla de margen quedan más chicos.

#### Versión 0.0.137 · 20 nov

- servidor · El recibo de pago ya no llama proyecto al nombre del lote: solo dice manzana y número de lote, sin el código.

#### Versión 0.0.136 · 20 nov

- aplicación · El modal de Contado vs financiado en el dashboard ya tiene margen, tarjetas con fondo y la lista dentro de un recuadro.
- Inventario · En inventario totalizado la unidad queda pegada a la derecha de la cantidad, y precio y costo pasan a columnas propias para que el margen no estire la fila.
- Órdenes de compra · En inventario totalizado los encabezados y los montos quedan con el mismo estilo del listado de órdenes de compra.

#### Versión 0.0.134 · 19 nov

- aplicación · Métricas: cada filtro de la lista explica al pasar el cursor qué incluye, y el texto de meses anteriores ya se lee completo.

#### Versión 0.0.132 · 19 nov

- aplicación · Métricas del mes: los conteos abren la lista filtrada y numerada. Se explica qué es una cuota y se quitó la cartera activa.
- Contratos · Listado de contratos: el alta dice Crear, Métricas es un texto junto al título y el título ya no va tan grande.

#### Versión 0.0.129 · 19 nov

- Contratos · Métricas de contratos: el monto del mes baja de tamaño y las tarjetas se acomodan al ancho disponible.

#### Versión 0.0.127 · 19 nov

- Contratos · Métricas de contratos: el ingreso del mes ya no falla por la collation, y el listado solo tiene el enlace Métricas, sin repetir Contratos.

#### Versión 0.0.125 · 19 nov

- servidor · Se configuró el punto de venta de verdulería en la sucursal TIJ-1: terminal de ventas, terminal de caja y vendedor de prueba con código 1001, con el rol de madería.
- POS Caja · Rutas de reparto por organización, apagadas hasta activarlas. La orden hereda la ruta del cliente, pide fecha tentativa solo si requiere envío, y lo mismo aplica en el alta admin, POS Ventas y POS Caja.
- aplicación y servidor · En la configuración del alta de órdenes, el valor por defecto de la fecha solo ofrecía Hoy y se cortaba si había un día fijo. Quedó la opción Fecha fija y se muestra el día guardado.
- Contratos · Etiqueta Contado o Financiado (E+F o F). Los que no tienen pagos de contrato quedan de contado, sin mensualidad. El alta va por pasos y, en contado, no pide enganche ni calendario; los abonos siguen en Enganche.
- Contratos · Dashboard Divino: Contado vs financiado usa el tipo de venta y al clic abre los contratos del periodo.
- Contratos · Pantalla de métricas por mes. Muestra lo que deberían entrar las mensualidades, lo ya cobrado, lo que falta y, aparte, los atrasos de meses anteriores.
- Contratos · Build de contratos: el saldo de contado se deshabilita con el tipo que espera el input, y se cerró la función de logística en la orden de venta.

#### Versión 0.0.119 · 12 nov

- Configuración · Configuración del alta de órdenes de venta por organización: visibilidad, obligatoriedad y valores por defecto. Sucursal oculta o única se asigna sola. El modal mantiene altura fija y mesa de control y envío pasan a interruptores.
- servidor · El guardado de la configuración de alta de órdenes no compilaba: el permiso se validaba con un solo argumento. Quedó la llamada con entidad sales_orders y acción Update.
- Logística · Se pidió que CEDIS Ensenada Alfredo Pérez y CEDIS Tijuana Rene Rangel vean choferes al crear envíos; el rol CEDIS no lista usuarios, y el alta ahora carga los choferes con el permiso de envíos.
- Proveedores · Importaciones Omar Moreno de Maderería no veía proveedores aunque tenía Ver proveedores: el menú acepta ese permiso y vendor/vendors cuentan como la misma entidad.
- Configuración · Al deshabilitar un producto repetido desde el tab Detalles se avisa si tiene inventario y se da de baja; el catálogo se puede filtrar por activos o deshabilitados.

#### Versión 0.0.116 · 11 nov

- Órdenes de venta · Órdenes de venta y de compra aceptan una nota por producto: se ve debajo del nombre y sale en el PDF.

#### Versión 0.0.115 · 10 nov

- Inventario · El buscador de inventario filtra al escribir con una pausa de 300 ms y también al pulsar Enter.
- aplicación · El detalle de transferencia muestra el aviso de posición más chico, el estado como pastilla y la fecha en palabras.
- aplicación y servidor · El lote avisa si tiene un cambio de posición o una transferencia pendiente y abre el detalle para recibirlo.
- Contratos · En contratos, el contador de filtros ya no se pinta como texto: los atributos quedaron en el componente.
- aplicación y servidor · Lotes filtra por manzana: dropdown exacto que también aplica a las tarjetas.

#### Versión 0.0.114 · 10 nov

- Órdenes de venta · Órdenes de venta, compras y cotizaciones también abren con la sucursal principal del usuario seleccionada.
- Inventario · En transferencias de inventario el listado solo muestra Ver detalle; recibir, cancelar, crear envío y PDF quedan dentro del detalle.

#### Versión 0.0.113 · 10 nov

- Órdenes de venta · Órdenes de venta, órdenes de compra y cotizaciones abren con la razón social de la sucursal principal del usuario.

#### Versión 0.0.112 · 10 nov

- Logística · Transferencias de la misma razón social ya no piden envío: se indica en el detalle, se reciben directo y al crearlas desde el lote queda preseleccionada esa razón social.
- Logística · El envío se omite solo si la transferencia cambia de almacén dentro de la misma sucursal; si cambia de sucursal sí pide envío. Desde el lote quedan preseleccionadas la razón social y la sucursal del lote.

#### Versión 0.0.109 · 9 nov

- servidor · Se documentó, a nivel negocio, cómo están hechos cuentas por pagar, cuentas por cobrar y flujo de deuda para replicarlos en otro proyecto.

#### Versión 0.0.108 · 9 nov

- Facturación · El botón Información de factura a público en general abre un modal chico, y se cierra con la X, el fondo o Escape.
- Facturación · En factura a público en general, la fila de la orden abre el modal de esa orden de venta. La casilla no lo abre.
- aplicación · En Cuentas por cobrar, el clic en cualquier columna de la fila abre las órdenes de esa razón social.

#### Versión 0.0.107 · 9 nov

- aplicación · El menú vuelve a mostrar Polux | ERP. La estrella queda solo en el favicon.
- Facturación · En factura a público en general quedó el botón Información, y en cada razón social la zona horaria, la hora de cierre, el timbrado automático del último día del mes y el bloqueo para no facturar la orden por separado después de esa hora. El
- Facturación · Se corrigió la migración de factura a público en general para que compilara y se aplicó en la base.

#### Versión 0.0.106 · 6 nov

- aplicación y servidor · Listas de precio con número y margen, y hoja de actualización de precio (últimas compras, promedio y precios por unidad) solo para la verdulería.
- Logística · En Flota y remolques, cada unidad muestra un badge de Disponible o En uso con el folio del envío activo.

#### Versión 0.0.105 · 4 nov

- Productos · En crear orden de venta, la búsqueda queda bajo las pestañas y al elegir el producto entra a la misma lista para editarlo ahí, sin una segunda fila de confirmar.
- Empleados · Se activó Cobranza/Contabilidad y Empleados (RH) para el rol Admin de la verdulería. La maderería ya los tenía.
- Proveedores · Cuentas por pagar no cargaba: faltaban columnas de domicilio del proveedor y ya quedaron en la base. La lista vuelve a mostrar la razón social, con Mes y Rango para recortar por fecha, y al abrir sigue el saldo completo.
- Clientes · En el detalle del cliente, Listas de precio recibía el id como texto y el componente lo espera numérico; ya usa el id de la ruta.

#### Versión 0.0.103 · 4 nov

- servidor · El interés moratorio del estado de cuenta quedó en cada mensualidad, además del total de la cabecera. Si la cuota no tiene interés, sale un guion.
- Clientes · Se pidió quitar el cuadro blanco de los filtros de Productos; quedaron en fila como Clientes y Proveedores, y en móvil el tipo se abre con el botón Filtros.

#### Versión 0.0.102 · 4 nov

- Cotizaciones · En el cliente se habilitan una o varias listas de precio, con una predeterminada, y esa se preselecciona al crear una orden o cotización.
- Clientes · En proveedor nacional, al crear y al editar, se puede subir la constancia del SAT para llenar RFC, razón social y domicilio, y esos datos se pueden corregir antes de guardar.
- Clientes · Se pidió cargar los clientes de Verdulería que venían en la hoja Clientes VTI; quedaron 254 en la organización, separados de los de Central por razón social, con crédito cuando el archivo traía límite.

#### Versión 0.0.101 · 4 nov

- Configuración · Polux ERP queda en el nombre de la pestaña, junto a la estrella. Arriba del menú ya no va el texto: se ve la estrella, o el logo de la razón social si está activo.
- Productos · En la alta de orden, la búsqueda de producto queda arriba y alineada con la lupa. Al elegir, los campos salen debajo, sin desbordarse al pie.

#### Versión 0.0.100 · 3 nov

- Facturación · Factura público en general dejaba de cargar: faltaba la columna de sucursal en la factura global y ya quedó aplicada.
- Contabilidad · Cobranza POS abre en el mes actual y, bajo el folio, indica si la venta es anticipo, crédito o contado.
- Contabilidad · Cobranza: Flujo de deuda y Rep. Vent. Cost. Prom. leen la sucursal de billing_branch_id, la misma URL que el resto de pestañas.
- Contabilidad · En Flujo de deuda los filtros quedan sueltos como en las otras pestañas de Cobranza, y Descargar Excel queda junto al periodo.
- aplicación · En el selector de periodo, al picar Mes se cierra el calendario del rango que se había quedado abierto.
- aplicación y servidor · Se pidió que el menú y la URL dejen de llamarse Reportes; quedó Reporte de requerimiento en /reporte-requerimiento, en la pantalla y en el API.
- aplicación · Se pidió achicar el reporte de requerimiento, ocultar los CEDIS y bajarlo a Excel; quedó más compacto, con engrane para elegir sucursales y botón Excel de lo que se ve.
- Productos · Se pidió juntar código y nombre en el reporte de requerimiento y explicar los badges; quedaron en la columna Producto, y chips, estados y tarjetas dicen al pasar el mouse qué son y cómo se calculan.
- Cotizaciones · En la alta de orden de venta y cotización, el producto se captura en una barra fija abajo: búsqueda por código o nombre, y al elegirlo se confirman unidad, lista, cantidad, precio, descuento e IVA 0/8/16 sin abrir otro modal.

#### Versión 0.0.99 · 3 nov

- Facturación · Facturas globales: la lista y Generar facturas quedan por sucursal y mes. Una vigente por sucursal, con el código postal de esa sucursal.
- Facturación · En Cobranza la pestaña se llama Factura público en general, igual que los avisos y la cancelación.
- aplicación y servidor · Al registrar venta faltaba la nota de observaciones: el modal ya la pide y se guarda en la orden para imprimirla en el ticket.
- Contabilidad · Cobranza POS vuelve a listar todas las ventas cobradas con su forma de pago, y de crédito solo los abonos ya pagados, con las tarjetas de totales sin permiso extra.
- Contabilidad · Cobranza POS vuelve a mostrar los totales por forma de pago: transferencias, efectivo, tarjetas, cheques y crédito, con ventas, monto y ticket.
- Contabilidad · Cobranza POS agrega en la fila de filtros Envío, Efectivo, Tarjeta y el resto de formas, cada uno con conteo y monto.
- Contabilidad · El anticipo ya no descuenta crédito: en Cobranza POS su total es lo que falta por cobrar, y solo la orden a crédito usa el disponible.
- aplicación y servidor · Cuentas por cobrar: el periodo solo muestra Mes y rango; se quitaron Hoy y Semana.
- servidor · El flujo de deuda solo cuenta órdenes a crédito y deja fuera el anticipo: el cargo es la parte a crédito y el abono de anticipo no entra.
- Cotizaciones · El build del punto de venta vuelve a compilar: el anticipo se lee solo cuando la confirmación es de cotización.
- Proveedores · Se pidió un módulo Reportes solo para Madería con existencias por proveedor y cuánto comprar; quedó la hoja por sucursal, con mínimos, máximos, utilidad y cantidad editable.
- Proveedores · La orden de compra impresa ahora muestra la unidad (pie lineal), las notas y la factura del proveedor; al guardar notas o factura se regenera el documento.

#### Versión 0.0.98 · 3 nov

- Cotizaciones · El saldo que queda fuera de un anticipo usa el crédito del cliente, sin duplicar cotización y orden, y Cobranza POS y punto de venta muestran lo cobrado y lo pendiente.

#### Versión 0.0.97 · 3 nov

- Contabilidad · Cobranza POS lista solo órdenes a crédito de clientes con crédito habilitado, pagadas o pendientes, y quita público en general y los filtros de forma de pago.
- Contratos · En el estado de cuenta se pidió el total vencido y los intereses moratorios: el PDF ya los muestra, sin sumarlos al saldo. El recibo no se guarda: al descargarlo usa la razón social del contrato.

#### Versión 0.0.96 · 3 nov

- Clientes · En Facturas globales, un texto indica que la lista son las órdenes que el cliente no facturó y que la factura global se emite con todas.

#### Versión 0.0.95 · 3 nov

- Inventario · En inventario totalizado el margen muestra precio y costo: cada lote usa su compra o, si no tiene, el costo configurado, y el producto es el promedio de esos lotes. El detalle del lote y el producto explican de donde sale.
- Clientes · En Cobranza se agregó la pestaña Facturas globales: por mes y razón social lista las órdenes de clientes sin facturar, con folio, fecha, totales y forma de pago, y timbra una sola factura; se puede consultar y cancelar.

#### Versión 0.0.94 · 3 nov

- servidor · El reporte de flujo de deuda, la antigüedad y su Excel muestran solo órdenes a crédito.
- Logística · Un envío puede llevar varias transferencias: desde el detalle se crea el envío o se agrega a uno existente, y en el viaje se pueden sumar más.

#### Versión 0.0.93 · 3 nov

- Facturación · En Cobranza POS, junto a Todas, Público en General y Facturadas, los filtros de forma de pago llevan ícono y se puede filtrar Crédito; las columnas también filtran e incluyen Crédito.

#### Versión 0.0.92 · 2 nov

- Logística · El envío de la factura por WhatsApp ahora manda primero una foto: tu pago está pendiente, o ya está pagada, con el total y los datos del CFDI.

#### Versión 0.0.91 · 2 nov

- WhatsApp · En la factura de la orden se puede enviar por WhatsApp a un teléfono o a un grupo, con el PDF y el XML.

#### Versión 0.0.90 · 2 nov

- servidor · Clonar una orden de venta ya no se bloquea si el comisionado no tiene código POS; se copia igual que en la orden original.

#### Versión 0.0.88 · 2 nov

- Contabilidad · En el reporte de punto de venta de cobranza, la fecha de pago del abono queda aparte de la fecha de cobro en caja, en la tabla y en el Excel.
- Órdenes de venta · Se pidió marcar órdenes de venta como para envío al crearlas en el alta, el listado y el punto de venta, y poder agregarlo después en caja o en el detalle. El reporte de puntos de venta en cobranza muestra la marca y un total de envío.

#### Versión 0.0.86 · 2 nov

- Configuración · El historial de versiones se arma en memoria con el catálogo y los módulos de cada organización, sin copiar filas, y la pantalla usa un cargador centrado.
- aplicación · El nombre visible pasó de Pollux a Polux: la pestaña dice Polux, arriba dice Polux ERP y el favicon es una estrella en PNG sin fondo.
- aplicación y servidor · El aviso de actualización lista las notas publicadas en app-version.json, sin consultar el historial, y Ver todas las versiones quedó como botón.
- Productos · Productos y Proveedores salen de Configuración y quedan en el menú principal, con permiso ViewMenu como el resto de vistas.

#### Versión 0.0.85 · 2 nov

- Productos · En la venta, si el producto o servicio no tiene unidad de medida, el mismo cuadro avisa y abre su ficha para asignarla. Al guardar un almacén de sucursal sin dirección válida, indica qué falta y permite usar la de la sucursal, en lugar de u
- aplicación y servidor · En caja, transferencia pide nombre o razón social, y tarjeta o cheque piden nombre y teléfono.
- aplicación y servidor · El crédito de cada razón social queda en pesos o dólares, y una venta en la otra moneda se convierte con el tipo de cambio de esa orden.
- aplicación y servidor · En caja, efectivo y mixto se cobran en pesos, en dólares o en las dos monedas.
- Órdenes de compra · Si IEPS está apagado en la razón social, ya no aparece en el producto, en órdenes de compra y venta, en el detalle, en PDF, Excel ni en la factura.
- Contabilidad · Cobranza POS: en la línea del reporte, un cobro mixto de caja muestra las formas usadas (efectivo + tarjeta, tarjeta + cheque, etc.) y el Excel usa el mismo texto.
- aplicación y servidor · En el corte parcial, el campo de cantidad de billetes en dólares se recortaba; ahora se ve completo.
- Clientes · En CRM, cada actividad muestra siempre el vendedor: el autor de la nota, o si no hay el vendedor del cliente, o quien lo registró.
- Contabilidad · En Cobranza, la sucursal queda en la URL de todos los reportes de contabilidad para que al recargar siga seleccionada.
- Contabilidad · En Cobranza POS, un cobro con importe muestra un ojo para ver el ticket, y vendedor y cajero ya no muestran el código.
- Proveedores · Se quitó el campo Nombre; el identificador queda en nombre de empresa en ficha, listados, compras, cuentas por pagar y Excel.
- aplicación y servidor · En caja, el cheque también se puede cobrar en dólares, con el tipo de cambio del corte.
- Órdenes de venta · Permiso ViewStats en inventario, órdenes de compra y órdenes de venta para ver las tarjetas de arriba; sin ese permiso no se muestran ni se entregan esos totales. Clientes ya lo tenía.
- Órdenes de compra · Pedimento en órdenes de compra: solo se guarda con el formato del SAT (15 dígitos) y el campo tiene máscara para capturarlo.
- Configuración · En el punto de venta las cartas del catálogo quedan más grandes: máximo tres por fila en monitor, y en pantallas angostas bajan a dos o una. El texto de stock y unidad queda centrado en las badges, sin pegarse arriba ni entre sí.

### Octubre 2026

#### Versión 0.0.83 · 31 oct

- Empleados · Listado de empleados: se aplicó la columna work_schedule que faltaba y tiraba 500
- Facturación · El PDF de la factura de OV no imprimía el IVA: el parser leía Impuestos del concepto en vez del comprobante; PDFs viejos se regeneran con ?regenerate=true

#### Versión 0.0.82 · 29 oct

- Empleados · Horario laboral en Editar usuario (tab Empleado) y botón Editar en el expediente para el admin

#### Versión 0.0.81 · 29 oct

- aplicación y servidor · Importar lotes: se quita la columna ubicacion; el grupo de cada fila es la ubicación
- Empleados · Portal de empleado: horario laboral semanal (lun-dom) que el empleado y RH pueden guardar

#### Versión 0.0.80 · 28 oct

- Cotizaciones · En el reporte de ventas a costo promedio, el folio de una cotización abre la cotización igual que el folio de una orden abre la orden.
- aplicación y servidor · Importar lotes: omite filas duplicadas o inválidas, importa el resto y deja lista copiable de las que no entraron

#### Versión 0.0.79 · 28 oct

- Logística · Junto a Editar, chofer y camión muestran palomita o aviso de carta porte en el cursor, y se creó un envío de prueba con la orden OSV-000315 de Rodolfo Sinergy.

#### Versión 0.0.78 · 28 oct

- Logística · En el alta y en un viaje existente, chofer y camión indican si la carta porte está completa y se pueden editar al elegirlos; se crearon 5 choferes y 5 camiones de prueba.

#### Versión 0.0.77 · 28 oct

- Logística · En la carta porte del envío se puede timbrar en demo para ver el PDF de prueba, y esa timbrada se puede reemplazar después por producción.

#### Versión 0.0.76 · 27 oct

- aplicación y servidor · Las solicitudes del día quedan en un changelog. El deploy escribe en el commit solo las pendientes y después las marca como enviadas.
