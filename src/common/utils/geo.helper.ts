export interface GeoPoint {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distancia en línea recta (Haversine) entre dos puntos, en km.
 * No es routing de calles.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function hasValidGps(point: GeoPoint | null | undefined): boolean {
  if (!point) return false;
  const { latitude, longitude } = point;
  return (
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
  );
}

/**
 * Suma Haversine entre puntos consecutivos con GPS válido.
 * Redondea a 2 decimales. Sin puntos suficientes → null.
 */
export function routeDistanceKm(points: GeoPoint[]): number | null {
  const valid = points.filter(hasValidGps).map((p) => ({
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
  }));

  if (valid.length < 2) return null;

  let total = 0;
  for (let i = 1; i < valid.length; i++) {
    total += haversineKm(
      valid[i - 1].latitude,
      valid[i - 1].longitude,
      valid[i].latitude,
      valid[i].longitude,
    );
  }

  return Math.round(total * 100) / 100;
}

/**
 * Distancia del tramo desde el punto anterior con GPS hasta el actual.
 * Si alguno no tiene GPS → null.
 */
export function segmentDistanceKm(
  previous: GeoPoint | null | undefined,
  current: GeoPoint | null | undefined,
): number | null {
  if (!hasValidGps(previous) || !hasValidGps(current)) return null;
  const km = haversineKm(
    Number(previous!.latitude),
    Number(previous!.longitude),
    Number(current!.latitude),
    Number(current!.longitude),
  );
  return Math.round(km * 100) / 100;
}
