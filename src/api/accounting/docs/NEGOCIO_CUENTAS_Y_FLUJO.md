# Cuentas por pagar, cuentas por cobrar y flujo de deuda

Fecha: 2026-11-09

Fecha de cambio: 2026-11-09 — El corte de la empresa es nuestra razón social.

Cómo están hechos estos tres reportes de Cobranza, a nivel negocio, para reconstruirlos en otro sistema con sus propios documentos. No describe pantallas de caja, cortes del día ni factura a público en general.

Los tres viven como pestañas de la misma Cobranza. Cada uno responde una pregunta distinta. No se pueden sustituir entre sí.

| Reporte | Pregunta | De quién | Corte |
|---------|----------|----------|-------|
| Cuentas por pagar | ¿Cuánto le debemos hoy a cada proveedor? | Proveedores, por orden de compra, de nuestra razón social | Saldo abierto. El mes o un rango solo dejan las órdenes creadas en esas fechas |
| Cuentas por cobrar | ¿Qué órdenes de venta siguen sin pagarse, agrupadas por la razón social del cliente? | Clientes con nombre real, de nuestra razón social | Saldo abierto completo. No se recorta por fechas |
| Flujo de deuda | ¿Cómo envejeció el crédito y qué cargos y abonos hubo? | Solo ventas a crédito, contra nuestra razón social | Antigüedad al cierre del periodo. Flujo dentro del rango, con saldo inicial |

El corte de la empresa es **nuestra razón social**: en cuentas por pagar, la que compró; en cuentas por cobrar y en el flujo de deuda, la que facturó. En pagar y en cobrar puede ir vacía, y entonces entran todas. En el flujo hay que elegirla. Nombre, RFC, folio, nuestra razón social y vencimiento se congelan cuando nace el movimiento del libro.

Pesos y dólares no se suman entre sí. El único número mezclado es un **total en pesos**: pesos más dólares por el tipo de cambio del día que tiene cargado el sistema. Si hay dólares y ese tipo de cambio no existe, el total en pesos queda en blanco. El tipo de cambio es el mismo en todas las filas. Es el del sistema, no el de cada documento.

El día de la empresa es el de Baja California. “Hoy”, “este mes” y la hora de un movimiento se leen en ese calendario. La semana empieza en lunes.

---

## 1. Cuentas por pagar

Es la deuda con proveedores, de nuestra razón social, la que compró. Vacía significa todas. Al abrirla se ve el saldo pendiente completo. Hay un botón **Todo el saldo** para volver a eso. Si se elige el mes actual o un rango, la lista, el detalle y el Excel dejan solo las órdenes de compra **creadas** en esas fechas. Hoy y esta semana no recortan nada.

### Qué entra

Una orden de compra entra si las tres cosas se cumplen:

1. Sigue marcada como pendiente de pago.
2. No está cancelada.
3. Después de restar lo ya pagado, todavía queda saldo.

Además entra un proveedor que ya no tenga órdenes pendientes, si nos queda **saldo a favor** con él en esa razón social. El saldo a favor es dinero que le pagamos de más. No se resta del adeudo: va en su propia columna, en la misma moneda del pago. Si después se aplica a otra orden, baja de esa columna.

### Cuánto se debe de una orden

Se toma un total y se le restan los pagos ya registrados de esa orden. El pago tiene que ir en la moneda de pago de la orden. Lo que sobra del pago no se queda en la orden: pasa a saldo a favor del proveedor.

El total, según cómo esté la orden:

- **Con costo real guardado** (tipo de cambio de aduana, o mercancía y gastos de desembarque ya capturados). El adeudo es el **total factura** de la moneda de pago: la mercancía más los gastos que se marcaron para ir en la factura del proveedor. Los demás gastos de la operación no son deuda. Si ese total factura no existe o es cero, se usa el total de catálogo.
- **Sin costo real.** El total de catálogo. Si la orden ya está recibida y el recibido es mayor que cero, se usa lo recibido. Si no, se usa lo solicitado.

Una orden cancelada no entra aunque siga marcada como pendiente. Si el pendiente llega a cero, la orden sale del reporte y queda pagada.

### Cómo se ve

Tres vistas, una a la vez: **Ambos**, **Pesos** y **Dólares**. Cada una descarga su Excel.

