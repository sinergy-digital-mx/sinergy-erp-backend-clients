"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFinkokAuthenticationFailed = isFinkokAuthenticationFailed;
exports.translateFinkokRegistrationError = translateFinkokRegistrationError;
function environmentLabel(environment) {
    if (environment === 'production') {
        return 'producción';
    }
    if (environment === 'demo') {
        return 'demo';
    }
    return environment ?? 'configurado';
}
function isFinkokAuthenticationFailed(message) {
    return (message ?? '').toLowerCase().includes('authentication failed');
}
function translateFinkokRegistrationError(message, environment) {
    const raw = (message ?? '').trim();
    if (!raw) {
        return 'Finkok rechazó el alta del emisor';
    }
    const env = environmentLabel(environment);
    if (isFinkokAuthenticationFailed(raw)) {
        return (`Finkok rechazó el alta en ${env}: el usuario de Integración Finkok autentica el timbrado, pero no el registro de RFCs. ` +
            `En Integración Finkok (${env}) use el usuario administrador del portal (correo de la cuenta Integración), no el token SOAP (maderia-mzn / mzn-prod). ` +
            `Quitar el RFC del token no habilita esta API.`);
    }
    return raw;
}
//# sourceMappingURL=finkok-registration-error.js.map