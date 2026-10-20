"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSatCancellationInProcess = isSatCancellationInProcess;
exports.resolveStampStatusAfterCancelRequest = resolveStampStatusAfterCancelRequest;
exports.resolveStampStatusAfterSatConsult = resolveStampStatusAfterSatConsult;
function isSatCancellationInProcess(estatus) {
    return /proceso/i.test(String(estatus ?? ''));
}
function resolveStampStatusAfterCancelRequest(estatusUuid, estatusCancelacion) {
    if (isSatCancellationInProcess(estatusCancelacion)) {
        return 'cancel_pending';
    }
    const code = String(estatusUuid ?? '').trim();
    if (code === '201' || code.startsWith('201')) {
        return 'cancel_pending';
    }
    return 'cancelled';
}
function resolveStampStatusAfterSatConsult(currentStampStatus, satStatus, estatusCancelacion) {
    if (satStatus === 'Cancelado') {
        return 'cancelled';
    }
    if (isSatCancellationInProcess(estatusCancelacion)) {
        return 'cancel_pending';
    }
    return currentStampStatus;
}
//# sourceMappingURL=cfdi-cancel-status.util.js.map