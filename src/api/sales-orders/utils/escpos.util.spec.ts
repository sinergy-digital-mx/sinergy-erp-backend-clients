import {
  EscPosBuilder,
  ESCPOS_CHARS_PER_LINE,
  formatMoney,
  labelValueLine,
  productLine,
  padLeft,
  padRight,
} from './escpos.util';

describe('escpos.util', () => {
  it('formats product lines within 48 chars', () => {
    const line = productLine('PINO 1X12 NO. 3', '32', '$17.64', '$564.48');
    expect(line.length).toBe(ESCPOS_CHARS_PER_LINE);
    expect(line).toContain('32');
    expect(line).toContain('$564.48');
  });

  it('aligns label and value', () => {
    const line = labelValueLine('Total:', formatMoney(900.46));
    expect(line.endsWith('$900.46')).toBe(true);
  });

  it('initializes with font A and normal size', () => {
    const buffer = new EscPosBuilder().initialize().build();
    expect(buffer[0]).toBe(0x1b);
    expect(buffer[1]).toBe(0x40);
    expect(buffer.includes(0x1b)).toBe(true); // ESC sequences present
  });

  it('pads columns', () => {
    expect(padLeft('1', 5)).toBe('    1');
    expect(padRight('ABC', 6)).toBe('ABC   ');
  });

  it('emits ESC/POS QR function commands', () => {
    const url = 'https://facturacion.sinergydigital.mx/facturar/MZN-CENT-INV-000012';
    const buffer = new EscPosBuilder().initialize().qr(url, 5).build();
    const hex = buffer.toString('hex').toUpperCase();
    expect(hex).toContain('1D286B'); // GS ( k
    expect(buffer.includes(Buffer.from(url, 'utf8'))).toBe(true);
  });
});
