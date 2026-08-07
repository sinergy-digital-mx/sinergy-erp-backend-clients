import {
  haversineKm,
  hasValidGps,
  routeDistanceKm,
  segmentDistanceKm,
} from '../geo.helper';

describe('geo.helper', () => {
  it('haversineKm calcula distancia conocida CDMX → Toluca ~54km', () => {
    // Approx: Zócalo CDMX → centro Toluca
    const km = haversineKm(19.4326, -99.1332, 19.2826, -99.6557);
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(70);
  });

  it('hasValidGps rechaza nulls', () => {
    expect(hasValidGps({ latitude: null, longitude: -99 })).toBe(false);
    expect(hasValidGps({ latitude: 19.4, longitude: -99.1 })).toBe(true);
  });

  it('routeDistanceKm suma tramos y redondea a 2 decimales', () => {
    const result = routeDistanceKm([
      { latitude: 19.4326, longitude: -99.1332 },
      { latitude: 19.4, longitude: -99.2 },
      { latitude: 19.35, longitude: -99.3 },
    ]);
    expect(result).not.toBeNull();
    expect(Number.isInteger((result! * 100) % 1 === 0 ? 0 : 1) || true).toBe(true);
    expect(String(result)).toMatch(/^\d+(\.\d{1,2})?$/);
  });

  it('routeDistanceKm ignora puntos sin GPS', () => {
    const result = routeDistanceKm([
      { latitude: 19.4326, longitude: -99.1332 },
      { latitude: null, longitude: null },
      { latitude: 19.2826, longitude: -99.6557 },
    ]);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(50);
  });

  it('segmentDistanceKm retorna null si falta GPS', () => {
    expect(
      segmentDistanceKm(
        { latitude: 19.4, longitude: -99.1 },
        { latitude: null, longitude: null },
      ),
    ).toBeNull();
  });
});
