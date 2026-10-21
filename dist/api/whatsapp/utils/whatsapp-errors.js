"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHATSAPP_NOT_CONNECTED_MESSAGE = void 0;
exports.friendlyWahaMessage = friendlyWahaMessage;
exports.toHttpException = toHttpException;
const common_1 = require("@nestjs/common");
const waha_client_service_1 = require("../services/waha-client.service");
exports.WHATSAPP_NOT_CONNECTED_MESSAGE = 'WhatsApp no está conectado. Escanea el código QR en Configuración.';
function friendlyWahaMessage(error) {
    if (!(error instanceof waha_client_service_1.WahaError))
        return 'No se pudo comunicar con WhatsApp.';
    if (error.status === 401 || error.status === 403) {
        return 'El servicio de WhatsApp rechazó la conexión. Contacta a soporte.';
    }
    if (error.status === 503)
        return error.message;
    if (error.isSessionUnavailable)
        return exports.WHATSAPP_NOT_CONNECTED_MESSAGE;
    return 'No se pudo comunicar con WhatsApp.';
}
function toHttpException(error) {
    if (error instanceof common_1.HttpException)
        return error;
    const message = friendlyWahaMessage(error);
    if (error instanceof waha_client_service_1.WahaError) {
        if (error.status === 503)
            return new common_1.ServiceUnavailableException(message);
        if (error.isSessionUnavailable)
            return new common_1.BadRequestException(message);
    }
    return new common_1.BadGatewayException(message);
}
//# sourceMappingURL=whatsapp-errors.js.map