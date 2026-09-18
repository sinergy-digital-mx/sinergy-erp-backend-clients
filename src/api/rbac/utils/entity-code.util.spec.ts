import { entityCodesMatch, normalizeEntityCode } from './entity-code.util';

describe('entity-code.util', () => {
  it('equates Contract and contracts', () => {
    expect(normalizeEntityCode('Contract')).toBe('contract');
    expect(normalizeEntityCode('contracts')).toBe('contract');
    expect(entityCodesMatch('Contract', 'contracts')).toBe(true);
  });

  it('equates sales order aliases', () => {
    expect(entityCodesMatch('sales_orders', 'SalesOrder')).toBe(true);
    expect(entityCodesMatch('sales_orders', 'inventory')).toBe(false);
  });

  it('equates properties and property', () => {
    expect(entityCodesMatch('properties', 'property')).toBe(true);
  });
});
