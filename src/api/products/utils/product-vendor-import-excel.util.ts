import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export type VendorImportKind = 'cost' | 'price';

export interface VendorImportTemplateColumn {
  header: string;
  key: string;
  width: number;
  type?: 'text' | 'currency' | 'unit_cost';
  hidden?: boolean;
  editable?: boolean;
}

export interface VendorImportTemplateRow {
  sku: string;
  name: string;
  uom: string;
  currency?: string;
  price_list?: string;
  is_active?: string;
  current_value: number | null;
  new_value: number | null;
  _id: string;
  _product_id: string;
  _product_uom_id: string;
  _price_list_id?: string;
}

export interface ParsedVendorImportRow {
  row_number: number;
  sku: string;
  uom: string;
  new_value: number | null;
  id: string | null;
  product_id: string | null;
  product_uom_id: string | null;
  price_list_id: string | null;
}

export const COST_TEMPLATE_HEADERS = {
  sku: 'SKU',
  name: 'Nombre',
  uom: 'UOM',
  currency: 'Moneda',
  is_active: 'Activo',
  current_value: 'Costo actual',
  new_value: 'Nuevo costo',
  _id: '_id',
  _product_id: '_product_id',
  _product_uom_id: '_product_uom_id',
} as const;

export const PRICE_TEMPLATE_HEADERS = {
  sku: 'SKU',
  name: 'Nombre',
  uom: 'UOM',
  price_list: 'Lista de precios',
  is_active: 'Activo',
  current_value: 'Precio actual',
  new_value: 'Nuevo precio',
  _id: '_id',
  _product_id: '_product_id',
  _product_uom_id: '_product_uom_id',
  _price_list_id: '_price_list_id',
} as const;

const HEADER_ALIASES: Record<string, string> = {
  SKU: 'sku',
  CODIGO: 'sku',
  CÓDIGO: 'sku',
  NOMBRE: 'name',
  DESCRIPCION: 'name',
  DESCRIPCIÓN: 'name',
  UOM: 'uom',
  UNIDAD: 'uom',
  UNIDADES: 'uom',
  MONEDA: 'currency',
  ACTIVO: 'is_active',
  'COSTO ACTUAL': 'current_value',
  'COSTO ACTUAL DEL PROVEEDOR': 'current_value',
  'PRECIO ACTUAL': 'current_value',
  'NUEVO COSTO': 'new_value',
  'NUEVO PRECIO': 'new_value',
  'LISTA DE PRECIOS': 'price_list',
  LISTA: 'price_list',
  _ID: 'id',
  _PRODUCT_ID: 'product_id',
  _PRODUCT_UOM_ID: 'product_uom_id',
  _PRICE_LIST_ID: 'price_list_id',
};

const TITLE_COLOR = 'FF3D3166';
const HEADER_COLOR = 'FF5B4B8A';
const EDITABLE_FILL = 'FFFFF3CD';
const READONLY_FILL_EVEN = 'FFF4F1FA';
const READONLY_FILL_ODD = 'FFFFFFFF';
const INSTRUCTION_FILL = 'FFEEF2F7';

