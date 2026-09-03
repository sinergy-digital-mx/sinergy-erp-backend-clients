/**
 * Utilidades ESC/POS para impresoras térmicas 80mm (Bixolon SRP-330III y compatibles).
 * Ancho típico: 48 caracteres en fuente A.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export const ESCPOS_CHARS_PER_LINE = 48;

/** Hex continuo para QZ Tray: format command, flavor hex (evita array de números). */
export function bufferToEscPosHex(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase();
}

export class EscPosBuilder {
  private readonly chunks: Buffer[] = [];

  initialize(): this {
    this.chunks.push(Buffer.from([ESC, 0x40]));
    return this.selectFontA().setCodePageLatin1().characterSizeNormal();
  }

  /** Font B 9x17 — texto más pequeño (dirección, etc.). */
  selectFontB(): this {
    this.chunks.push(Buffer.from([ESC, 0x4d, 0x01]));
    return this;
  }

  /** Font A 12x24 — evita "letritas" (Font B es 9x17). */
  selectFontA(): this {
    this.chunks.push(Buffer.from([ESC, 0x4d, 0x00]));
    return this;
  }

  /** CP850 — acentos y ñ en México. */
  setCodePageLatin1(): this {
    this.chunks.push(Buffer.from([ESC, 0x74, 0x02]));
    return this;
  }

  characterSizeNormal(): this {
    this.chunks.push(Buffer.from([GS, 0x21, 0x00]));
    return this;
  }

  characterSizeDouble(): this {
    this.chunks.push(Buffer.from([GS, 0x21, 0x11]));
    return this;
  }

  raw(bytes: number[]): this {
    this.chunks.push(Buffer.from(bytes));
    return this;
  }

  align(mode: 'left' | 'center' | 'right'): this {
    const n = mode === 'left' ? 0 : mode === 'center' ? 1 : 2;
    this.chunks.push(Buffer.from([ESC, 0x61, n]));
    return this;
  }

  bold(enabled = true): this {
    this.chunks.push(Buffer.from([ESC, 0x45, enabled ? 1 : 0]));
    return this;
  }

  textLine(line = ''): this {
    this.chunks.push(Buffer.from(this.sanitize(line), 'latin1'));
    this.chunks.push(Buffer.from([LF]));
    return this;
  }

  blankLines(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.textLine('');
    }
    return this;
  }

  separator(char = '-'): this {
    return this.textLine(char.repeat(ESCPOS_CHARS_PER_LINE));
  }

  /**
   * QR Model 2 (GS ( k). Bixolon SRP-330III / ESC-POS 80mm.
   * `data` = URL completa del portal de autofactura.
   */
  qr(data: string, moduleSize = 5): this {
    const payload = Buffer.from(data, 'utf8');
    const size = Math.min(16, Math.max(3, moduleSize));
    this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));
    this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]));
    const storeLen = payload.length + 3;
    this.chunks.push(
      Buffer.from([GS, 0x28, 0x6b, storeLen & 0xff, (storeLen >> 8) & 0xff, 0x31, 0x50, 0x30]),
    );
    this.chunks.push(payload);
    this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
    return this;
  }

  /** Corte parcial Bixolon / ESC-POS estándar. */
  cut(partial = true): this {
    this.blankLines(4);
    // GS V m — m=1 corte parcial + avance
    this.chunks.push(Buffer.from([GS, 0x56, partial ? 1 : 0]));
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }

  private sanitize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ');
  }
}

export function padLeft(value: string, width: number): string {
  if (value.length >= width) return value.slice(0, width);
  return ' '.repeat(width - value.length) + value;
}

export function padRight(value: string, width: number): string {
  if (value.length >= width) return value.slice(0, width);
  return value + ' '.repeat(width - value.length);
}

export function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

/** Precio unitario: hasta 4 decimales. No recorta 2.150 a 2.2. */
export function formatUnitMoney(amount: number): string {
  const n = Number(amount) || 0;
  const [integer, fraction = ''] = n.toFixed(4).split('.');
  const decimals = fraction.replace(/0+$/, '').padEnd(2, '0');
  return '$' + integer + '.' + decimals;
}

export function formatUsd(amount: number): string {
  return 'USD ' + amount.toFixed(2);
}

/** Monto pegado a la etiqueta (izquierda). Evita recorte en térmicas ~42 cols. */
export function compactMoneyLine(
  label: string,
  formattedValue: string,
  width = ESCPOS_CHARS_PER_LINE,
): string {
  const text = `${label} ${formattedValue}`;
  if (text.length <= width) return text;
  const trimmedLabel = label.slice(0, Math.max(1, width - formattedValue.length - 1));
  return `${trimmedLabel} ${formattedValue}`;
}

/** Dos columnas: etiqueta izquierda, valor derecho. */
export function labelValueLine(label: string, value: string, width = ESCPOS_CHARS_PER_LINE): string {
  const maxLabel = width - value.length - 1;
  const safeLabel = label.length > maxLabel ? label.slice(0, maxLabel) : label;
  const spaces = Math.max(1, width - safeLabel.length - value.length);
  return safeLabel + ' '.repeat(spaces) + value;
}

/** Etiqueta y valor pegados a la izquierda; envuelve sin huecos grandes. */
export function leftLabelLines(label: string, value: string, width = ESCPOS_CHARS_PER_LINE): string[] {
  return wrapLines(`${label} ${value}`.trim(), width);
}

/** Dos bloques en la misma línea (mitad izq / mitad der). */
export function twoColumnLine(left: string, right: string, width = ESCPOS_CHARS_PER_LINE): string {
  const half = Math.floor(width / 2);
  const safeLeft = left.length > half ? left.slice(0, half) : left;
  const safeRight = right.length > half ? right.slice(0, half) : right;
  return padRight(safeLeft, half) + padRight(safeRight, width - half);
}

export function wrapLines(text: string, width = ESCPOS_CHARS_PER_LINE): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > width ? word.slice(0, width) : word;
  }

  if (current) lines.push(current);
  return lines;
}

/** Fila de producto: descripción + cantidad + precio + total. */
export function productLine(
  description: string,
  quantity: string,
  unitPrice: string,
  lineTotal: string,
  width = ESCPOS_CHARS_PER_LINE,
): string {
  const qtyW = 7;
  const priceW = 9;
  const totalW = 10;
  const descW = width - qtyW - priceW - totalW;
  return (
    padRight(description, descW) +
    padLeft(quantity, qtyW) +
    padLeft(unitPrice, priceW) +
    padLeft(lineTotal, totalW)
  );
}
