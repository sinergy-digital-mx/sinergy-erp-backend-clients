const REGIMEN_FISCAL: Record<string, string> = {
  '601': 'General de Ley Personas Morales',
  '603': 'Personas Morales con Fines no Lucrativos',
  '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
  '606': 'Arrendamiento',
  '607': 'Enajenacion o Adquisicion de Bienes',
  '608': 'Demas ingresos',
  '610': 'Residentes en el Extranjero sin Establecimiento Permanente en Mexico',
  '611': 'Ingresos por Dividendos',
  '612': 'Personas Fisicas con Actividades Empresariales y Profesionales',
  '614': 'Ingresos por intereses',
  '616': 'Sin obligaciones fiscales',
  '620': 'Sociedades Cooperativas de Produccion',
  '621': 'Incorporacion Fiscal',
  '622': 'Actividades Agricolas, Ganaderas, Silvicolas y Pesqueras',
  '623': 'Opcional para Grupos de Sociedades',
  '624': 'Coordinados',
  '625': 'Plataformas Tecnologicas',
  '626': 'Regimen Simplificado de Confianza',
};

const TIPO_COMPROBANTE: Record<string, string> = {
  I: 'Ingreso',
  E: 'Egreso',
  T: 'Traslado',
  N: 'Nomina',
  P: 'Pago',
};

const FORMA_PAGO: Record<string, string> = {
  '01': 'Efectivo',
  '02': 'Cheque nominativo',
  '03': 'Transferencia electronica de fondos',
  '04': 'Tarjeta de credito',
  '28': 'Tarjeta de debito',
  '99': 'Por definir',
};

const METODO_PAGO: Record<string, string> = {
  PUE: 'Pago en una sola exhibicion',
  PPD: 'Pago en parcialidades o diferido',
};

const USO_CFDI: Record<string, string> = {
  G01: 'Adquisicion de mercancias',
  G02: 'Devoluciones, descuentos o bonificaciones',
  G03: 'Gastos en general',
  I01: 'Construcciones',
  P01: 'Por definir',
};

export function labelRegimenFiscal(code: string): string {
  if (!code) {
    return '';
  }
  const label = REGIMEN_FISCAL[code];
  return label ? `${code} - ${label}` : code;
}

export function labelTipoComprobante(code: string): string {
  if (!code) {
    return '';
  }
  const label = TIPO_COMPROBANTE[code];
  return label ? `${code} - ${label}` : code;
}

export function labelFormaPago(code: string): string {
  if (!code) {
    return '';
  }
  const label = FORMA_PAGO[code];
  return label ? `${code} - ${label}` : code;
}

export function labelMetodoPago(code: string): string {
  if (!code) {
    return '';
  }
  const label = METODO_PAGO[code];
  return label ? `${code} - ${label}` : code;
}

export function labelUsoCfdi(code: string): string {
  if (!code) {
    return '';
  }
  const label = USO_CFDI[code];
  return label ? `${code} - ${label}` : code;
}
