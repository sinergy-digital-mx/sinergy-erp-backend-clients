import { randomBytes } from 'crypto';

export interface CartaPorteCheck {
  ready: boolean;
  missing: string[];
}

export interface CartaPorteDriverInput {
  is_driver?: boolean | number | string | null;
  first_name?: string | null;
  last_name?: string | null;
  driver_license_number?: string | null;
  driver_rfc?: string | null;
}

export interface CartaPorteTruckInput {
  placa?: string | null;
  anio?: string | null;
  permiso_sct?: string | null;
  numero_permiso_sct?: string | null;
  tipo_auto_transporte?: string | null;
  peso_bruto_vehicular?: number | string | null;
  aseguradora_rc?: string | null;
  poliza_rc?: string | null;
  subtipo_remolque1?: string | null;
  placa_remolque1?: string | null;
}

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

const STATE_CODES: Record<string, string> = {
  agu: 'AGU',
  aguascalientes: 'AGU',
  bcn: 'BCN',
  bc: 'BCN',
  bajacalifornia: 'BCN',
  bcs: 'BCS',
  bajacaliforniasur: 'BCS',
  cam: 'CAM',
  campeche: 'CAM',
  chp: 'CHP',
  chiapas: 'CHP',
  chh: 'CHH',
  chihuahua: 'CHH',
  cmx: 'CMX',
  dif: 'CMX',
  cdmx: 'CMX',
  ciudaddemexico: 'CMX',
  distritofederal: 'CMX',
  coa: 'COA',
  coahuila: 'COA',
  col: 'COL',
  colima: 'COL',
  dur: 'DUR',
  durango: 'DUR',
  gua: 'GUA',
  guanajuato: 'GUA',
  gro: 'GRO',
  guerrero: 'GRO',
  hid: 'HID',
  hidalgo: 'HID',
  jal: 'JAL',
  jalisco: 'JAL',
  mex: 'MEX',
  mexico: 'MEX',
  estadodemexico: 'MEX',
  edomex: 'MEX',
  mic: 'MIC',
  michoacan: 'MIC',
  mor: 'MOR',
  morelos: 'MOR',
  nay: 'NAY',
  nayarit: 'NAY',
  nle: 'NLE',
  nuevoleon: 'NLE',
  oax: 'OAX',
  oaxaca: 'OAX',
  pue: 'PUE',
  puebla: 'PUE',
  que: 'QUE',
  queretaro: 'QUE',
  roo: 'ROO',
  quintanaroo: 'ROO',
  slp: 'SLP',
  sanluispotosi: 'SLP',
  sin: 'SIN',
  sinaloa: 'SIN',
  son: 'SON',
  sonora: 'SON',
  tab: 'TAB',
  tabasco: 'TAB',
  tam: 'TAM',
  tamaulipas: 'TAM',
  tla: 'TLA',
  tlaxcala: 'TLA',
  ver: 'VER',
  veracruz: 'VER',
  yuc: 'YUC',
  yucatan: 'YUC',
  zac: 'ZAC',
  zacatecas: 'ZAC',
};

export function isDriverFlag(value: CartaPorteDriverInput['is_driver']): boolean {
  return value === true || value === 1 || value === '1';
}

export function assessDriver(
  input: CartaPorteDriverInput | null | undefined,
): CartaPorteCheck {
  const missing: string[] = [];
  if (!input || !isDriverFlag(input.is_driver)) {
    missing.push('El usuario no está marcado como chofer');
    return { ready: false, missing };
  }
  const name = [input.first_name, input.last_name].filter(Boolean).join(' ').trim();
  if (!name) missing.push('Falta el nombre del chofer');
  const license = (input.driver_license_number ?? '').trim();
  if (license.length < 5) missing.push('Falta el número de licencia');
  const rfc = (input.driver_rfc ?? '').trim();
  if (!RFC_PATTERN.test(rfc)) missing.push('Falta un RFC válido del chofer');
  return { ready: missing.length === 0, missing };
}

