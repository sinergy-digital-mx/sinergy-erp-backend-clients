import { BadRequestException } from '@nestjs/common';
import {
  firstVendorInvoiceNumber,
  formatVendorInvoiceNumbers,
  normalizeVendorInvoiceNumbers,
  parseStoredVendorInvoiceNumbers,
  resolveVendorInvoiceInput,
  VENDOR_INVOICE_MAX_COUNT,
} from './purchase-order-vendor-invoice.util';

describe('purchase-order-vendor-invoice.util', () => {
  it('normaliza, recorta y quita duplicados sin importar mayúsculas', () => {
    expect(
      normalizeVendorInvoiceNumbers(['  A-1  ', '', 'a-1', 'B-2', null]),
    ).toEqual(['A-1', 'B-2']);
  });

  it('acepta un solo string o vacío', () => {
    expect(normalizeVendorInvoiceNumbers('  A-9  ')).toEqual(['A-9']);
    expect(normalizeVendorInvoiceNumbers(null)).toEqual([]);
    expect(normalizeVendorInvoiceNumbers(undefined)).toEqual([]);
  });

  it('rechaza un número de más de 60 caracteres', () => {
    expect(() => normalizeVendorInvoiceNumbers('x'.repeat(61))).toThrow(
      BadRequestException,
    );
  });

  it('rechaza más de 20 facturas', () => {
    const many = Array.from({ length: VENDOR_INVOICE_MAX_COUNT + 1 }, (_, i) => `F-${i}`);
    expect(() => normalizeVendorInvoiceNumbers(many)).toThrow(BadRequestException);
  });

  it('resuelve el array si viene, si no el campo suelto', () => {
    expect(
      resolveVendorInvoiceInput({
        vendor_invoice_numbers: ['A-1', 'B-2'],
        vendor_invoice_number: 'IGNORAR',
      }),
    ).toEqual(['A-1', 'B-2']);
    expect(resolveVendorInvoiceInput({ vendor_invoice_number: 'A-1' })).toEqual([
      'A-1',
    ]);
    expect(resolveVendorInvoiceInput({})).toBeUndefined();
  });

  it('lee JSON persistido y cae al fallback', () => {
    expect(parseStoredVendorInvoiceNumbers(['A-1', ' B-2 '])).toEqual(['A-1', 'B-2']);
    expect(parseStoredVendorInvoiceNumbers(null, 'A-9')).toEqual(['A-9']);
    expect(parseStoredVendorInvoiceNumbers('["C-1"]')).toEqual(['C-1']);
    expect(firstVendorInvoiceNumber(['A-1', 'B-2'])).toBe('A-1');
    expect(formatVendorInvoiceNumbers(['A-1', 'B-2'])).toBe('A-1 · B-2');
    expect(formatVendorInvoiceNumbers([])).toBeNull();
  });
});
