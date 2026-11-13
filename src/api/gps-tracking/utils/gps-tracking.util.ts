import { Truck } from '../../../entities/logistics/truck.entity';

export interface NormalizedGpsUnit {
  uid: string;
  name: string;
  imei: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  speed: number | null;
  speed_measure: string | null;
  heading: number | null;
  ignition: string | null;
  engine_status: string | null;
  odometer: number | null;
  reported_at: string | null;
  driver_name: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTrackingSince(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[date.getUTCMonth()];
  const yyyy = date.getUTCFullYear();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss}`;
}

export function normalizePlate(value: string | null | undefined): string {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function platesMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = normalizePlate(left);
  const b = normalizePlate(right);
  if (a.length < 4 || b.length < 4) return false;
  return a === b;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  return raw ? raw : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function driverName(driver: unknown): string | null {
  const row = asRecord(driver);
  if (!row) return null;
  const display = text(row.DisplayName) || text(row.Name);
  if (display) return display;
  const parts = [text(row.FirstName), text(row.LastName)].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export function normalizeGpsUnit(raw: unknown): NormalizedGpsUnit | null {
  const row = asRecord(raw);
  if (!row) return null;
  const position = asRecord(row.Position) ?? row;
  const uid = text(row.Uid) || text(row.UnitUid) || text(position.Uid);
  const name = text(row.Name) || text(row.UnitName) || text(position.Name) || uid;
  if (!uid || !name) return null;

  const latitude = numberOrNull(position.Latitude ?? row.Latitude);
  const longitude = numberOrNull(position.Longitude ?? row.Longitude);

  return {
    uid,
    name,
    imei: text(row.Imei) || text(row.IMEI),
    latitude,
    longitude,
    address: text(position.Address) || text(position.LocationDescription) || text(row.Address),
    speed: numberOrNull(position.Speed ?? row.Speed),
    speed_measure: text(position.SpeedMeasure) || text(row.SpeedMeasure),
    heading: numberOrNull(position.Heading ?? row.Heading),
    ignition: text(position.Ignition) || text(row.Ignition),
    engine_status: text(position.EngineStatus) || text(row.EngineStatus),
    odometer: numberOrNull(position.Odometer ?? row.Odometer),
    reported_at:
      text(row.LastReportedTimeUTC) ||
      text(position.GPSTimeUtc) ||
      text(position.GPSTimeUTC) ||
      text(row.LastReportedTimeLocal) ||
      text(position.DateUtc),
    driver_name: driverName(position.Driver) || driverName(row.Driver),
  };
}

export function matchTruckToUnit(
  unit: Pick<NormalizedGpsUnit, 'uid' | 'name'>,
  trucks: Truck[],
): Truck | null {
  const byUid = trucks.find((truck) => truck.gps_unit_uid && truck.gps_unit_uid === unit.uid);
  if (byUid) return byUid;

  const plate = normalizePlate(unit.name);
  if (plate.length < 4) return null;

  return (
    trucks.find((truck) => platesMatch(truck.placa, unit.name)) ||
    trucks.find((truck) => platesMatch(truck.gps_unit_name, unit.name)) ||
    null
  );
}

export function translateGpsProviderError(
  code: string | undefined,
  providerMessage: string | undefined,
): string {
  const message = String(providerMessage ?? '');
  if (code === '51112' || message.includes('tandcnotaccepted')) {
    return 'La cuenta de 3D Tracking todavía no acepta los términos y condiciones. Entra al portal con este usuario, acéptalos y vuelve a probar la conexión.';
  }
  if (code === '50017' || message.toLowerCase().includes('could not be authenticated')) {
    return 'Usuario o contraseña de 3D Tracking incorrectos.';
  }
  if (code === '50006') {
    return 'La cuenta de 3D Tracking está bloqueada.';
  }
  if (message && !message.startsWith('error.')) return message;
  return 'No se pudo consultar 3D Tracking.';
}
