"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDocumentPrefix = normalizeDocumentPrefix;
exports.requireDocumentPrefix = requireDocumentPrefix;
const common_1 = require("@nestjs/common");
const PREFIX_PATTERN = /^[A-Z0-9]{1,10}$/;
function normalizeDocumentPrefix(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const normalized = String(value).trim().toUpperCase();
    if (!normalized) {
        return null;
    }
    if (!PREFIX_PATTERN.test(normalized)) {
        throw new common_1.BadRequestException('El prefijo solo admite letras y números (máx. 10), sin guiones. Ejemplo: MZN');
    }
    return normalized;
}
function requireDocumentPrefix(value, message) {
    const normalized = normalizeDocumentPrefix(value);
    if (!normalized) {
        throw new common_1.BadRequestException(message);
    }
    return normalized;
}
//# sourceMappingURL=document-prefix.util.js.map