Tarjetas, sobre el universo filtrado y no solo sobre la página:

- Proveedores con saldo
- Adeudado en pesos, con cuántas órdenes
- Adeudado en dólares, con cuántas órdenes
- Total en pesos, con el tipo de cambio del día y el conteo de órdenes de las monedas visibles
- A favor en pesos
- A favor en dólares

En Pesos se ocultan dólares. En Dólares se ocultan pesos. Un proveedor entra en Pesos si debe pesos o tiene saldo a favor en pesos. Igual en dólares. En Ambos entra si debe o tiene saldo a favor en cualquiera de las dos.

Tabla, de mayor adeudo a menor. En Ambos y en Pesos manda el adeudo en pesos y, si empatan, el de dólares. En Dólares manda el adeudo en dólares.

| Columna | Qué es |
|---------|--------|
| Razón social | La del proveedor. Si el nombre comercial es distinto, va debajo |
| Monto adeudado | En la moneda de la vista, con una pastilla de cuántas órdenes de compra |
| Saldo a favor | Lo que le pagamos de más, aparte del adeudo |
| Tipo de cambio | El del día, igual en todas las filas. Si no hay, un guion |
| Total en pesos | Ambos: pesos + dólares × tipo de cambio. Pesos: solo pesos. Dólares: dólares × tipo de cambio. Con dólares y sin tipo de cambio, guion |
| Progreso | Una barra por moneda visible |

La barra de pesos, si el proveedor tiene límite de crédito, es adeudo en pesos entre ese límite. El límite no tiene moneda, así que en dólares no se usa. Sin límite, la barra es lo que falta entre lo ya comprometido de esas órdenes (pendiente más pagado): dice qué tanto del compromiso sigue abierto. En dólares siempre es esa segunda cuenta. Verde por debajo de 50 %, amarillo de 50 % a 80 %, rojo por encima de 80 %. La barra se llena hasta 100 %, pero el porcentaje puede pasar de 100 % si el adeudo supera el límite.

La búsqueda es por nombre, razón social o nombre comercial del proveedor.

El clic en la fila abre, sin salir de Cobranza, las órdenes pendientes de ese proveedor en las mismas fechas y la misma razón social nuestra. En Pesos solo las de pesos. En Dólares solo las de dólares. Cada una trae folio, fecha, entrega esperada, moneda, pagado, pendiente y estatus. El folio abre la orden de compra encima. El encabezado también muestra el saldo a favor.

Vacío: “Sin proveedores”, “Sin adeudos en pesos” o “Sin adeudos en dólares”, según la vista.

### Excel

Respeta búsqueda, vista, razón social nuestra y fechas. Trae a todos, no solo la página.

- **Ambos:** razón social, órdenes y adeudo en pesos, a favor en pesos, órdenes y adeudo en dólares, a favor en dólares, total en pesos, y una fila de total.
- **Ambos detallado:** una fila por orden pendiente, juntas las de la misma razón social y de la más antigua a la más reciente. Razón social, fecha, folio, factura del proveedor, formas de pago ya registradas (unidas con “+”, o “Pendiente” si no hay), moneda y lo que falta por pagar. Al final, un total en pesos y otro en dólares, sin convertirlos.
- **Pesos** y **Dólares:** razón social, órdenes pendientes, monto adeudado, saldo a favor, total en pesos y progreso.

Arriba de cada hoja va el tipo de cambio del sistema y su fecha. Si no hay tipo de cambio, la hoja lo dice.

---

## 2. Cuentas por cobrar

Es la foto de las órdenes de venta que siguen sin pagarse. No es el estado de cuenta del crédito y no envejece saldos. No filtra por fecha: es todo lo que sigue pendiente. Nuestra razón social es opcional. Vacía significa todas. Es la razón de la venta, la que factura.

### Qué entra

Una orden de venta entra si:

1. Sigue marcada como pendiente de pago.
2. No está cancelada.
3. Ya no está en cola. En cola la venta existe, pero todavía no se liberó, y por eso aún no es una cuenta por cobrar.
4. El cliente es una cuenta real. Quedan fuera el mostrador y el público en general.
5. Después de la nota de crédito, el monto de la lista sigue siendo mayor que cero.

