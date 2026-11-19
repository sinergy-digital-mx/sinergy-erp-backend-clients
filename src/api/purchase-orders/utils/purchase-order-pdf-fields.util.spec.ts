import {
  receivedLineUomName,
  requestedLineUomName,
  vendorInvoicePdfText,
} from './purchase-order-pdf-fields.util';

describe('purchase-order-pdf-fields.util', () => {
  it('usa el nombre de la unidad pedida, por ejemplo pie lineal', () => {
    expect(
      requestedLineUomName({
        product_uom: { uom: { name: '  Pie lineal  ' } },
      }),
    ).toBe('Pie lineal');
  });

  it('cae a UOM si la relación no vino cargada', () => {
    expect(requestedLineUomName({})).toBe('UOM');
    expect(requestedLineUomName({ product_uom: { uom: { name: '   ' } } })).toBe('UOM');
  });

  it('en recepción prefiere la unidad recibida', () => {
    expect(
      receivedLineUomName({
        received_uom: { name: 'Pieza' },
        product_uom: { uom: { name: 'Pie lineal' } },
      }),
    ).toBe('Pieza');
  });

  it('imprime las facturas del proveedor o el texto vacío', () => {
    expect(
      vendorInvoicePdfText(
        { vendor_invoice_numbers: ['A-1', 'B-2'], vendor_invoice_number: 'A-1' },
        'Sin factura de proveedor',
      ),
    ).toBe('A-1 · B-2');
    expect(vendorInvoicePdfText({}, 'Sin factura de proveedor')).toBe(
      'Sin factura de proveedor',
    );
  });
});