export function assessTruck(
  input: CartaPorteTruckInput | null | undefined,
): CartaPorteCheck {
  const missing: string[] = [];
  if (!input) {
    return { ready: false, missing: ['Falta la unidad'] };
  }
  if (!(input.placa ?? '').trim()) missing.push('Falta la placa');
  if (!/^\d{4}$/.test((input.anio ?? '').trim()))
    missing.push('Falta el año del vehículo (4 dígitos)');
  if (!(input.permiso_sct ?? '').trim()) missing.push('Falta el permiso SCT');
  if (!(input.numero_permiso_sct ?? '').trim())
    missing.push('Falta el número de permiso SCT');
  if (!(input.tipo_auto_transporte ?? '').trim()) {
    missing.push('Falta la configuración vehicular');
  }
  const peso = Number(input.peso_bruto_vehicular);
  if (!Number.isFinite(peso) || peso <= 0) {
    missing.push('Falta el peso bruto vehicular en toneladas');
  }
  if (!(input.aseguradora_rc ?? '').trim())
    missing.push('Falta la aseguradora de responsabilidad civil');
  if (!(input.poliza_rc ?? '').trim())
    missing.push('Falta la póliza de responsabilidad civil');
  const trailerType = (input.subtipo_remolque1 ?? '').trim();
  const trailerPlate = (input.placa_remolque1 ?? '').trim();
  if (trailerType && !trailerPlate) missing.push('Falta la placa del remolque');
  if (trailerPlate && !trailerType) missing.push('Falta el subtipo del remolque');
  return { ready: missing.length === 0, missing };
}

export function normalizeRfc(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function normalizeLicense(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function isValidRfc(value: string | null | undefined): boolean {
  return RFC_PATTERN.test((value ?? '').trim());
}

export function buildIdCcp(): string {
  const hex = randomBytes(16).toString('hex').toUpperCase();
  return `CCC${hex.slice(0, 5)}-${hex.slice(5, 9)}-${hex.slice(9, 13)}-${hex.slice(13, 17)}-${hex.slice(17, 29)}`;
}

export function satStateCode(value: string | null | undefined): string | null {
  const raw = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
  if (!raw) return null;
  return STATE_CODES[raw] ?? null;
}

export function postalCode(value: string | null | undefined): string | null {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length === 5 ? digits : null;
}

export function plateCode(value: string | null | undefined): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function kg(value: number): string {
  return value.toFixed(3);
}

export function money0(): string {
  return '0.00';
}

export function decorateShippingCartaPorte<
  T extends {
    driver?: CartaPorteDriverInput | null;
    truck?: CartaPorteTruckInput | null;
  },
>(shipping: T): T {
  const driver = assessDriver(shipping.driver);
  const truck = assessTruck(shipping.truck);
  const view = Object.assign(shipping, {
    driver_carta_porte_ready: driver.ready,
    driver_carta_porte_missing: driver.missing,
    truck_carta_porte_ready: truck.ready,
    truck_carta_porte_missing: truck.missing,
  });
  if ('carta_porte_xml' in view) {
    delete (view as { carta_porte_xml?: unknown }).carta_porte_xml;
  }
  return view;
}

export function splitWeightKg(totalKg: number, quantities: number[]): number[] {
  const sum = quantities.reduce((acc, qty) => acc + (qty > 0 ? qty : 0), 0);
  const base = sum > 0 ? quantities : quantities.map(() => 1);
  const divisor = base.reduce((acc, qty) => acc + qty, 0) || 1;
  const rounded = base.map(
    (qty) => Math.round(((totalKg * qty) / divisor) * 1000) / 1000,
  );
  const drift =
    Math.round((totalKg - rounded.reduce((acc, qty) => acc + qty, 0)) * 1000) / 1000;
  if (rounded.length) {
    rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 1000) / 1000;
  }
  return rounded.map((value) => (value > 0 ? value : 0.001));
}
