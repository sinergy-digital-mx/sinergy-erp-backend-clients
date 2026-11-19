import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import {
  assertWarehouseLocation,
  describeWarehouseLocationIssue,
  mapWarehousePersistError,
} from './warehouse-address.util';

const valid = {
  name: 'Bodega Norte',
  street: 'Av. Reforma 100',
  city: 'Tijuana',
  state: 'Baja California',
  zip_code: '22000',
  country: 'México',
};

describe('describeWarehouseLocationIssue', () => {
  it('pide la dirección cuando no hay calle, ciudad, estado, C.P. ni país', () => {
    expect(describeWarehouseLocationIssue({ name: 'Bodega Norte' })).toBe(
      'El almacén "Bodega Norte" necesita dirección (calle, ciudad, estado, código postal, país). Usa la de la sucursal o captura una.',
    );
  });

  it('indica solo el código postal cuando el resto está completo', () => {
    expect(
      describeWarehouseLocationIssue({
        ...valid,
        zip_code: '',
      }),
    ).toContain('código postal');
  });

  it('rechaza un C.P. de México que no tiene 5 dígitos', () => {
    expect(describeWarehouseLocationIssue({ ...valid, zip_code: '2200' })).toBe(
      'El código postal del almacén "Bodega Norte" debe tener 5 dígitos. Usa la dirección de la sucursal o corrige el C.P.',
    );
  });

  it('acepta la dirección completa sin GPS', () => {
    expect(describeWarehouseLocationIssue(valid)).toBeNull();
    expect(assertWarehouseLocation(valid)).toMatchObject({
      street: 'Av. Reforma 100',
      zip_code: '22000',
      latitude: null,
      longitude: null,
    });
  });

  it('rechaza una sola coordenada', () => {
    expect(
      describeWarehouseLocationIssue({
        ...valid,
        latitude: 32.5,
        longitude: null,
      }),
    ).toContain('latitud y longitud juntas');
  });

  it('redondea coordenadas válidas a 6 decimales', () => {
    expect(
      assertWarehouseLocation({
        ...valid,
        latitude: 32.514946712,
        longitude: -117.03824719,
      }),
    ).toMatchObject({
      latitude: 32.514947,
      longitude: -117.038247,
    });
  });
});

describe('mapWarehousePersistError', () => {
  it('traduce una columna de dirección nula', () => {
    const error = new QueryFailedError('INSERT', [], {
      code: 'ER_BAD_NULL_ERROR',
      errno: 1048,
      sqlMessage: "Column 'street' cannot be null",
    } as unknown as Error);

    expect(() => mapWarehousePersistError(error, 'Bodega Norte')).toThrow(
      BadRequestException,
    );
    expect(() => mapWarehousePersistError(error, 'Bodega Norte')).toThrow(
      /necesita dirección/,
    );
  });

  it('traduce un valor demasiado largo en la calle', () => {
    const error = new QueryFailedError('INSERT', [], {
      code: 'ER_DATA_TOO_LONG',
      errno: 1406,
      sqlMessage: "Data too long for column 'street' at row 1",
    } as unknown as Error);

    expect(() => mapWarehousePersistError(error, 'Bodega Norte')).toThrow(
      /La calle del almacén "Bodega Norte"/,
    );
  });

  it('traduce coordenadas inválidas', () => {
    const error = new QueryFailedError('INSERT', [], {
      code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
      errno: 1366,
      sqlMessage: "Incorrect decimal value: '' for column 'latitude' at row 1",
    } as unknown as Error);

    expect(() => mapWarehousePersistError(error, 'Bodega Norte')).toThrow(
      /coordenadas del almacén "Bodega Norte"/,
    );
  });

  it('traduce un código duplicado', () => {
    const error = new QueryFailedError('INSERT', [], {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlMessage: "Duplicate entry 'ABC' for key 'code'",
    } as unknown as Error);

    expect(() => mapWarehousePersistError(error, 'Bodega Norte')).toThrow(
      ConflictException,
    );
  });

  it('deja pasar un error que no es de base de datos', () => {
    expect(() =>
      mapWarehousePersistError(new Error('boom'), 'Bodega Norte'),
    ).toThrow('boom');
  });
});
