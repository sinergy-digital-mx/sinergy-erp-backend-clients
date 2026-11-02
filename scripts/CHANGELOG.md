# Changelog de solicitudes

Generado desde `scripts/changelog.json`. No editar a mano.

Cada solicitud terminada entra en **Pendientes**. `npm run deploy:both` y `npm run deploy` del backend escriben en el commit solo esas entradas y las pasan a **Enviados**.

## Pendientes

No hay solicitudes pendientes de deploy.

## Enviados

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
