import { BadRequestException, ConflictException, HttpException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export interface WarehouseLocationInput {
  name?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface NormalizedWarehouseLocation {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

const TEXT_LIMIT = 255;
const POSTAL_LIMIT = 20;

const ADDRESS_COLUMNS = new Set<string>([
  'street',
  'city',
  'state',
  'zip_code',
  'country',
]);

export function describeWarehouseLocationIssue(input: WarehouseLocationInput): string | null {
  const name = readText(input.name);
  const street = readText(input.street);
  const city = readText(input.city);
  const state = readText(input.state);
  const zip = readText(input.zip_code);
  const country = readText(input.country);

  const missing: string[] = [];
  if (street.length < 5) missing.push('calle');
  if (city.length < 2) missing.push('ciudad');
  if (state.length < 2) missing.push('estado');
  if (!zip) missing.push('código postal');
  if (country.length < 2) missing.push('país');
  if (missing.length) {
    return `${warehouseSubject(name)} necesita dirección (${missing.join(', ')}). Usa la de la sucursal o captura una.`;
  }

  if (street.length > TEXT_LIMIT) {
    return `La calle ${ofWarehouse(name)} no puede pasar de ${TEXT_LIMIT} caracteres.`;
  }
  if (city.length > TEXT_LIMIT) {
    return `La ciudad ${ofWarehouse(name)} no puede pasar de ${TEXT_LIMIT} caracteres.`;
  }
  if (state.length > TEXT_LIMIT) {
    return `El estado ${ofWarehouse(name)} no puede pasar de ${TEXT_LIMIT} caracteres.`;
  }
  if (country.length > TEXT_LIMIT) {
    return `El país ${ofWarehouse(name)} no puede pasar de ${TEXT_LIMIT} caracteres.`;
  }
  if (zip.length > POSTAL_LIMIT) {
    return `El código postal ${ofWarehouse(name)} no puede pasar de ${POSTAL_LIMIT} caracteres.`;
  }

  if (isMexico(country) && !/^\d{5}$/.test(zip)) {
    return `El código postal ${ofWarehouse(name)} debe tener 5 dígitos. Usa la dirección de la sucursal o corrige el C.P.`;
  }
  if (!isMexico(country) && !/^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/.test(zip)) {
    return `El código postal ${ofWarehouse(name)} no es válido. Usa la dirección de la sucursal o corrige el C.P.`;
  }

  const latitude = readCoord(input.latitude);
  const longitude = readCoord(input.longitude);
  if (latitude === 'invalid' || longitude === 'invalid') {
    return `Las coordenadas ${ofWarehouse(name)} no son válidas. Déjalas vacías o ubica el almacén en el mapa.`;
  }
  if ((latitude == null) !== (longitude == null)) {
    return `${warehouseSubject(name)} necesita latitud y longitud juntas, o ninguna. Ubícalo en el mapa o borra la coordenada suelta.`;
  }
  if (typeof latitude === 'number' && (latitude < -90 || latitude > 90)) {
    return `La latitud ${ofWarehouse(name)} debe estar entre -90 y 90.`;
  }
  if (typeof longitude === 'number' && (longitude < -180 || longitude > 180)) {
    return `La longitud ${ofWarehouse(name)} debe estar entre -180 y 180.`;
  }

  return null;
}

export function assertWarehouseLocation(input: WarehouseLocationInput): NormalizedWarehouseLocation {
  const issue = describeWarehouseLocationIssue(input);
  if (issue) {
    throw new BadRequestException(issue);
  }

  const latitude = readCoord(input.latitude);
  const longitude = readCoord(input.longitude);

  return {
    street: readText(input.street),
    city: readText(input.city),
    state: readText(input.state),
    zip_code: readText(input.zip_code),
    country: readText(input.country),
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
  };
}

export function mapWarehousePersistError(error: unknown, warehouseName?: string | null): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const name = readText(warehouseName);

  if (error instanceof QueryFailedError) {
    const driver = (error.driverError ?? {}) as {
      code?: string;
      errno?: number;
      sqlMessage?: string;
    };
    const sql = `${driver.sqlMessage ?? ''} ${error.message ?? ''}`;
    const column = extractColumn(sql);
    const code = driver.code ?? '';
    const errno = driver.errno;

    if (
      code === 'ER_BAD_NULL_ERROR' ||
      errno === 1048 ||
      /cannot be null/i.test(sql)
    ) {
      throw new BadRequestException(missingAddressMessage(name));
    }

    if (
      code === 'ER_DATA_TOO_LONG' ||
      errno === 1406 ||
      code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
      errno === 1366 ||
      code === 'ER_WARN_DATA_OUT_OF_RANGE' ||
      errno === 1264 ||
      /data too long|incorrect .* value|out of range/i.test(sql)
    ) {
      throw new BadRequestException(columnProblemMessage(name, column));
    }

    if (code === 'ER_DUP_ENTRY' || errno === 1062) {
      throw new ConflictException('Ya existe un almacén con ese código.');
    }
  }

  throw error;
}

function warehouseSubject(name: string): string {
  return name ? `El almacén "${name}"` : 'Este almacén';
}

function ofWarehouse(name: string): string {
  return name ? `del almacén "${name}"` : 'del almacén';
}

function missingAddressMessage(name: string): string {
  return `${warehouseSubject(name)} necesita dirección. Usa la de la sucursal o captura calle, ciudad, estado, código postal y país.`;
}

function columnProblemMessage(name: string, column: string | null): string {
  if (column === 'latitude' || column === 'longitude') {
    return `Las coordenadas ${ofWarehouse(name)} no son válidas. Déjalas vacías o ubica el almacén en el mapa.`;
  }

  const field: Record<string, string> = {
    street: 'La calle',
    city: 'La ciudad',
    state: 'El estado',
    zip_code: 'El código postal',
    country: 'El país',
    name: 'El nombre',
    description: 'La descripción',
    prefix: 'El prefijo',
  };
  const label = column ? field[column] : undefined;

  if (label && column && ADDRESS_COLUMNS.has(column)) {
    return `${label} ${ofWarehouse(name)} no es válida o es demasiado larga. Usa la dirección de la sucursal o corrígela.`;
  }

  if (label) {
    const detail = `${label.charAt(0).toLowerCase()}${label.slice(1)}`;
    return name
      ? `No se pudo guardar el almacén "${name}": revisa ${detail}.`
      : `No se pudo guardar el almacén: revisa ${detail}.`;
  }

  return missingAddressMessage(name);
}

function extractColumn(sql: string): string | null {
  const match = sql.match(/column ['`]([^'`]+)['`]/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function readText(value: unknown): string {
  return String(value ?? '').trim();
}

function readCoord(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return 'invalid';
  return Number(parsed.toFixed(6));
}

function isMexico(country: string): boolean {
  const normalized = country
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalized === 'mexico' || normalized === 'mx';
}
