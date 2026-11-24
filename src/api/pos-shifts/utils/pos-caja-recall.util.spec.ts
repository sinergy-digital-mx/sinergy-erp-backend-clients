import { cajaRecallMessage } from './pos-caja-recall.util';

describe('cajaRecallMessage', () => {
  it('nombra al vendedor y el folio', () => {
    expect(cajaRecallMessage('Ana López', 'OSV-000764')).toBe(
      'Ana López regresó OSV-000764 a POS Ventas',
    );
  });

  it('usa Ventas si no hay nombre', () => {
    expect(cajaRecallMessage(null, 'OSV-1')).toBe('Ventas regresó OSV-1 a POS Ventas');
  });

  it('no inventa folio', () => {
    expect(cajaRecallMessage('Ana López', '  ')).toBe(
      'Ana López regresó esta venta a POS Ventas',
    );
  });
});