function thinBorder(color: string): Partial<ExcelJS.Borders> {
  const side = { style: 'thin' as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function slugFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'proveedor';
}

export function vendorImportFilename(
  kind: VendorImportKind,
  vendorName: string,
  extra?: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const vendor = slugFilename(vendorName);
  const suffix = extra ? `-${slugFilename(extra)}` : '';
  return kind === 'cost'
    ? `costos-proveedor-${vendor}${suffix}-${date}.xlsx`
    : `precios-proveedor-${vendor}${suffix}-${date}.xlsx`;
}

export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value)
    .trim()
    .replace(/[$\s]/g, '')
    .replace(/,/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function costColumns(): VendorImportTemplateColumn[] {
  return [
    { header: COST_TEMPLATE_HEADERS.sku, key: 'sku', width: 18 },
    { header: COST_TEMPLATE_HEADERS.name, key: 'name', width: 40 },
    { header: COST_TEMPLATE_HEADERS.uom, key: 'uom', width: 14 },
    { header: COST_TEMPLATE_HEADERS.currency, key: 'currency', width: 12 },
    { header: COST_TEMPLATE_HEADERS.is_active, key: 'is_active', width: 10 },
    { header: COST_TEMPLATE_HEADERS.current_value, key: 'current_value', width: 16, type: 'unit_cost' },
    { header: COST_TEMPLATE_HEADERS.new_value, key: 'new_value', width: 16, type: 'unit_cost', editable: true },
    { header: COST_TEMPLATE_HEADERS._id, key: '_id', width: 8, hidden: true },
    { header: COST_TEMPLATE_HEADERS._product_id, key: '_product_id', width: 8, hidden: true },
    { header: COST_TEMPLATE_HEADERS._product_uom_id, key: '_product_uom_id', width: 8, hidden: true },
  ];
}

function priceColumns(): VendorImportTemplateColumn[] {
  return [
    { header: PRICE_TEMPLATE_HEADERS.sku, key: 'sku', width: 18 },
    { header: PRICE_TEMPLATE_HEADERS.name, key: 'name', width: 40 },
    { header: PRICE_TEMPLATE_HEADERS.uom, key: 'uom', width: 14 },
    { header: PRICE_TEMPLATE_HEADERS.price_list, key: 'price_list', width: 22 },
    { header: PRICE_TEMPLATE_HEADERS.is_active, key: 'is_active', width: 10 },
    { header: PRICE_TEMPLATE_HEADERS.current_value, key: 'current_value', width: 16, type: 'currency' },
    { header: PRICE_TEMPLATE_HEADERS.new_value, key: 'new_value', width: 16, type: 'currency', editable: true },
    { header: PRICE_TEMPLATE_HEADERS._id, key: '_id', width: 8, hidden: true },
    { header: PRICE_TEMPLATE_HEADERS._product_id, key: '_product_id', width: 8, hidden: true },
    { header: PRICE_TEMPLATE_HEADERS._product_uom_id, key: '_product_uom_id', width: 8, hidden: true },
    { header: PRICE_TEMPLATE_HEADERS._price_list_id, key: '_price_list_id', width: 8, hidden: true },
  ];
}

function addInstructionsSheet(
  workbook: ExcelJS.Workbook,
  kind: VendorImportKind,
  contextLines: string[],
): void {
  const sheet = workbook.addWorksheet('Instrucciones', {
    views: [{ showGridLines: false }],
  });
  sheet.getColumn(1).width = 100;

  const title = kind === 'cost'
    ? 'Importación de costos por proveedor'
    : 'Importación de precios por proveedor';

  const titleRow = sheet.addRow([title]);
  titleRow.height = 28;
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: TITLE_COLOR },
  };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  const steps = [
    '',
    ...contextLines,
    '',
    'Cómo usarlo',
    '1. No cambies SKU, nombre, UOM ni las columnas ocultas.',
    kind === 'cost'
      ? '2. Llena solo "Nuevo costo". Si lo dejas vacío, esa fila no se actualiza.'
      : '2. Llena solo "Nuevo precio". Si lo dejas vacío, esa fila no se actualiza.',
    '3. Guarda el archivo y súbelo en el mismo modal.',
    '4. Esto actualiza el catálogo actual. No modifica órdenes de compra ni de venta ya creadas.',
    kind === 'cost'
      ? '5. El costo admite hasta 4 decimales (ej. 2.2150).'
      : '5. El precio se guarda con 2 decimales.',
  ];

  for (const line of steps) {
    const row = sheet.addRow([line]);
    row.getCell(1).font = line.startsWith('Cómo')
      ? { bold: true, size: 12, color: { argb: TITLE_COLOR } }
      : { size: 11 };
    row.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
    if (line) row.height = 18;
  }
}

