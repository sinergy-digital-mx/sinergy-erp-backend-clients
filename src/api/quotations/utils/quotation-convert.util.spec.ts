import { resolveConvertSalesOrderType } from './quotation-convert.util';

describe('resolveConvertSalesOrderType', () => {
  it('manda a caja POS si el usuario lo pide', () => {
    expect(resolveConvertSalesOrderType('MANUAL', true)).toBe('POS');
    expect(resolveConvertSalesOrderType('POS', true)).toBe('POS');
  });

  it('crea OV manual si el usuario no quiere caja', () => {
    expect(resolveConvertSalesOrderType('POS', false)).toBe('MANUAL');
    expect(resolveConvertSalesOrderType('MANUAL', false)).toBe('MANUAL');
  });

  it('sin flag conserva el tipo de la cotización', () => {
    expect(resolveConvertSalesOrderType('POS')).toBe('POS');
    expect(resolveConvertSalesOrderType('MANUAL')).toBe('MANUAL');
  });
});