Entra también una venta de contado de un cliente con nombre, si esa orden sigue pendiente. El flujo de deuda, en cambio, solo guarda las ventas a crédito. Por eso los dos reportes no tienen que coincidir.

### Cuánto muestra la lista

La lista toma el total de la orden y le resta solo la parte de las notas de crédito vigentes que baja lo que todavía no se había cobrado.

Los abonos parciales no bajan este número. Mientras la orden siga pendiente, un abono parcial no cambia la lista. Cuando la orden queda pagada, sale completa.

De una nota de crédito:

- Lo que cubre dinero aún no cobrado baja este reporte.
- Lo que cubre dinero ya cobrado se vuelve saldo a favor del cliente y no baja más este reporte.
- Una nota cancelada no cuenta.

El detalle de la fila y la hoja detallada del Excel muestran el **total del documento** de cada orden, sin restar la nota ni los abonos. La lista es la que descuenta la nota.

### Cómo se agrupa

Una fila por razón social, no por cliente. El nombre se toma en este orden: la razón social guardada en la orden, la razón social fiscal del cliente, el nombre de la empresa, el nombre de la persona. Si no hay ninguno, “Sin razón social”.

Dos clientes distintos con la misma razón social se juntan en una fila y sus órdenes se suman. El RFC es el primero que aparezca entre esas órdenes. Si no hay RFC, se muestra “Sin RFC”.

La moneda es la de la orden. Si no trae moneda, se toma pesos.

### Cómo se ve

Las mismas tres vistas: Ambos, Pesos y Dólares. La búsqueda, por razón social del cliente o RFC, va arriba, a la izquierda de nuestra razón social.

Tarjetas:

- Cuentas con saldo
- Por cobrar en pesos, con cuántas órdenes
- Por cobrar en dólares, con cuántas órdenes
- Total en pesos, con el tipo de cambio y el conteo de órdenes de las monedas visibles

No hay límite de crédito, ni barra de progreso, ni saldo a favor del cliente en esta pantalla.

Tabla, ordenada igual que cuentas por pagar: primero el mayor saldo en pesos y, a igual pesos, el mayor en dólares.

| Columna | Qué es |
|---------|--------|
| Razón social | Compacta. El RFC va debajo, en una pastilla |
| Por cobrar | Monto de la lista y pastilla de cuántas órdenes, por moneda visible |
| Tipo de cambio | El del sistema |
| Total en pesos | La misma fórmula que en cuentas por pagar |

El clic en cualquier parte de la fila abre las órdenes pendientes de esa razón social del cliente, con la misma razón social nuestra. El encabezado trae razón social, RFC, cuántas órdenes y la suma de los totales del documento en cada moneda. La tabla trae folio, fecha, cliente, vendedor, moneda, total del documento y entrega esperada. El folio abre la orden de venta.

Vacío: “Sin adeudos”, “Sin adeudos en pesos” o “Sin adeudos en dólares”.

Página de 20. Las tarjetas son del universo filtrado, no de la página.

### Excel

Misma búsqueda, razón social nuestra y vista. Todos los registros.

- **Ambos:** razón social, RFC, órdenes y por cobrar en pesos, órdenes y por cobrar en dólares, total en pesos, y fila de total.
- **Ambos detallado:** una fila por orden, agrupada por razón social y de la más antigua a la más reciente. Razón social, fecha, folio, factura (el folio fiscal timbrado, o “Sin factura”), tipo de pago, moneda y total del documento. El tipo de pago son las formas ya cobradas, unidas con “+”. Si no hay cobros y la orden es a crédito, dice “Crédito”. Si no hay cobros y no es crédito, dice “Pendiente”. Totales separados de pesos y de dólares.
- **Pesos** y **Dólares:** una hoja cada una, con el por cobrar de esa moneda.

Arriba va el tipo de cambio del sistema.

---

## 3. Flujo de deuda

Es el libro del crédito. Solo entran órdenes vendidas a crédito. Una venta de contado no entra, aunque haya quedado pendiente o tenga movimientos viejos. El mostrador no entra. El anticipo no es deuda.

El libro se lleva contra **nuestra** razón social, la que facturó, porque el crédito del cliente es por esa razón social. Sin elegirla, el reporte no calcula y pide seleccionarla.

