import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  assertQuotationBranchAccess,
  assertQuotationSellerAccess,
  quotationIsVisibleToBranches,
  quotationIsVisibleToSeller,
  resolveQuotationBranchScopeIds,
  resolveQuotationSellerScopeUserId,
  userCanViewAllQuotationBranches,
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

describe('userCanViewAllQuotationBranches', () => {
  it('acepta el permiso en el JWT', () => {
    expect(
      userCanViewAllQuotationBranches({
        permissions: ['quotation:ViewAllBranches'],
      }),
    ).toBe(true);
    expect(
      userCanViewAllQuotationBranches({
        permissions: ['Quotation:view_all_branches'],
      }),
    ).toBe(true);
  });

  it('no se infiere de ViewAll ni de sucursales vacías', () => {
    expect(
      userCanViewAllQuotationBranches({
        permissions: ['quotation:ViewAll', 'quotation:Read'],
      }),
    ).toBe(false);
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
        canViewAllBranches: true,
      }),
    ).not.toThrow();
  });

  it('oculta cotizaciones ajenas', () => {
    expect(() =>
      assertQuotationSellerAccess(quotation, {
        userId: 'u-9',
        canViewAll: false,
        canViewAllBranches: true,
      }),
    ).toThrow(NotFoundException);
  });
});

describe('resolveQuotationBranchScopeIds', () => {
  it('sin ViewAllBranches usa las sucursales asignadas', () => {
    expect(resolveQuotationBranchScopeIds(false, ['b-1', 'b-2'])).toEqual([
      'b-1',
      'b-2',
    ]);
    expect(resolveQuotationBranchScopeIds(false, [])).toEqual([]);
  });

  it('rechaza filtrar una sucursal no asignada', () => {
    expect(() => resolveQuotationBranchScopeIds(false, ['b-1'], 'b-9')).toThrow(
      ForbiddenException,
    );
  });

  it('con ViewAllBranches y sin filtro no restringe', () => {
    expect(resolveQuotationBranchScopeIds(true, ['b-1'])).toBeNull();
  });

  it('con ViewAllBranches aplica el filtro pedido', () => {
    expect(resolveQuotationBranchScopeIds(true, ['b-1'], 'b-9')).toEqual(['b-9']);
  });
});

describe('quotationIsVisibleToBranches', () => {
  it('acepta sucursal de la cotización o del almacén', () => {
    expect(
      quotationIsVisibleToBranches({ billing_branch_id: 'b-1' }, ['b-1']),
    ).toBe(true);
    expect(
      quotationIsVisibleToBranches(
        { billing_branch_id: null, warehouse: { billing_branch_id: 'b-2' } },
        ['b-2'],
      ),
    ).toBe(true);
    expect(
      quotationIsVisibleToBranches({ billing_branch_id: 'b-3' }, ['b-1']),
    ).toBe(false);
  });
});

describe('assertQuotationBranchAccess', () => {
  it('no restringe con ViewAllBranches', () => {
    expect(() =>
      assertQuotationBranchAccess(
        { id: 'q-1', billing_branch_id: 'b-9' },
        { userId: 'u-1', canViewAll: true, canViewAllBranches: true },
      ),
    ).not.toThrow();
  });

  it('oculta cotizaciones de otras sucursales', () => {
    expect(() =>
      assertQuotationBranchAccess(
        { id: 'q-1', billing_branch_id: 'b-9' },
        {
          userId: 'u-1',
          canViewAll: true,
          canViewAllBranches: false,
          assignedBranchIds: ['b-1'],
        },
      ),
    ).toThrow(NotFoundException);
  });
});
