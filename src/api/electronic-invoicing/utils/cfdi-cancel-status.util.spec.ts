import {
  isSatCancellationInProcess,
  resolveStampStatusAfterCancelRequest,
  resolveStampStatusAfterSatConsult,
} from './cfdi-cancel-status.util';

describe('cfdi cancel status', () => {
  it('detecta estatus de cancelación en proceso', () => {
    expect(isSatCancellationInProcess('En proceso')).toBe(true);
    expect(isSatCancellationInProcess('Cancelado con aceptación')).toBe(false);
    expect(isSatCancellationInProcess(null)).toBe(false);
  });

  it('deja la solicitud 201 como pendiente hasta que el SAT confirme', () => {
    expect(resolveStampStatusAfterCancelRequest('201', null)).toBe('cancel_pending');
    expect(resolveStampStatusAfterCancelRequest('201 - Solicitud recibida', null)).toBe(
      'cancel_pending',
    );
    expect(resolveStampStatusAfterCancelRequest('202', 'En proceso')).toBe('cancel_pending');
    expect(resolveStampStatusAfterCancelRequest('202', null)).toBe('cancelled');
  });

  it('el sync manda: Cancelado cierra, En proceso vuelve a pendiente', () => {
    expect(resolveStampStatusAfterSatConsult('cancelled', 'Cancelado', 'Cancelado con aceptación')).toBe(
      'cancelled',
    );
    expect(resolveStampStatusAfterSatConsult('cancelled', 'Vigente', 'En proceso')).toBe(
      'cancel_pending',
    );
    expect(resolveStampStatusAfterSatConsult('stamped', 'Vigente', null)).toBe('stamped');
  });
});