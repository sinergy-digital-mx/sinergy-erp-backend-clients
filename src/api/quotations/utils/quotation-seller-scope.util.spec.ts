import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  assertQuotationSellerAccess,
  quotationIsVisibleToSeller,
  resolveQuotationSellerScopeUserId,
  userCanViewAllQuotations,
} from './quotation-seller-scope.util';

describe('userCanViewAllQuotations', () => {
  it('acepta el permiso en el JWT', () => {
    expect(
      userCanViewAllQuotations({ permissions: ['quotation:ViewAll'] }),
    ).toBe(true);
    expect(
      userCanViewAllQuotations({ permissions: ['Quotation:view_all'] }),
    ).toBe(true);
  });

  it('no usa el rol Admin ni otros permisos de cotización', () => {
    expect(
      userCanViewAllQuotations({
        permissions: ['quotation:Read', 'quotation:Create'],
      }),
    ).toBe(false);
    expect(userCanViewAllQuotations({ permissions: [] })).toBe(false);
    expect(userCanViewAllQuotations({ permissions: undefined })).toBe(false);
  });
});

describe('resolveQuotationSellerScopeUserId', () => {
  it('fuerza el usuario actual si no tiene ViewAll', () => {
    expect(resolveQuotationSellerScopeUserId(false, 'u-1')).toBe('u-1');
    expect(resolveQuotationSellerScopeUserId(false, 'u-1', 'u-1')).toBe('u-1');
  });

  it('rechaza filtrar a otro vendedor si no tiene ViewAll', () => {
    expect(() =>
      resolveQuotationSellerScopeUserId(false, 'u-1', 'u-2'),
    ).toThrow(ForbiddenException);
  });

  it('deja ver todas con ViewAll y sin filtro', () => {
    expect(resolveQuotationSellerScopeUserId(true, 'admin')).toBeNull();
    expect(resolveQuotationSellerScopeUserId(true, 'admin', '  ')).toBeNull();
  });

  it('aplica el vendedor pedido si tiene ViewAll', () => {
    expect(resolveQuotationSellerScopeUserId(true, 'admin', 'u-9')).toBe('u-9');
  });
});

describe('quotationIsVisibleToSeller', () => {
  it('acepta vendedor POS o comisionado', () => {
    expect(
      quotationIsVisibleToSeller(
        { seller_user_id: 'u-1', assigned_seller_user_id: 'u-2' },
        'u-1',
      ),
    ).toBe(true);
    expect(
      quotationIsVisibleToSeller(
        { seller_user_id: 'u-1', assigned_seller_user_id: 'u-2' },
        'u-2',
      ),
    ).toBe(true);
    expect(
      quotationIsVisibleToSeller(
        { seller_user_id: 'u-1', assigned_seller_user_id: 'u-2' },
        'u-3',
      ),
    ).toBe(false);
  });
});

describe('assertQuotationSellerAccess', () => {
  const quotation = {
    id: 'q-1',
    seller_user_id: 'u-1',
    assigned_seller_user_id: 'u-2',
  };

  it('no restringe con ViewAll', () => {
    expect(() =>
      assertQuotationSellerAccess(quotation, {
        userId: 'u-9',
        canViewAll: true,
      }),
    ).not.toThrow();
  });

  it('oculta cotizaciones ajenas', () => {
    expect(() =>
      assertQuotationSellerAccess(quotation, {
        userId: 'u-9',
        canViewAll: false,
      }),
    ).toThrow(NotFoundException);
  });
});
