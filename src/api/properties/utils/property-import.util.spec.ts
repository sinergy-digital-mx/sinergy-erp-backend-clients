import * as ExcelJS from 'exceljs';
import { buildPropertyImportTemplate, resolvePropertyImportRows, parsePropertyImportWorkbook } from './property-import.util';

const units = [{ id: 'u1', code: 'm2', name: 'Metro cuadrado', symbol: 'm²' }];
const groups = [
  { id: 'g1', name: 'The Plaza at Bajamar' },
  { id: 'g2', name: 'Costa Campestre' },
];

describe('property import', () => {
  it('ignora la fila de ejemplo y no arma lotes', async () => {
    const buffer = await buildPropertyImportTemplate({ units, groups });
    const parsed = parsePropertyImportWorkbook(buffer);
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors).toHaveLength(0);
  });

  it('trae hoja Grupos con los nombres del catálogo', async () => {
    const buffer = await buildPropertyImportTemplate({ units, groups });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Grupos');
    expect(sheet).toBeTruthy();
    expect(sheet!.getCell('A2').value).toBe('The Plaza at Bajamar');
    expect(sheet!.getCell('A3').value).toBe('Costa Campestre');
    const lotes = workbook.getWorksheet('Lotes');
    const headers = (lotes!.getRow(1).values as unknown[]).map((cell) => String(cell ?? ''));
    expect(headers).not.toContain('ubicacion');
    expect(headers).toContain('grupo');
  });

  it('rechaza manzana repetida, unidad y grupo desconocidos sin armar lotes', async () => {
    const buffer = await buildPropertyImportTemplate({ units, groups });
    const parsed = parsePropertyImportWorkbook(buffer);
    parsed.rows.push(
      {
        row: 3,
        values: {
          name: 'Lote 1',
          group: 'The Plaza at Bajamar',
          area: 200,
          unit: 'm2',
          block: '1',
          lot_number: '1',
          price_per_m2: 100,
          currency: 'usd',
          status: 'Disponible',
        },
      },
      {
        row: 4,
        values: {
          name: 'Lote 2',
          group: 'No existe',
          area: 0,
          unit: 'ha',
          block: '1',
          lot_number: '1',
          total_price: '',
          price_per_m2: '',
        },
      },
    );

    const result = resolvePropertyImportRows(parsed.rows, {
      groups,
      units,
      existingCodes: new Set(['lot-9-01']),
    });

    expect(result.ready).toHaveLength(1);
    expect(result.ready[0].dto.code).toBe('LOT-1-01');
    expect(result.errors.map((error) => error.row)).toEqual(expect.arrayContaining([4]));
    expect(result.errors.some((error) => error.message.includes('repetido'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('No existe la unidad'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('No existe el grupo'))).toBe(true);
  });

  it('omite códigos ya existentes y sigue con el resto', () => {
    const result = resolvePropertyImportRows(
      [
        {
          row: 2,
          values: {
            name: 'Ya existe',
            group: 'The Plaza at Bajamar',
            area: 200,
            unit: 'm2',
            block: '4',
            lot_number: '1',
            price_per_m2: 100,
          },
        },
        {
          row: 3,
          values: {
            name: 'Nuevo',
            group: 'Costa Campestre',
            area: 180,
            unit: 'm2',
            block: '8',
            lot_number: '2',
            price_per_m2: 90,
          },
        },
      ],
      { groups, units, existingCodes: new Set(['lot-4-01']) },
    );

    expect(result.ready.map((item) => item.dto.code)).toEqual(['LOT-8-02']);
    expect(result.errors).toEqual([
      expect.objectContaining({
        row: 2,
        code: 'LOT-4-01',
        message: 'Ya existe un lote con el código "LOT-4-01".',
      }),
    ]);
  });

  it('arma el código LOT-manzana-número y toma el grupo de la fila', async () => {
    const buffer = await buildPropertyImportTemplate({ units, groups });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    workbook.getWorksheet('Lotes')!.addRow([
      'Lote 20',
      'Costa Campestre',
      300,
      'm²',
      'C',
      '4',
      'CAT-1',
      'Esquina',
      '',
      45000,
      'MXN',
      'reservado',
    ]);
    const written = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = parsePropertyImportWorkbook(written);
    const result = resolvePropertyImportRows(parsed.rows, {
      groups,
      units,
      existingCodes: new Set(),
    });

    expect(result.errors).toEqual([]);
    expect(result.ready[0].dto).toEqual(
      expect.objectContaining({
        code: 'LOT-C-04',
        name: 'Lote 20',
        group_id: 'g2',
        total_area: 300,
        measurement_unit_id: 'u1',
        total_price: 45000,
        currency: 'MXN',
        status: 'reservado',
        cadastral_key: 'CAT-1',
        block: 'C',
        lot_number: '4',
      }),
    );
  });

  it('resuelve unidad, grupo y precio por m²', () => {
    const result = resolvePropertyImportRows(
      [
        {
          row: 2,
          values: {
            name: 'Lote 10',
            group: 'the plaza at bajamar',
            area: '180.5',
            unit: 'M²',
            block: 'B',
            lot_number: '10',
            price_per_m2: '90',
            currency: 'MXN',
          },
        },
      ],
      { groups, units, existingCodes: new Set() },
    );

    expect(result.errors).toEqual([]);
    expect(result.ready.map((item) => item.dto)).toEqual([
      expect.objectContaining({
        code: 'LOT-B-10',
        group_id: 'g1',
        measurement_unit_id: 'u1',
        total_area: 180.5,
        price_per_m2: 90,
        currency: 'MXN',
        block: 'B',
        lot_number: '10',
      }),
    ]);
  });
});
