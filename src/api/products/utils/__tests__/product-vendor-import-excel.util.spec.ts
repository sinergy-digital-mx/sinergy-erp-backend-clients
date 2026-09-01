import {
  buildVendorImportTemplate,
  parseMoney,
  parseVendorImportExcel,
  vendorImportFilename,
} from '../product-vendor-import-excel.util';

describe('product-vendor-import-excel.util', () => {
  it('parseMoney acepta número, $ y comas', () => {
    expect(parseMoney(12.5)).toBe(12.5);
    expect(parseMoney('$1,234.50')).toBe(1234.5);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(null)).toBeNull();
  });

  it('arma un nombre de archivo sin acentos', () => {
    expect(vendorImportFilename('cost', 'Maderas Pérez')).toMatch(
      /^costos-proveedor-maderas-perez-\d{4}-\d{2}-\d{2}\.xlsx$/,
    );
  });

  it('genera template de costos y lo vuelve a leer', async () => {
    const buffer = await buildVendorImportTemplate({
      kind: 'cost',
      title: 'Costos — Demo',
      subtitle: 'Prueba',
      contextLines: ['Proveedor: Demo'],
      rows: [
        {
          sku: 'ENC16',
          name: 'ENCINO 1X6',
          uom: 'Pieza',
          currency: 'MXN',
          is_active: 'Sí',
          current_value: 2.215,
          new_value: 2.5,
          _id: 'cost-1',
          _product_id: 'prod-1',
          _product_uom_id: 'uom-1',
        },
        {
          sku: 'SKIP',
          name: 'Sin cambio',
          uom: 'Pieza',
          currency: 'USD',
          is_active: 'Sí',
          current_value: 10,
          new_value: null,
          _id: 'cost-2',
          _product_id: 'prod-2',
          _product_uom_id: 'uom-2',
        },
      ],
    });

    const rows = parseVendorImportExcel(buffer, 'cost');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      sku: 'ENC16',
      uom: 'Pieza',
      new_value: 2.5,
      id: 'cost-1',
      product_id: 'prod-1',
      product_uom_id: 'uom-1',
    });
    expect(rows[1].new_value).toBeNull();
    expect(rows[1].id).toBe('cost-2');
  });

  it('genera template de precios y lo vuelve a leer', async () => {
    const buffer = await buildVendorImportTemplate({
      kind: 'price',
      title: 'Precios — Demo',
      subtitle: 'Lista mostrador',
      contextLines: ['Lista: Mostrador'],
      rows: [
        {
          sku: 'ENC16',
          name: 'ENCINO 1X6',
          uom: 'Pieza',
          price_list: 'Mostrador',
          is_active: 'Sí',
          current_value: 99.5,
          new_value: 110,
          _id: 'price-1',
          _product_id: 'prod-1',
          _product_uom_id: 'uom-1',
          _price_list_id: 'list-1',
        },
      ],
    });

    const rows = parseVendorImportExcel(buffer, 'price');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sku: 'ENC16',
      new_value: 110,
      id: 'price-1',
      price_list_id: 'list-1',
    });
  });
});
