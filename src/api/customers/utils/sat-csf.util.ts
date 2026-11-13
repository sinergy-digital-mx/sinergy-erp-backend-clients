export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  page: number;
}

export interface SatCsfFiscalData {
  fiscal_rfc: string;
  fiscal_person_type: 'fisica' | 'moral';
  fiscal_razon_social: string;
  fiscal_postal_code: string;
  fiscal_country: 'MEX';
  fiscal_street?: string | null;
  fiscal_exterior_number?: string | null;
  fiscal_interior_number?: string | null;
  fiscal_colonia?: string | null;
  fiscal_localidad?: string | null;
  fiscal_municipio?: string | null;
  fiscal_state?: string | null;
}

export class SatCsfParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SatCsfParseError';
  }
}

type LabelKey =
  | 'municipio'
  | 'localidad'
  | 'colonia'
  | 'estado'
  | 'vialidad'
  | 'tipoVialidad'
  | 'exterior'
  | 'interior'
  | 'cp'
  | 'razonSocial'
  | 'regimenCapital'
  | 'nombreComercial'
  | 'primerApellido'
  | 'segundoApellido'
  | 'nombre'
  | 'curp'
  | 'rfc'
  | 'entreCalle'
  | 'yCalle';

interface OpenField {
  key: LabelKey;
  labelX: number;
  value: string;
}

interface TextSpan {
  start: number;
  end: number;
  x: number;
}

type AddressKey =
  | 'fiscal_street'
  | 'fiscal_exterior_number'
  | 'fiscal_interior_number'
  | 'fiscal_colonia'
  | 'fiscal_localidad'
  | 'fiscal_municipio'
  | 'fiscal_state';

const LINE_Y_TOLERANCE = 8;
const CONTINUATION_GAP = 14;

const LABEL_PATTERNS: Array<{ key: LabelKey; pattern: RegExp }> = [
  {
    key: 'municipio',
    pattern: /Nombre del Municipio(?: o Demarcaci[oó]n Territorial)?\s*:/i,
  },
  { key: 'localidad', pattern: /Nombre de la Localidad\s*:/i },
  { key: 'colonia', pattern: /Nombre de la Colonia\s*:/i },
  { key: 'estado', pattern: /Nombre de la Entidad Federativa\s*:/i },
  { key: 'vialidad', pattern: /Nombre de Vialidad\s*:/i },
  { key: 'tipoVialidad', pattern: /Tipo de Vialidad\s*:/i },
  { key: 'exterior', pattern: /N[uú]mero Exterior\s*:/i },
  { key: 'interior', pattern: /N[uú]mero Interior\s*:/i },
  { key: 'cp', pattern: /C[oó]digo Postal\s*:/i },
  {
    key: 'razonSocial',
    pattern: /Denominaci[oó]n\s*\/\s*Raz[oó]n Social\s*:/i,
  },
  { key: 'regimenCapital', pattern: /R[eé]gimen Capital\s*:/i },
  { key: 'nombreComercial', pattern: /Nombre Comercial\s*:/i },
  { key: 'primerApellido', pattern: /Primer Apellido\s*:/i },
  { key: 'segundoApellido', pattern: /Segundo Apellido\s*:/i },
  { key: 'nombre', pattern: /Nombre\s*\(\s*s\s*\)\s*:/i },
  { key: 'nombre', pattern: /Nombre\s*:/i },
  { key: 'curp', pattern: /CURP\s*:/i },
  { key: 'rfc', pattern: /RFC\s*:/i },
  { key: 'entreCalle', pattern: /Entre Calle\s*:/i },
  { key: 'yCalle', pattern: /Y Calle\s*:/i },
];

const FIELD_KEYS: LabelKey[] = [
  'rfc',
  'razonSocial',
  'nombre',
  'primerApellido',
  'segundoApellido',
  'cp',
  'vialidad',
  'exterior',
  'interior',
  'colonia',
  'localidad',
  'municipio',
  'estado',
];

