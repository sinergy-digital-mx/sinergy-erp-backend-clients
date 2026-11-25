const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const out = path.join(
  __dirname,
  '../src/api/quotations/docs/junta-anticipo-dos-casos-2026-11-25.pdf',
);

const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
doc.pipe(fs.createWriteStream(out));

doc.fontSize(16).text('Anticipo — proceso y dudas', { align: 'left' });
doc.moveDown(0.3);
doc.fontSize(10).fillColor('#444').text('25 de noviembre de 2026. Base para la junta. No es el manual completo.');
doc.fillColor('#000').moveDown();

doc.fontSize(12).text('Los dos casos');
doc.moveDown(0.4);
doc.fontSize(10);
doc.text('Caso 1. El cliente no sabe qué quiere. Deja un monto ya con IVA. La cotización no lleva maderas. La factura es una sola partida: Anticipo del bien o servicio (84111506, anticipo_CFDI).');
doc.moveDown(0.4);
doc.text('Caso 2. Sí sabe, pero no hay inventario. Esos productos se guardan en la cotización para saber qué quería y el total. La factura de anticipo sale igual, con el mismo concepto. Nunca lista las maderas.');
doc.moveDown(0.4);
doc.text('Ejemplo caso 1: deja $10,000 con IVA. Si al regresar se lleva $10,000, la factura de la mercancía queda en cero. Si se lleva $12,000, caja cobra $2,000.');
doc.moveDown(0.4);
doc.text('Ejemplo caso 2: presupuesto 199657, Julio Cesar Gallegos, total $15,323.51. Factura de anticipo CEN-112182, mismo importe, concepto de anticipo, UUID C8187856-ABAB-11F1-A2A3-D1E182A1BB16.');
doc.moveDown(0.4);
doc.text('Cierre, otra operación: ROS-38565 queda en $0. Descuentos $11,517.78. Tipo de relación 07. UUID Rel AA4230F8-C1B2-11F1-8B4A-45F5B4CD3064. Uso S01.');

doc.moveDown();
doc.fontSize(12).text('Cómo queda en el sistema');
doc.moveDown(0.4);
doc.fontSize(10);
doc.text('1. POS Ventas, botón Anticipo, o Pedir anticipo en el detalle. Se elige el caso y el monto con IVA. Va a la caja de esa sucursal.');
doc.moveDown(0.3);
doc.text('2. Caja lo cobra como una venta. Ahí se timbra. Sin corte abierto no hay factura. Uso G01, método PUE.');
doc.moveDown(0.3);
doc.text('3. Cuando regresa, Folios o el detalle: Generar venta. Se agregan los productos. Tiene que ser igual o mayor al anticipo.');
doc.moveDown(0.3);
doc.text('4. Se crea la orden. La factura de la mercancía lleva el descuento del anticipo, el UUID Rel y la nota de crédito. Si sobra por cobrar, caja cobra la diferencia.');

doc.moveDown();
doc.fontSize(12).text('Dudas');
doc.moveDown(0.4);
doc.fontSize(10);
doc.text('1. Si la venta es menor al anticipo, el sistema no la deja. Falta decidir si el sobrante es saldo a favor del cliente o una nota de crédito.');
doc.moveDown(0.3);
doc.text('2. Hoy se timbran las dos cosas: la factura con descuento y la nota de crédito. La foto ROS-38565 solo muestra la factura en cero. Confirmar si la nota de crédito se queda.');
doc.moveDown(0.3);
doc.text('3. En el presupuesto venía escrito «80% para crédito». El wizard, si se llevan más, manda la diferencia a caja. Confirmar si a veces ese resto debe ir a crédito del cliente.');

doc.end();
console.log(out);
