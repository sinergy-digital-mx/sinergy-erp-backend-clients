import { Truck } from '../../../entities/logistics/truck.entity';
import {
  matchTruckToUnit,
  normalizeGpsUnit,
  normalizePlate,
  platesMatch,
  translateGpsProviderError,
} from './gps-tracking.util';

describe('gps-tracking.util', () => {
  it('normaliza una unidad con posición anidada', () => {
    const unit = normalizeGpsUnit({
      Uid: 'u-1',
      Name: 'ABC-123',
      Imei: '111',
      LastReportedTimeUTC: '2026-10-08T20:36:00Z',
      Position: {
        Latitude: 19.43,
        Longitude: -99.13,
        Speed: 4,
        SpeedMeasure: 'km/h',
        Heading: 90,
        Ignition: 'On',
        Address: 'México',
        Driver: { FirstName: 'Ana', LastName: 'López' },
      },
    });

    expect(unit).toMatchObject({
      uid: 'u-1',
      name: 'ABC-123',
      latitude: 19.43,
      longitude: -99.13,
      speed: 4,
      driver_name: 'Ana López',
      reported_at: '2026-10-08T20:36:00Z',
    });
  });

  it('compara placas ignorando guiones y espacios', () => {
    expect(normalizePlate('abc-12 3')).toBe('ABC123');
    expect(platesMatch('ABC-123', 'abc123')).toBe(true);
    expect(platesMatch('AB', 'AB')).toBe(false);
  });

  it('enlaza por uid y, si no hay, por placa', () => {
    const trucks = [
      { id: '1', gps_unit_uid: 'u-9', gps_unit_name: 'Otra', placa: 'ZZZ111' },
      { id: '2', gps_unit_uid: null, gps_unit_name: null, placa: 'REM-1016' },
    ] as Truck[];

    expect(matchTruckToUnit({ uid: 'u-9', name: 'Sin placa' }, trucks)?.id).toBe('1');
    expect(matchTruckToUnit({ uid: 'u-2', name: 'REM 1016' }, trucks)?.id).toBe('2');
    expect(matchTruckToUnit({ uid: 'u-3', name: 'Libre' }, trucks)).toBeNull();
  });

  it('traduce el error de términos y condiciones', () => {
    expect(translateGpsProviderError('51112', 'error.tandcnotaccepted')).toContain(
      'términos y condiciones',
    );
  });
});