export function parseSatCsfTextItems(items: PdfTextItem[]): SatCsfFiscalData {
  const readable = items.filter((item) => item.str.trim());
  if (readable.length === 0) {
    throw new SatCsfParseError(
      'El PDF no tiene texto. Descarga la constancia desde el SAT; una foto o un escaneo no se puede leer.',
    );
  }

  const blob = fold(readable.map((item) => item.str).join(' '));
  const isConstancia =
    blob.includes('CONSTANCIA DE SITUACION FISCAL') ||
    blob.includes('CEDULA DE IDENTIFICACION FISCAL') ||
    blob.includes('REGISTRO FEDERAL DE CONTRIBUYENTES');
  if (!isConstancia) {
    throw new SatCsfParseError('Ese PDF no parece una constancia del SAT.');
  }

  const values = new Map<LabelKey, string>();
  const pages = [...new Set(readable.map((item) => item.page))].sort(
    (a, b) => a - b,
  );
  for (const page of pages) {
    const pageItems = readable.filter((item) => item.page === page);
    for (const [key, value] of readPage(pageItems)) {
      values.set(key, value);
    }
  }

  const rfc = normalizeRfc(values.get('rfc'));
  if (!rfc) {
    throw new SatCsfParseError('No se encontró el RFC en la constancia.');
  }
  const personType = personTypeFromRfc(rfc);

  const razonSocial = legalName(personType, values);
  if (!razonSocial) {
    throw new SatCsfParseError(
      'No se encontró la razón social o el nombre en la constancia.',
    );
  }

  const postalCode = normalizePostalCode(values.get('cp'));
  if (!postalCode) {
    throw new SatCsfParseError(
      'No se encontró el código postal del domicilio fiscal.',
    );
  }

  const data: SatCsfFiscalData = {
    fiscal_rfc: rfc,
    fiscal_person_type: personType,
    fiscal_razon_social: razonSocial,
    fiscal_postal_code: postalCode,
    fiscal_country: 'MEX',
  };

  assignAddress(data, 'fiscal_street', values.get('vialidad'), 255);
  assignAddress(data, 'fiscal_exterior_number', values.get('exterior'), 20);
  assignAddress(
    data,
    'fiscal_interior_number',
    emptyInterior(values.get('interior')),
    20,
  );
  assignAddress(data, 'fiscal_colonia', values.get('colonia'), 120);
  assignAddress(data, 'fiscal_localidad', values.get('localidad'), 120);
  assignAddress(data, 'fiscal_municipio', values.get('municipio'), 120);
  assignAddress(data, 'fiscal_state', values.get('estado'), 255);

  return data;
}

function readPage(items: PdfTextItem[]): Map<LabelKey, string> {
  const lines = clusterLines(items);
  const values = new Map<LabelKey, string>();
  let open: OpenField[] = [];
  let openY = 0;

  const commit = () => {
    for (const field of open) {
      if (!FIELD_KEYS.includes(field.key)) {
        continue;
      }
      const value = collapse(field.value);
      if (value) {
        values.set(field.key, value);
      }
    }
  };

  for (const line of lines) {
    const lineY = Math.max(...line.map((item) => item.y));
    const labels = findLabels(line);
    if (labels.length === 0) {
      if (
        open.length > 0 &&
        openY - lineY > 0 &&
        openY - lineY <= CONTINUATION_GAP
      ) {
        appendContinuation(open, line);
        openY = lineY;
      }
      continue;
    }
    commit();
    open = labels;
    openY = lineY;
  }
  commit();

  return values;
}

function clusterLines(items: PdfTextItem[]): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Array<{ y: number; items: PdfTextItem[] }> = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.y - item.y <= LINE_Y_TOLERANCE) {
      last.items.push(item);
      continue;
    }
    lines.push({ y: item.y, items: [item] });
  }
  return lines.map((line) =>
    line.items.sort((a, b) => a.x - b.x || b.y - a.y),
  );
}

