import { toPropertyLotLookup } from './property-lot-lookup.util';

describe('toPropertyLotLookup', () => {
  it('keeps lot identity and price, and drops buyer data', () => {
    const lookup = toPropertyLotLookup({
      id: 'lot-1',
      code: 'A-12',
      name: 'Lote A-12',
      block: 'A',
      lot_number: '12',
      status: 'disponible',
      total_area: '200.00',
      total_price: '850000.00',
      price_per_m2: '4250.00',
      currency: 'mxn',
      customer: { name: 'Juan', lastname: 'Pérez' },
      contracts: [{ id: 'contract-1' }],
      metadata: { note: 'privado' },
      cadastral_key: 'CAT-99',
    } as never);

    expect(lookup).toEqual({
      id: 'lot-1',
      code: 'A-12',
      name: 'Lote A-12',
      block: 'A',
      lot_number: '12',
      status: 'disponible',
      total_area: 200,
      total_price: 850000,
      price_per_m2: 4250,
      currency: 'MXN',
    });
    expect(lookup).not.toHaveProperty('customer');
    expect(lookup).not.toHaveProperty('contracts');
    expect(lookup).not.toHaveProperty('metadata');
    expect(lookup).not.toHaveProperty('cadastral_key');
  });
});
