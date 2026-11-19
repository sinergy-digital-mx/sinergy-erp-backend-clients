import {
  buildCloneSalesOrderDto,
  carryOverCustomDescriptions,
  CloneSourceOrder,
} from './sales-order-clone.util';
import { lineConceptName } from './sales-order-line-name.util';

const source: CloneSourceOrder = {
  fiscal_configuration_id: 'fc-1',
  billing_branch_id: 'br-1',
  customer_id: 7,
  sales_order_type: 'MANUAL',
  currency: 'MXN',
  sale_scope: 'services',
  notes: 'nota original',
  seller_user_id: 'u-1',
  line_items: [
    {
      id: 'l-1',
      product_id: 'p-1',
      product_uom_id: 'pu-1',
      quantity: '1',
      unit_price: '5000.0000',
      discount_percentage: '10',
      iva_percentage: '16',
      custom_description: 'Desarrollo octubre',
    },
    {
      id: 'l-2',
      product_id: 'p-2',
      product_uom_id: 'pu-2',
      quantity: 2,
      unit_price: 100,
      product_discount_id: 'd-1',
      iva_percentage: 16,
    },
  ],
};

describe('buildCloneSalesOrderDto', () => {
  it('copia todo y aplica concepto y precio nuevos', () => {
    const dto = buildCloneSalesOrderDto(
      source,
      {
        lines: [{ line_id: 'l-1', custom_description: ' Desarrollo septiembre ', unit_price: 4500 }],
      },
      '2026-10-21',
    );
    expect(dto.customer_id).toBe(7);
    expect(dto.expected_delivery_date).toBe('2026-10-21');
    expect(dto.sales_order_type).toBe('MANUAL');
    expect(dto.notes).toBe('nota original');
    expect(dto.line_items[0]).toMatchObject({
      product_id: 'p-1',
      unit_price: 4500,
      custom_description: 'Desarrollo septiembre',
      discount_percentage: 10,
      iva_percentage: 16,
    });
    expect(dto.line_items[1]).toMatchObject({
      unit_price: 100,
      product_discount_id: 'd-1',
      quantity: 2,
    });
    expect(dto.line_items[1].custom_description).toBeUndefined();
  });

  it('conserva el concepto origen si no se cambia y permite notas nuevas', () => {
    const dto = buildCloneSalesOrderDto(source, { notes: 'nueva' }, '2026-10-21');
    expect(dto.line_items[0].custom_description).toBe('Desarrollo octubre');
    expect(dto.notes).toBe('nueva');
  });

  it('rechaza líneas ajenas', () => {
    expect(() =>
      buildCloneSalesOrderDto(source, { lines: [{ line_id: 'x' }] }, '2026-10-21'),
    ).toThrow('no pertenece');
  });
});

describe('carryOverCustomDescriptions', () => {
  it('conserva el concepto de la línea equivalente', () => {
    const incoming = [
      { product_id: 'p-1', product_uom_id: 'pu-1' },
      { product_id: 'p-2', product_uom_id: 'pu-2', custom_description: 'Otro' },
    ];
    carryOverCustomDescriptions(
      [{ product_id: 'p-1', product_uom_id: 'pu-1', custom_description: 'Concepto' }],
      incoming,
    );
    expect((incoming[0] as { custom_description?: string }).custom_description).toBe('Concepto');
    expect(incoming[1].custom_description).toBe('Otro');
  });
});

describe('lineConceptName', () => {
  it('prefiere el concepto libre', () => {
    expect(lineConceptName({ custom_description: ' X ', product: { name: 'P' } })).toBe('X');
    expect(lineConceptName({ custom_description: null, product: { name: 'P' } })).toBe('P');
    expect(lineConceptName({})).toBe('Producto');
  });
});
