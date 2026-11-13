export function isSatCancellationInProcess(estatus?: string | null): boolean {
  return /proceso/i.test(String(estatus ?? ''));
}

export function resolveStampStatusAfterCancelRequest(
  estatusUuid?: string | null,
  estatusCancelacion?: string | null,
): 'cancel_pending' | 'cancelled' {
  if (isSatCancellationInProcess(estatusCancelacion)) {
    return 'cancel_pending';
  }
  const code = String(estatusUuid ?? '').trim();
  if (code === '201' || code.startsWith('201')) {
    return 'cancel_pending';
  }
  return 'cancelled';
}

export function resolveStampStatusAfterSatConsult(
  currentStampStatus: string,
  satStatus: string | null | undefined,
  estatusCancelacion: string | null | undefined,
): string {
  if (satStatus === 'Cancelado') {
    return 'cancelled';
  }
  if (isSatCancellationInProcess(estatusCancelacion)) {
    return 'cancel_pending';
  }
  return currentStampStatus;
}