Hay dos vistas del mismo libro.

### Antigüedad

Responde cuánto debe cada cliente al **último día del periodo**. El inicio del rango no se usa. Si el periodo es el mes, el corte es hoy, no el fin de mes calendario futuro.

Solo cuentan órdenes a crédito cuyo saldo, después del último movimiento hasta ese día, sigue arriba de cero. El saldo de cada orden es el que quedó en el libro, ya sin anticipo.

Una fila por cliente. Dos clientes con la misma razón social no se juntan. El nombre, el RFC, el folio y nuestra razón social son los que se congelaron cuando ocurrió el movimiento.

La moneda es la de la orden. Pesos y dólares van en columnas distintas y no se suman.

El vencimiento de cada orden se congeló el día del cargo: ese día más los días de crédito que el cliente tenía entonces con esa razón social nuestra. Si no tenía días, vence el mismo día del cargo. Cambiar después los días de crédito no mueve los vencimientos ya nacidos.

Las cubetas se miden contra la fecha de corte, en días de calendario desde el vencimiento:

| Cubeta | Cuándo |
|--------|--------|
| Por vencer | Vence el día del corte o después. También si la orden no tiene fecha de vencimiento |
| 1 a 30 | Lleva de 1 a 30 días vencida |
| 31 a 60 | |
| 61 a 90 | |
| Más de 90 | |

En la pantalla cada moneda muestra el saldo, cuántas órdenes, lo que está por vencer y, si hay, el vencido (la suma de las cuatro cubetas vencidas). El detalle de 1-30, 31-60, 61-90 y más de 90 va en el recuadro al pasar el cursor y en el Excel.

El límite y los días de crédito de la fila son los **actuales**, y solo si el crédito de ese cliente con esa razón social sigue activo. Si no, van vacíos. No se usan para calcular el saldo. El saldo sale del libro.

Orden: primero quien tiene más órdenes abiertas, luego el mayor saldo en pesos, luego el mayor en dólares, luego el nombre.

Tarjetas y pie de tabla, del universo filtrado:

- Clientes, y cuántas órdenes abiertas
- Pesos, con cuántas órdenes
- Dólares, con cuántas órdenes

El clic en el cliente abre el Flujo de ese cliente, con una pastilla para quitar el filtro.

Vacío: “Sin saldos al corte”.

### Flujo

Es el kardex del rango. Antes de los movimientos del rango, cada orden a crédito que ya debía algo aparece como **saldo inicial**: solo el día de inicio, sin cargo ni abono, con el saldo que esa orden traía. Después van los movimientos ocurridos dentro del rango, con fecha y hora de Baja California.

Orden de lectura: por nombre de cliente, primero sus saldos iniciales, luego los movimientos por hora y folio.

| Columna | Qué es |
|---------|--------|
| Fecha | Día y hora. En el saldo inicial, solo el día. Si el movimiento tiene vencimiento, se muestra “Vence …” |
| Cliente | Nombre, RFC y nuestra razón social, congelados |
| Orden | Folio y moneda. El folio abre la orden de venta |
| Movimiento | Título y una frase de qué pasó |
| Cargo | Lo que aumenta la deuda, en la moneda de la orden |
| Abono | Lo que la baja, en la misma moneda |
| Saldo de la orden | Lo que esa orden debe después del movimiento |
| Saldo MXN y Saldo USD | Saldo corrido del cliente dentro de este reporte, separado por moneda |

El saldo del cliente que se pinta se recalcula con las filas de esta consulta, moneda por moneda. Un movimiento de dólares solo mueve la columna de dólares. La otra columna muestra guion mientras siga en cero, salvo en el movimiento de su propia moneda, donde el cero sí se ve.

Vacío: “Sin flujo en el periodo”.

### Qué se anota en el libro, y cuándo

Cada hecho se anota una sola vez. Al anotarlo se guardan el nombre, el RFC, el folio, nuestra razón social y el vencimiento. Después no se recalculan.

**Nace un cargo** en estos casos:

