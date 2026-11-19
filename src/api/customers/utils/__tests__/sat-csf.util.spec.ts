import {
  parseSatCsfTextItems,
  PdfTextItem,
  SatCsfParseError,
} from '../sat-csf.util';

function text(page: number, rows: [number, number, string][]): PdfTextItem[] {
  return rows.map(([y, x, str]) => ({ y, x, str, page }));
}

/** Coordenadas reales de la CSF de VALDETIERRA (página 1). */
const VALDETIERRA = text(1, [
  [693, 64, 'CÉDULA DE IDENTIFICACIÓN FISCAL'],
  [637, 339, 'CONSTANCIA DE SITUACIÓN FISCAL'],
  [635, 189, 'VAL1904303D2'],
  [625, 154, 'Registro Federal de Contribuyentes'],
  [604, 190, 'VALDETIERRA'],
  [599, 386, 'Lugar y Fecha de Emisión'],
  [594, 161, 'Nombre, denominación o razón'],
  [587, 317, 'ENSENADA , BAJA CALIFORNIA A 14 DE ENERO DE'],
  [585, 207, 'social'],
  [575, 433, '2026'],
  [564, 181, 'idCIF: 19050143620'],
  [554, 166, 'VALIDA TU INFORMACIÓN'],
  [545, 203, 'FISCAL'],
  [525, 416, 'VAL1904303D2'],
  [497, 31, 'Datos de Identificación del Contribuyente:'],
  [477, 36, 'RFC:'],
  [477, 236, 'VAL1904303D2'],
  [455, 36, 'Denominación/Razón Social:'],
  [455, 236, 'VALDETIERRA'],
  [433, 36, 'Régimen Capital:'],
  [433, 236, 'SOCIEDAD ANONIMA DE CAPITAL VARIABLE'],
  [411, 36, 'Nombre Comercial:'],
  [411, 236, 'VALDETIERRA'],
  [389, 36, 'Fecha inicio de operaciones:'],
  [389, 238, '30 DE ABRIL DE 2019'],
  [368, 236, 'ACTIVO'],
  [367, 36, 'Estatus en el padrón:'],
  [346, 36, 'Fecha de último cambio de estado:'],
  [346, 238, '30 DE ABRIL DE 2019'],
  [311, 31, 'Datos del domicilio registrado'],
  [291, 36, 'Código Postal:'],
  [291, 92, '22760'],
  [291, 311, 'Tipo de Vialidad:'],
  [291, 377, 'CERRADA (CDA) O PRIVADA (PRIV)'],
  [269, 36, 'Nombre de Vialidad:'],
  [269, 115, 'LOS BALCONES'],
  [269, 311, 'Número Exterior:'],
  [269, 378, '402'],
  [247, 36, 'Número Interior:'],
  [247, 99, 'SIN NUMERO'],
  [247, 311, 'Nombre de la Colonia:'],
  [247, 398, 'OTRA NO ESPECIFICADA EN EL CATALOGO'],
  [230, 36, 'Nombre'],
  [230, 74, 'de'],
  [230, 91, 'la'],
  [230, 106, 'Localidad:'],
  [230, 154, 'OTRA'],
  [230, 184, 'NO'],
  [230, 204, 'ESPECIFICADA'],
  [230, 270, 'EN'],
  [230, 289, 'EL'],
  [225, 311, 'Nombre del Municipio o Demarcación Territorial:'],
  [225, 498, 'ENSENADA'],
  [221, 36, 'CATALOGO'],
  [203, 36, 'Nombre de la Entidad Federativa:'],
  [203, 165, 'BAJA CALIFORNIA'],
  [203, 311, 'Entre Calle:'],
  [203, 360, 'OCEANO'],
  [182, 35, 'Y Calle:'],
  [182, 67, 'PASEO BAJA MAR'],
  [148, 31, 'Actividades Económicas:'],
  [128, 515, 'Página [1] de [3]'],
]);

describe('parseSatCsfTextItems', () => {
  it('llena RFC, razón social y domicilio de una persona moral', () => {
    expect(parseSatCsfTextItems(VALDETIERRA)).toEqual({
      fiscal_rfc: 'VAL1904303D2',
      fiscal_person_type: 'moral',
      fiscal_razon_social: 'VALDETIERRA',
      fiscal_postal_code: '22760',
      fiscal_country: 'MEX',
      fiscal_street: 'LOS BALCONES',
      fiscal_exterior_number: '402',
      fiscal_interior_number: null,
      fiscal_colonia: 'OTRA NO ESPECIFICADA EN EL CATALOGO',
      fiscal_localidad: 'OTRA NO ESPECIFICADA EN EL CATALOGO',
      fiscal_municipio: 'ENSENADA',
      fiscal_state: 'BAJA CALIFORNIA',
    });
  });

  it('arma el nombre de una persona física y no usa el régimen de capital', () => {
    const parsed = parseSatCsfTextItems(
      text(1, [
        [700, 40, 'CONSTANCIA DE SITUACIÓN FISCAL'],
        [500, 36, 'RFC:'],
        [500, 200, 'LOPM800101AB1'],
        [470, 36, 'Nombre (s):'],
        [470, 200, 'MARIA'],
        [440, 36, 'Primer Apellido:'],
        [440, 200, 'LOPEZ'],
        [410, 36, 'Segundo Apellido:'],
        [410, 200, 'GARCIA'],
        [300, 36, 'Código Postal:'],
        [300, 120, '22040'],
        [300, 311, 'Nombre de Vialidad:'],
        [300, 420, 'JUAREZ'],
        [270, 36, 'Número Exterior:'],
        [270, 140, '10'],
        [270, 311, 'Número Interior:'],
        [270, 400, 'SIN NUMERO'],
        [240, 36, 'Nombre de la Colonia:'],
        [240, 180, 'CENTRO'],
        [210, 36, 'Nombre del Municipio o Demarcación Territorial:'],
        [210, 360, 'TIJUANA'],
        [180, 36, 'Nombre de la Entidad Federativa:'],
        [180, 220, 'BAJA CALIFORNIA'],
      ]),
    );

    expect(parsed.fiscal_rfc).toBe('LOPM800101AB1');
    expect(parsed.fiscal_person_type).toBe('fisica');
    expect(parsed.fiscal_razon_social).toBe('MARIA LOPEZ GARCIA');
    expect(parsed.fiscal_street).toBe('JUAREZ');
    expect(parsed.fiscal_exterior_number).toBe('10');
    expect(parsed.fiscal_interior_number).toBeNull();
    expect(parsed.fiscal_colonia).toBe('CENTRO');
    expect(parsed.fiscal_municipio).toBe('TIJUANA');
    expect(parsed.fiscal_postal_code).toBe('22040');
  });

  it('rechaza un PDF que no es constancia', () => {
    expect(() =>
      parseSatCsfTextItems(
        text(1, [
          [100, 10, 'Factura de venta'],
          [80, 10, 'RFC: XAXX010101000'],
        ]),
      ),
    ).toThrow(SatCsfParseError);
  });

  it('rechaza una constancia sin código postal', () => {
    expect(() =>
      parseSatCsfTextItems(
        text(1, [
          [100, 10, 'CONSTANCIA DE SITUACIÓN FISCAL'],
          [80, 10, 'RFC:'],
          [80, 80, 'VAL1904303D2'],
          [60, 10, 'Denominación/Razón Social:'],
          [60, 180, 'VALDETIERRA'],
        ]),
      ),
    ).toThrow('código postal');
  });
});
