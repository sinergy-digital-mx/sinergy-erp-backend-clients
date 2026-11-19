import { assessDriver, assessTruck, buildIdCcp, satStateCode } from './carta-porte.util';

describe('carta porte readiness', () => {
  it('pide licencia y RFC cuando el usuario es chofer', () => {
    const check = assessDriver({
      is_driver: true,
      first_name: 'Rodolfo',
      last_name: 'Rodríguez',
      driver_license_number: '',
      driver_rfc: '',
    });
    expect(check.ready).toBe(false);
    expect(check.missing.join(' ')).toContain('licencia');
    expect(check.missing.join(' ')).toContain('RFC');
  });

  it('marca listo al chofer con nombre, licencia y RFC', () => {
    const check = assessDriver({
      is_driver: 1,
      first_name: 'Rodolfo',
      last_name: 'Rodríguez',
      driver_license_number: 'A1234567',
      driver_rfc: 'RODR800101XXX',
    });
    expect(check.ready).toBe(true);
  });

  it('exige peso bruto y permiso SCT en la unidad', () => {
    const check = assessTruck({
      placa: 'ABC1234',
      anio: '2022',
      permiso_sct: 'TPAF01',
      numero_permiso_sct: '123',
      tipo_auto_transporte: 'C2',
      aseguradora_rc: 'Qualitas',
      poliza_rc: 'POL-1',
    });
    expect(check.ready).toBe(false);
    expect(check.missing.join(' ')).toContain('peso bruto');
  });

  it('arma un IdCCP con prefijo CCC', () => {
    expect(buildIdCcp()).toMatch(
      /^CCC[A-F0-9]{5}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/,
    );
  });

  it('traduce el estado al catálogo del SAT', () => {
    expect(satStateCode('Ciudad de México')).toBe('CMX');
    expect(satStateCode('Jalisco')).toBe('JAL');
  });
});
