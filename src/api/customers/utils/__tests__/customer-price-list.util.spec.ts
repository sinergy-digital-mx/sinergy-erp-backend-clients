import { normalizeCustomerPriceListAssignments } from '../customer-price-list.util';

describe('normalizeCustomerPriceListAssignments', () => {
  it('deja vacía la lista', () => {
    expect(normalizeCustomerPriceListAssignments([])).toEqual([]);
    expect(normalizeCustomerPriceListAssignments(null)).toEqual([]);
  });

  it('marca la primera si ninguna viene como predeterminada', () => {
    expect(
      normalizeCustomerPriceListAssignments([
        { price_list_id: 'a' },
        { price_list_id: 'b', is_default: false },
      ]),
    ).toEqual([
      { price_list_id: 'a', is_default: true },
      { price_list_id: 'b', is_default: false },
    ]);
  });

  it('conserva una sola predeterminada y descarta repetidas', () => {
    expect(
      normalizeCustomerPriceListAssignments([
        { price_list_id: 'a', is_default: true },
        { price_list_id: 'a', is_default: false },
        { price_list_id: 'b', is_default: true },
      ]),
    ).toEqual([
      { price_list_id: 'a', is_default: true },
      { price_list_id: 'b', is_default: false },
    ]);
  });
});