export async function buildVendorImportTemplate(options: {
  kind: VendorImportKind;
  title: string;
  subtitle: string;
  contextLines: string[];
  rows: VendorImportTemplateRow[];
}): Promise<Buffer> {
  const columns = options.kind === 'cost' ? costColumns() : priceColumns();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sinergy ERP';
  workbook.created = new Date();

  addInstructionsSheet(workbook, options.kind, options.contextLines);

  const sheetName = options.kind === 'cost' ? 'Costos' : 'Precios';
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  const titleRow = worksheet.addRow([options.title]);
  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_COLOR } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;

  const subRow = worksheet.addRow([options.subtitle]);
  worksheet.mergeCells(2, 1, 2, columns.length);
  const subCell = subRow.getCell(1);
  subCell.font = { italic: true, size: 10, color: { argb: 'FF555555' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INSTRUCTION_FILL } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  subRow.height = 22;

  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder('FF000000');
    cell.protection = { locked: true };
  });

  options.rows.forEach((rowData, index) => {
    const values = columns.map((col) => {
      const value = rowData[col.key as keyof VendorImportTemplateRow];
      return value === undefined || value === null ? '' : value;
    });
    const row = worksheet.addRow(values);
    const isEven = index % 2 === 0;

    row.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      const editable = Boolean(colDef?.editable);
      cell.border = thinBorder('FFE0E0E0');
      cell.protection = { locked: !editable };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: editable ? EDITABLE_FILL : isEven ? READONLY_FILL_EVEN : READONLY_FILL_ODD },
      };

      if (colDef?.type === 'currency' && typeof cell.value === 'number') {
        cell.numFmt = '$#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (colDef?.type === 'unit_cost' && typeof cell.value === 'number') {
        cell.numFmt = '$#,##0.00##';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (colDef?.editable) {
        cell.numFmt = options.kind === 'cost' ? '$#,##0.00##' : '$#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    });
  });

  worksheet.columns = columns.map((col) => ({ width: col.width, hidden: Boolean(col.hidden) }));
  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: columns.filter((c) => !c.hidden).length },
  };

  await worksheet.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    insertRows: false,
    deleteRows: false,
    sort: true,
    autoFilter: true,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function parseVendorImportExcel(
  buffer: Buffer,
  kind: VendorImportKind,
): ParsedVendorImportRow[] {
  return parseVendorImportWorkbookSync(buffer, kind);
}

function parseVendorImportWorkbookSync(
  buffer: Buffer,
  kind: VendorImportKind,
): ParsedVendorImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const preferred = kind === 'cost' ? 'Costos' : 'Precios';
  const sheetName =
    workbook.SheetNames.find((name) => name === preferred) ??
    workbook.SheetNames.find((name) => name !== 'Instrucciones') ??
    workbook.SheetNames[0];

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
  const columnIndex: Record<string, number> = {};

  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    const row = raw[i] ?? [];
    const mapped: Record<string, number> = {};
    row.forEach((cell, col) => {
      const alias = HEADER_ALIASES[normalizeHeader(cell)];
      if (alias) mapped[alias] = col;
    });
    if (mapped.sku !== undefined && mapped.new_value !== undefined) {
      headerIndex = i;
      Object.assign(columnIndex, mapped);
      break;
    }
  }

  if (headerIndex < 0) {
    throw new Error(
      kind === 'cost'
        ? 'No se encontró la fila de encabezados. Se espera SKU y Nuevo costo.'
        : 'No se encontró la fila de encabezados. Se espera SKU y Nuevo precio.',
    );
  }

  const rows: ParsedVendorImportRow[] = [];

  for (let i = headerIndex + 1; i < raw.length; i++) {
    const row = raw[i] ?? [];
    const sku = cleanText(row[columnIndex.sku]);
    if (!sku) continue;

    rows.push({
      row_number: i + 1,
      sku,
      uom: cleanText(row[columnIndex.uom]) ?? '',
      new_value:
        columnIndex.new_value !== undefined ? parseMoney(row[columnIndex.new_value]) : null,
      id: columnIndex.id !== undefined ? cleanText(row[columnIndex.id]) : null,
      product_id:
        columnIndex.product_id !== undefined ? cleanText(row[columnIndex.product_id]) : null,
      product_uom_id:
        columnIndex.product_uom_id !== undefined
          ? cleanText(row[columnIndex.product_uom_id])
          : null,
      price_list_id:
        columnIndex.price_list_id !== undefined
          ? cleanText(row[columnIndex.price_list_id])
          : null,
    });
  }

  return rows;
}
