import { resolveReceiptFiscalId } from './payment-receipt-fiscal.util';

describe('resolveReceiptFiscalId', () => {
  it('prioriza la razón social del contrato', () => {
    expect(
      resolveReceiptFiscalId({
        contractFiscalId: 'contract-fiscal',
        templateFiscalId: 'template-fiscal',
        systemLogoFiscalId: 'system-fiscal',
        firstFiscalId: 'first-fiscal',
      }),
    ).toBe('contract-fiscal');
  });

  it('usa la plantilla si el contrato no tiene razón social', () => {
    expect(
      resolveReceiptFiscalId({
        contractFiscalId: '  ',
        templateFiscalId: 'template-fiscal',
        systemLogoFiscalId: 'system-fiscal',
      }),
    ).toBe('template-fiscal');
  });

  it('cae al logo del sistema y luego a la primera razón social', () => {
    expect(
      resolveReceiptFiscalId({
        systemLogoFiscalId: 'system-fiscal',
        firstFiscalId: 'first-fiscal',
      }),
    ).toBe('system-fiscal');
    expect(resolveReceiptFiscalId({ firstFiscalId: 'first-fiscal' })).toBe('first-fiscal');
    expect(resolveReceiptFiscalId({})).toBeNull();
  });
});
