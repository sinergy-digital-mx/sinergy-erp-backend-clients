import * as XLSX from 'xlsx';
import {
  normalizeUomName,
  parseMadereriaInventoryExcel,
  selectPrimaryPedimento,
} from './excel-inventory.parser';

function sheetBuffer(rows: unknown[][]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xls' }) as Buffer;
}

describe('parseMadereriaInventoryExcel', () => {
  it('lee el reporte CLAVE SAT / pedimentos y recorta el código', () => {
    const buffer = sheetBuffer([
      ['MADERERIA ZONA NORTE'],
      ['MZN CENTRAL'],
      ['REPORTE DE ARTICULOS POR INV PRECIO1/COSTO PROMEDIO -CLAVE SAT/PEDIMENTOS'],
      [],
      [],
      [
        'CODIGO',
        'DESCRIPCION',
        null,
        'CLAVE SAT',
        'PEDIMENTO/FECHA/ADUANA/PROVEEDOR',
        'UM',
        'PRECIO1',
        'COSTO PROM',
        null,
        'CANTIDAD',
        null,
        'TOT COSTO',
      ],
      [
        '          ALC1CAS',
        'ALDER 4/4 CUSTOM',
        null,
        '11121600',
        '26  40  3591  6004274 - 2026/09/18 - 400-CASCADE HARDWOOD INC.\n',
        'PIE TABLA',
        20.22,
        15.4,
        null,
        1083.5,
        null,
        '$16,689.24',
      ],
      [
        'ALS2',
        'ALDER 8/4 SUPERIOR 1-CARA',
        null,
        11121600,
        '26  40  3591  6003574 - 2026/07/02 - 400-NORTHWEST\n26  40  3591  6001247 - 2026/02/25 - 400-NORTHWEST',
        'PIEZA',
        56,
        41.19,
        null,
        813.5,
        null,
        null,
      ],
      [
        '9115821',
        'ATIRA RIEL DER 470/30KG TOTAL PUSH INTEG',
        null,
        '31162800',
        null,
        'JUEGO',
        10,
        5,
        null,
        2,
        null,
        null,
      ],
      [
        'DEC1X6',
        'DECK SINTETICO 1X6',
        null,
        1010101,
        null,
        null,
        12,
        8,
        null,
        1,
        null,
        null,
      ],
      [
        '4145SS',
        'BROCA',
        null,
        '27112800',
        '3508-2000557 - 2026/09/30 - -0\n',
        '  juego  ',
        9,
        4,
        null,
        3,
        null,
        null,
      ],
      ['Cant. Arts:\n', null, 5, null, 'TOTAL POR CANTIDAD', 100],
      ['PRECIOS Y COSTOS POR UNIDAD', null, null, null, null, 'Fecha'],
    ]);

    const rows = parseMadereriaInventoryExcel(buffer);

    expect(rows.map((row) => row.sku)).toEqual([
      'ALC1CAS',
      'ALS2',
      '9115821',
      'DEC1X6',
      '4145SS',
    ]);

    expect(rows[0]).toMatchObject({
      sat_clave: '11121600',
      uom: 'Pie Tabla',
      price: 20.22,
      cost: 15.4,
      quantity: 1083.5,
    });
    expect(rows.map((row) => row.uom)).toEqual([
      'Pie Tabla',
      'Pieza',
      'Juego',
      null,
      'Juego',
    ]);
    expect(rows[0].pedimentos).toEqual([
      {
        number: '26  40  3591  6004274',
        date: '2026-09-18',
        customs: '400',
        vendor: 'CASCADE HARDWOOD INC.',
        raw: '26  40  3591  6004274 - 2026/09/18 - 400-CASCADE HARDWOOD INC.',
      },
    ]);

    expect(selectPrimaryPedimento(rows[1].pedimentos)?.number).toBe(
      '26  40  3591  6003574',
    );
    expect(rows[1].pedimentos[1]).toMatchObject({
      number: '26  40  3591  6001247',
      date: '2026-02-25',
      vendor: 'NORTHWEST',
    });

    expect(rows[2].name).toContain('TOTAL');
    expect(rows[3].sat_clave).toBe('01010101');
    expect(rows[4].pedimentos[0]).toMatchObject({
      number: '3508-2000557',
      date: '2026-09-30',
      customs: null,
      vendor: null,
    });
  });

  it('normaliza UM repetidas del reporte a nombre de catálogo', () => {
    expect(normalizeUomName('  PIE   TABLA ')).toBe('Pie Tabla');
    expect(normalizeUomName('PIEZA')).toBe('Pieza');
    expect(normalizeUomName('juego')).toBe('Juego');
    expect(normalizeUomName('Pie Tabla')).toBe('Pie Tabla');
    expect(normalizeUomName('')).toBeNull();
    expect(normalizeUomName(null)).toBeNull();
  });

  it('sigue leyendo archivos sin columna UM', () => {
    const buffer = sheetBuffer([
      [
        'CODIGO',
        'DESCRIPCION',
        'CLAVE SAT',
        'PRECIO1',
        'COSTO PROM',
        'CANTIDAD',
      ],
      ['SKU1', 'TABLA', '11121600', 10, 8, 2],
    ]);

    const rows = parseMadereriaInventoryExcel(buffer);
    expect(rows[0]).toMatchObject({ sku: 'SKU1', uom: null, quantity: 2 });
  });
});
