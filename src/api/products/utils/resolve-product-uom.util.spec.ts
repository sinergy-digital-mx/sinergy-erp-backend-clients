import { QueryRunner } from 'typeorm';
import { resolveProductUomForLine } from './resolve-product-uom.util';

function runner(rows: unknown[][]): QueryRunner {
  const query = jest.fn();
  rows.forEach((row) => query.mockResolvedValueOnce(row));
  return { manager: { query } } as unknown as QueryRunner;
}

describe('resolveProductUomForLine', () => {
  const productId = 'prod-1';
  const tenantId = 'tenant-1';

  it('usa la fila de product_uoms cuando el id coincide', async () => {
    const qr = runner([
      [{ id: 'pu-1', factor: '2', is_base: 0, uom_catalog_id: 'cat-1' }],
    ]);

    await expect(resolveProductUomForLine(qr, productId, 'pu-1', tenantId)).resolves.toEqual({
      id: 'pu-1',
      factor: 2,
      is_base: false,
      uom_catalog_id: 'cat-1',
    });
  });

  it('si el id es del catálogo y el producto no lo tiene, lo liga y lo devuelve', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '39656255-872d-48b3-856d-27f2c8c47b28' }])
      .mockResolvedValueOnce([{ id: productId }])
      .mockResolvedValueOnce([{ id: 'base-uom' }])
      .mockResolvedValueOnce([]);
    const qr = { manager: { query } } as unknown as QueryRunner;

    const resolved = await resolveProductUomForLine(
      qr,
      productId,
      '39656255-872d-48b3-856d-27f2c8c47b28',
      tenantId,
    );

    expect(resolved.uom_catalog_id).toBe('39656255-872d-48b3-856d-27f2c8c47b28');
    expect(resolved.factor).toBe(1);
    expect(resolved.is_base).toBe(false);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO product_uoms'),
      expect.arrayContaining([productId, '39656255-872d-48b3-856d-27f2c8c47b28', 0]),
    );
  });

  it('rechaza un id que no es del producto ni del catálogo', async () => {
    const qr = runner([[], [], []]);

    await expect(resolveProductUomForLine(qr, productId, 'missing', tenantId)).rejects.toThrow(
      'UOM no encontrado: missing',
    );
  });
});
