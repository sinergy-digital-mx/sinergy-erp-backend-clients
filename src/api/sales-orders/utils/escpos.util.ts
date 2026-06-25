/**
 * Utilidades ESC/POS para impresoras térmicas 80mm (Bixolon SRP-330III y compatibles).
 * Ancho típico: 48 caracteres en fuente A.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export const ESCPOS_CHARS_PER_LINE = 48;

export class EscPosBuilder {
  private readonly chunks: Buffer[] = [];

  initialize(): this {
    this.chunks.push(Buffer.from([ESC, 0x40]));
    return this.selectFontA().setCodePageLatin1().characterSizeNormal();
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

/** Dos columnas: etiqueta izquierda, valor derecho. */
export function labelValueLine(label: string, value: string, width = ESCPOS_CHARS_PER_LINE): string {
  const maxLabel = width - value.length - 1;
  const safeLabel = label.length > maxLabel ? label.slice(0, maxLabel) : label;
  const spaces = Math.max(1, width - safeLabel.length - value.length);
  return safeLabel + ' '.repeat(spaces) + value;
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
