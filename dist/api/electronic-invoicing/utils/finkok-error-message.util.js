"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finkokErrorMessage = finkokErrorMessage;
const BY_CODE = {
    '702': 'Finkok no reconoció el usuario o la contraseña de este ambiente. Revísalos en Configuración, integración Finkok.',
};
const ENGLISH = /\b(sorry|error|when|validating|reseller|user|please|failed|invalid|unable|password|username)\b/i;
function finkokErrorMessage(code, raw) {
    const codigo = String(code || '').trim();
    const text = String(raw || '').trim();
    const known = codigo ? BY_CODE[codigo] : undefined;
    if (known) {
        return `${codigo}: ${known}`;
    }
    if (!text || ENGLISH.test(text)) {
        return codigo
            ? `${codigo}: Finkok rechazó la operación. Revisa el ambiente y las credenciales.`
            : 'Finkok rechazó la operación. Revisa el ambiente y las credenciales.';
    }
    return codigo ? `${codigo}: ${text}` : text;
}
//# sourceMappingURL=finkok-error-message.util.js.map