function findLabels(line: PdfTextItem[]): OpenField[] {
  const { text, spans } = joinLine(line);
  const found: Array<{ key: LabelKey; start: number; end: number }> = [];
  let index = 0;
  while (index < text.length) {
    const slice = text.slice(index);
    let match: { key: LabelKey; text: string } | null = null;
    for (const label of LABEL_PATTERNS) {
      const foundAt = slice.match(label.pattern);
      if (!foundAt || foundAt.index !== 0) {
        continue;
      }
      if (!match || foundAt[0].length > match.text.length) {
        match = { key: label.key, text: foundAt[0] };
      }
    }
    if (!match) {
      index += 1;
      continue;
    }
    found.push({
      key: match.key,
      start: index,
      end: index + match.text.length,
    });
    index += match.text.length;
  }

  return found.map((label, position) => {
    const next = found[position + 1];
    return {
      key: label.key,
      labelX: xAt(spans, label.start),
      value: text.slice(label.end, next?.start ?? text.length).trim(),
    };
  });
}

function joinLine(items: PdfTextItem[]): { text: string; spans: TextSpan[] } {
  let text = '';
  const spans: TextSpan[] = [];
  for (const item of items) {
    if (text) {
      text += ' ';
    }
    const start = text.length;
    text += item.str;
    spans.push({ start, end: text.length, x: item.x });
  }
  return { text, spans };
}

function xAt(spans: TextSpan[], index: number): number {
  const span = spans.find((item) => index >= item.start && index < item.end);
  return span?.x ?? spans[0]?.x ?? 0;
}

function appendContinuation(fields: OpenField[], line: PdfTextItem[]): void {
  const columns = [...fields].sort((a, b) => a.labelX - b.labelX);
  for (const item of line) {
    let target = columns[0];
    for (const column of columns) {
      if (item.x + 1 >= column.labelX) {
        target = column;
      }
    }
    target.value = `${target.value} ${item.str}`.trim();
  }
}

function legalName(
  personType: 'fisica' | 'moral',
  values: Map<LabelKey, string>,
): string {
  const persona = [
    values.get('nombre'),
    values.get('primerApellido'),
    values.get('segundoApellido'),
  ]
    .map((part) => collapse(part ?? ''))
    .filter(Boolean)
    .join(' ');
  const razon = collapse(values.get('razonSocial') ?? '');
  if (personType === 'fisica' && persona) {
    return persona;
  }
  return razon || persona;
}

function assignAddress(
  data: SatCsfFiscalData,
  key: AddressKey,
  value: string | null | undefined,
  maxLength: number,
): void {
  if (value === undefined) {
    return;
  }
  if (value === null) {
    data[key] = null;
    return;
  }
  const collapsed = collapse(value);
  if (!collapsed) {
    data[key] = null;
    return;
  }
  if (collapsed.length > maxLength) {
    throw new SatCsfParseError(
      'Un dato del domicilio fiscal no cabe en el registro.',
    );
  }
  data[key] = collapsed;
}

function normalizeRfc(value: string | undefined): string | null {
  const compact = fold(value ?? '').replace(/[^A-ZÑ&0-9]/g, '');
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(compact) ? compact : null;
}

function personTypeFromRfc(rfc: string): 'fisica' | 'moral' {
  if (rfc.length === 13) {
    return 'fisica';
  }
  if (rfc.length === 12) {
    return 'moral';
  }
  throw new SatCsfParseError(
    'El RFC de la constancia no tiene un formato válido.',
  );
}

function normalizePostalCode(value: string | undefined): string | null {
  const match = collapse(value ?? '').match(/\d{5}/);
  return match?.[0] ?? null;
}

function emptyInterior(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  const folded = fold(value).replace(/[^A-Z0-9]/g, '');
  if (!folded || folded === 'SINNUMERO' || folded === 'SN' || folded === 'NA') {
    return null;
  }
  return collapse(value);
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}
