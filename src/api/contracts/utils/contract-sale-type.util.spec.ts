import { computeMonthlyPayment } from '../contract-financial.util';
import {
  contractSaleTypeHint,
  contractSaleTypeLabel,
  isCashContract,
  resolveContractSaleMark,
} from './contract-sale-type.util';

describe('contract sale type', () => {
  it('marca contado solo cuando sale_type es cash', () => {
    expect(isCashContract({ sale_type: 'cash', down_payment_financed: true })).toBe(true);
    expect(isCashContract({ sale_type: 'financed' })).toBe(false);
    expect(isCashContract({})).toBe(false);
  });

  it('separa enganche más financiamiento de solo financiamiento', () => {
    expect(
      resolveContractSaleMark({ sale_type: 'financed', down_payment_financed: true }),
    ).toBe('down_payment_and_financing');
    expect(
      resolveContractSaleMark({ sale_type: 'financed', down_payment_financed: false }),
    ).toBe('financing');
    expect(resolveContractSaleMark({ sale_type: 'cash', down_payment_financed: true })).toBe(
      'cash',
    );
  });

  it('etiqueta Contado, E + F y F', () => {
    expect(contractSaleTypeLabel({ sale_type: 'cash' })).toBe('Contado');
    expect(
      contractSaleTypeLabel({ sale_type: 'financed', down_payment_financed: true }),
    ).toBe('Financiado (E + F)');
    expect(contractSaleTypeHint({ sale_type: 'financed', down_payment_financed: true })).toBe(
      'Enganche más financiamiento',
    );
    expect(contractSaleTypeLabel({ sale_type: 'financed' })).toBe('Financiado (F)');
  });

  it('un contado no calcula mensualidad aunque tenga meses guardados', () => {
    expect(
      computeMonthlyPayment(
        36000,
        {
          sale_type: 'cash',
          down_payment: 0,
          down_payment_target: null,
          down_payment_financed: false,
          total_price: 36000,
          payment_months: 1,
          status: 'activo',
        },
        1,
      ),
    ).toBe(0);
  });
});
