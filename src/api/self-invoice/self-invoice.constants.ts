export const SELF_INVOICE_USO_CFDI = [
  { value: 'G01', label: 'G01 — Adquisición de mercancías' },
  { value: 'G03', label: 'G03 — Gastos en general' },
  { value: 'I01', label: 'I01 — Construcciones' },
  { value: 'I02', label: 'I02 — Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 — Equipo de transporte' },
  { value: 'I04', label: 'I04 — Equipo de cómputo' },
  { value: 'I08', label: 'I08 — Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 — Honorarios médicos' },
  { value: 'S01', label: 'S01 — Sin efectos fiscales' },
] as const;

export const SELF_INVOICE_REGIMEN_RECEPTOR = [
  { value: '601', label: '601 — General de Ley Personas Morales' },
  { value: '603', label: '603 — Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 — Sueldos y Salarios' },
  { value: '606', label: '606 — Arrendamiento' },
  { value: '608', label: '608 — Demás ingresos' },
  { value: '612', label: '612 — Personas Físicas con Actividades Empresariales' },
  { value: '616', label: '616 — Sin obligaciones fiscales' },
  { value: '621', label: '621 — Incorporación Fiscal' },
  { value: '625', label: '625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', label: '626 — Régimen Simplificado de Confianza' },
] as const;

export const SELF_INVOICE_FORMA_PAGO = [
  { value: '01', label: '01 — Efectivo' },
  { value: '03', label: '03 — Transferencia electrónica' },
  { value: '04', label: '04 — Tarjeta de crédito' },
  { value: '28', label: '28 — Tarjeta de débito' },
  { value: '99', label: '99 — Por definir' },
] as const;

export const SELF_INVOICE_CATALOGS = {
  uso_cfdi: SELF_INVOICE_USO_CFDI,
  regimen_fiscal_receptor: SELF_INVOICE_REGIMEN_RECEPTOR,
  forma_pago: SELF_INVOICE_FORMA_PAGO,
  metodo_pago: [
    { value: 'PUE', label: 'PUE — Pago en una sola exhibición' },
    { value: 'PPD', label: 'PPD — Pago en parcialidades o diferido' },
  ],
};

export const SAT_CLAVE_UNIDAD_BY_UOM: Record<string, string> = {
  PIEZA: 'H87',
  PIEZAS: 'H87',
  PZ: 'H87',
  PZA: 'H87',
  'PZA.': 'H87',
  UNIT: 'H87',
  UNIDAD: 'H87',
  KG: 'KGM',
  KGS: 'KGM',
  KILO: 'KGM',
  KILOGRAMO: 'KGM',
  M: 'MTR',
  MT: 'MTR',
  MTS: 'MTR',
  METRO: 'MTR',
  METROS: 'MTR',
  L: 'LTR',
  LT: 'LTR',
  LTS: 'LTR',
  LITRO: 'LTR',
  LITROS: 'LTR',
};

export const DEFAULT_SAT_CLAVE_PROD_SERV = '01010101';
export const DEFAULT_SAT_CLAVE_UNIDAD = 'H87';
