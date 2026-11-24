import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { assertPosPriceDiscountAllowed } from './pos-price-discount.util';

const line = (discount_percentage: number, product_discount_id?: string) => ({
  product_id: 'p1',
  product_uom_id: 'u1',
  discount_percentage,
  product_discount_id: product_discount_id ?? null,
});

describe('assertPosPriceDiscountAllowed', () => {
  const seller = { permissions: ['pos:read'] };
  const allowed = { permissions: ['pos:ApplyPriceDiscount'] };

  it('deja pasar una venta sin descuento de precio', () => {
    expect(() => assertPosPriceDiscountAllowed(seller, [line(0)])).not.toThrow();
  });

  it('rechaza un descuento nuevo si el vendedor no tiene el permiso', () => {
    expect(() => assertPosPriceDiscountAllowed(seller, [line(5)])).toThrow(ForbiddenException);
  });

  it('acepta el mismo descuento ya guardado en la orden', () => {
    expect(() =>
      assertPosPriceDiscountAllowed(seller, [line(5)], [line(5)]),
    ).not.toThrow();
  });

  it('rechaza cambiar 5% por 3% sin permiso', () => {
    expect(() =>
      assertPosPriceDiscountAllowed(seller, [line(3)], [line(5)]),
    ).toThrow(ForbiddenException);
  });

  it('acepta 5% o 3% con el permiso', () => {
    expect(() => assertPosPriceDiscountAllowed(allowed, [line(5), line(3)])).not.toThrow();
  });

  it('rechaza más de 100% aunque haya permiso', () => {
    expect(() => assertPosPriceDiscountAllowed(allowed, [line(120)])).toThrow(BadRequestException);
  });

  it('no trata el descuento de producto como descuento de precio', () => {
    expect(() =>
      assertPosPriceDiscountAllowed(seller, [line(10, 'disc-1')]),
    ).not.toThrow();
  });

  it('el admin del módulo POS puede aplicarlo', () => {
    expect(() =>
      assertPosPriceDiscountAllowed(
        { hasAdminRole: true, permissions: ['pos:read'] },
        [line(5)],
      ),
    ).not.toThrow();
  });
});
