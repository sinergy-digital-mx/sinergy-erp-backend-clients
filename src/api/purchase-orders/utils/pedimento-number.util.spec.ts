import { BadRequestException } from '@nestjs/common';
import {
  formatPedimentoForDisplay,
  formatPedimentoMask,
  normalizePedimentoNumber,
  parsePedimentoNumber,
} from './pedimento-number.util';

describe('pedimento-number.util', () => {
  it('pinta la máscara del Anexo 22 mientras llegan los dígitos', () => {
    expect(formatPedimentoMask('26')).toBe('26');
    expect(formatPedimentoMask('264')).toBe('26  4');
    expect(formatPedimentoMask('2647')).toBe('26  47');
    expect(formatPedimentoMask('26473807')).toBe('26  47  3807');
    expect(formatPedimentoMask('264738076')).toBe('26  47  3807  6');
    expect(formatPedimentoMask('264738076000123')).toBe('26  47  3807  6000123');
    expect(formatPedimentoMask('26-47-3807-6000123')).toBe('26  47  3807  6000123');
    expect(formatPedimentoMask('26  40  3591  6004274')).toBe('26  40  3591  6004274');
  });

  it('acepta vacío, 15 dígitos y el consolidado del año anterior', () => {
    expect(normalizePedimentoNumber(null)).toBeNull();
    expect(normalizePedimentoNumber('   ')).toBeNull();
    expect(normalizePedimentoNumber('264738076000123')).toBe('26  47  3807  6000123');
    expect(normalizePedimentoNumber('26  47  3807  5000123')).toBe('26  47  3807  5000123');
    expect(parsePedimentoNumber('26  40  3591  6004274').valid).toBe(true);
  });

  it('rechaza texto, longitud distinta, dígito de año y consecutivo en cero', () => {
    expect(() => normalizePedimentoNumber('PED-123')).toThrow(BadRequestException);
    expect(() => normalizePedimentoNumber('26  47  3807  600012')).toThrow(BadRequestException);
    expect(() => normalizePedimentoNumber('26  47  3807  4000123')).toThrow(BadRequestException);
    expect(() => normalizePedimentoNumber('26  47  3807  6000000')).toThrow(BadRequestException);
    expect(parsePedimentoNumber('26  47  3807  4000123').message).toContain('dígito de año');
    expect(parsePedimentoNumber('26  47  3807  6000000').message).toContain('000001');
  });

  it('en lectura formatea 15 dígitos y conserva un texto que no es pedimento', () => {
    expect(formatPedimentoForDisplay('162430010001234')).toBe('16  24  3001  0001234');
    expect(formatPedimentoForDisplay('26  47  3807  6000123')).toBe('26  47  3807  6000123');
    expect(formatPedimentoForDisplay('SIN-PEDIMENTO')).toBe('SIN-PEDIMENTO');
    expect(formatPedimentoForDisplay(null)).toBeNull();
  });
});
