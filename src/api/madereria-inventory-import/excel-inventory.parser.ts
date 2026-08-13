import * as XLSX from 'xlsx';

export type InventoryExcelRow = {
  row_number: number;
  sku: string;
  name: string;
  alternate_sku: string | null;
  price: number | null;
  cost: number | null;
  quantity: number | null;
};

const HEADER_ALIASES: Record<string, string> = {
  CODIGO: 'sku',
  DESCRIPCION: 'name',
  DESCRIPCIÓN: 'name',
  ALTERNO: 'alternate_sku',
  PRECIO1: 'price',
  PRECIO: 'price',
  'COSTO PROM': 'cost',
  'COSTO PROMEDIO': 'cost',
  COSTOPROM: 'cost',
  CANTIDAD: 'quantity',
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value)
    .trim()
    .replace(/[$\s]/g, '')
    .replace(/,/g, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text || null;
}

function isFooterOrJunkRow(sku: string, name: string): boolean {
  const s = sku.toUpperCase();
  const n = name.toUpperCase();
  const blob = `${s} ${n}`;

  // Totales / pie del export Madereria (ej. "Cant. Arts:", "TOTAL POR CANTIDAD")
  if (/CANT\.?\s*ART/.test(blob)) return true;
  if (/TOTAL\s+POR\s+CANTIDAD/.test(blob)) return true;
  if (/^TOTAL\b/.test(s) || /^TOTAL\b/.test(n)) return true;
  if (/PRECIOS\s+Y\s+COSTOS/.test(blob)) return true;
  if (/^P[AÁ]GINA\b/.test(s)) return true;
  if (/^MONEDA\b/.test(s)) return true;

  return false;
}

/**
 * Lee el export de inventario Madereria (.xls / .xlsx).
 * Busca la fila de encabezados (CODIGO, DESCRIPCION, PRECIO1, COSTO PROM, CANTIDAD).
 */
export function parseMadereriaInventoryExcel(buffer: Buffer): InventoryExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no tiene hojas');
  }

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<(unknown | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  let headerIndex = -1;
  const columnIndex: Partial<Record<keyof InventoryExcelRow, number>> = {};

  for (let i = 0; i < Math.min(raw.length, 30); i++) {
    const row = raw[i] ?? [];
    const mapped: Partial<Record<string, number>> = {};
    row.forEach((cell, col) => {
      const alias = HEADER_ALIASES[normalizeHeader(cell)];
      if (alias) {
        mapped[alias] = col;
      }
    });
    if (mapped.sku !== undefined && mapped.quantity !== undefined) {
      headerIndex = i;
      Object.assign(columnIndex, mapped);
      break;
    }
  }

  if (headerIndex < 0) {
    throw new Error(
      'No se encontró la fila de encabezados. Se espera CODIGO, DESCRIPCION, PRECIO1, COSTO PROM y CANTIDAD.',
    );
  }

  const rows: InventoryExcelRow[] = [];

  for (let i = headerIndex + 1; i < raw.length; i++) {
    const row = raw[i] ?? [];
    const sku = cleanText(row[columnIndex.sku ?? 0]);
    if (!sku) {
      continue;
    }

    const name = cleanText(row[columnIndex.name ?? 1]) ?? sku;
    if (isFooterOrJunkRow(sku, name)) {
      // Al llegar al pie de totales, cortar: lo de abajo no es catálogo.
      break;
    }

    const alternateRaw =
      columnIndex.alternate_sku !== undefined
        ? cleanText(row[columnIndex.alternate_sku])
        : null;
    const alternate_sku =
      alternateRaw && alternateRaw.toUpperCase() !== sku.toUpperCase()
        ? alternateRaw
        : null;

    rows.push({
      row_number: i + 1,
      sku,
      name: name.slice(0, 255),
      alternate_sku,
      price: columnIndex.price !== undefined ? parseNumber(row[columnIndex.price]) : null,
      cost: columnIndex.cost !== undefined ? parseNumber(row[columnIndex.cost]) : null,
      quantity:
        columnIndex.quantity !== undefined ? parseNumber(row[columnIndex.quantity]) : null,
    });
  }

  if (!rows.length) {
    throw new Error('El archivo no tiene renglones de productos');
  }

  return rows;
}