- En caja se cierra una venta **a crédito**. El cargo es la parte que quedó a deber. Cobrar de contado en caja no abre deuda.
- Se crea a mano una orden de venta que ya nace pendiente de pago, no viene de una cotización y no es de mostrador.
- Llega un abono que no es anticipo, sobre una orden que todavía no tenía cargo, y ese abono no es el cobro de contado de caja. Primero se anota el cargo por lo que debía antes de ese abono, y enseguida el abono, para que el saldo de la orden cuadre.

El monto del cargo es lo que la orden debía en ese momento, sin pasar del tope de crédito. Ese tope es el total de la orden menos el anticipo cubierto. El anticipo cubierto es el mayor entre lo que se pidió de anticipo, lo que ya se cobró de anticipo y lo que ya se facturó de anticipo. Si se pidió anticipo, manda lo pedido, salvo que se haya cobrado más: entonces manda lo cobrado.

**Nace un abono** cuando se aplica un pago a esa orden y el pago no es el propio cargo de crédito ni un anticipo. Lleva la forma de pago y la referencia.

**Cancelar la orden** quita solo el saldo que esa orden todavía debía. Lo ya cobrado no se devuelve por este libro.

**Borrar un abono** vuelve a subir ese importe.

**Nota de crédito** baja solo la parte que la orden aún debía. Lo que la nota cubre de dinero ya cobrado queda como saldo a favor del cliente y no entra aquí. Si la nota se cancela, regresa al libro el importe que ella había bajado.

El abono de anticipo no se lista. El cargo queda en el total menos ese anticipo. Los demás abonos sí bajan ese saldo.

Los títulos del movimiento son: Cargo, Abono, Cancelación, Reversa de abono, Nota de crédito, Reversa de nota de crédito y Saldo inicial.

### Filtros y Excel

| Filtro | Regla |
|--------|--------|
| Razón social nuestra | Obligatoria. La deuda es del cliente contra esa razón |
| Buscar | Cliente, RFC o folio. Se aplica al oprimir Enter |
| Cliente | Se llena al abrir a alguien desde Antigüedad |
| Periodo | Hoy, semana (lunes a hoy), mes (día 1 a hoy), año (1 de enero a hoy) o un rango. Al entrar, el mes |

Antigüedad usa solo el fin del periodo. Flujo usa el rango completo más los saldos iniciales.

Página de 50. El Excel baja todo, sin paginar.

- Antigüedad: cliente, RFC, razón social nuestra, órdenes y las cinco cubetas en pesos, total en pesos, lo mismo en dólares, días de crédito y límite. Con fila de totales.
- Flujo: fecha, cliente, RFC, razón social nuestra, movimiento, orden, detalle, método, referencia, vencimiento, cargo, abono, moneda, saldo de la orden, saldo en pesos y saldo en dólares.

---

## Cómo armarlo en el otro sistema

Cada reporte puede vivir solo. Lo que tiene que conservarse es la regla de negocio, no la forma de guardarlo.

1. **Cuentas por pagar** se calcula al vuelo sobre las órdenes de compra que siguen pendientes, de nuestra razón social. Hace falta, por orden: la razón social que compró, moneda de pago, fecha de alta, si está cancelada, total de catálogo (solicitado y recibido), total factura cuando hay costo real, pagos aplicados y el saldo a favor del proveedor por moneda. El saldo a favor nace del excedente de un pago y baja cuando se aplica a otra orden.
2. **Cuentas por cobrar** se calcula al vuelo sobre las órdenes de venta que siguen pendientes, de clientes reales y ya liberadas. Hace falta el total del documento, la moneda, la razón social y el RFC del cliente, nuestra razón social de la venta, y las notas de crédito vigentes para saber qué parte baja lo no cobrado y qué parte ya es saldo a favor. Los abonos no mueven la lista mientras la orden siga pendiente.
3. **Flujo de deuda** necesita un libro que se escriba en el momento del hecho y ya no se reescriba: cargo, abono, cancelación, reversa de abono, nota de crédito y reversa de nota. Cada línea guarda cliente, nuestra razón social, folio, moneda, vencimiento congelado, importes y el saldo de esa orden después del movimiento. El anticipo se aparta antes de mostrar el libro. La antigüedad y el flujo se leen de ese libro, no se recalculan desde las órdenes.

El tipo de cambio del día es un dato de la empresa, uno solo, de dólares a pesos. Sin él, el total en pesos de quien tenga dólares queda en blanco.
