"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEDIMENTO_SEQUENCE_ERROR = exports.PEDIMENTO_YEAR_DIGIT_ERROR = exports.PEDIMENTO_FORMAT_ERROR = exports.PEDIMENTO_FORMATTED_EXAMPLE = exports.PEDIMENTO_DIGIT_COUNT = void 0;
exports.pedimentoDigits = pedimentoDigits;
exports.formatPedimentoMask = formatPedimentoMask;
exports.formatPedimentoForDisplay = formatPedimentoForDisplay;
exports.parsePedimentoNumber = parsePedimentoNumber;
exports.normalizePedimentoNumber = normalizePedimentoNumber;
const common_1 = require("@nestjs/common");
exports.PEDIMENTO_DIGIT_COUNT = 15;
exports.PEDIMENTO_FORMATTED_EXAMPLE = '26  47  3807  6000123';
const PEDIMENTO_EXAMPLE_LABEL = '26\u00a0\u00a047\u00a0\u00a03807\u00a0\u00a06000123';
exports.PEDIMENTO_FORMAT_ERROR = `El pedimento debe tener 15 dígitos con el formato del SAT: año (2), aduana (2), patente (4) y numeración (7). Ejemplo: ${PEDIMENTO_EXAMPLE_LABEL}.`;
exports.PEDIMENTO_YEAR_DIGIT_ERROR = 'El dígito de año del pedimento debe ser el último dígito del año de validación, o el del año anterior si es un consolidado.';
exports.PEDIMENTO_SEQUENCE_ERROR = 'La numeración progresiva del pedimento debe iniciar en 000001.';
function pedimentoDigits(value) {
    return value.replace(/\D/g, '');
}
function formatPedimentoMask(value) {
    const digits = pedimentoDigits(value).slice(0, exports.PEDIMENTO_DIGIT_COUNT);
    const groups = [];
    if (digits.length > 0) {
        groups.push(digits.slice(0, Math.min(2, digits.length)));
    }
    if (digits.length > 2) {
        groups.push(digits.slice(2, Math.min(4, digits.length)));
    }
    if (digits.length > 4) {
        groups.push(digits.slice(4, Math.min(8, digits.length)));
    }
    if (digits.length > 8) {
        groups.push(digits.slice(8));
    }
    return groups.join('  ');
}
function formatPedimentoForDisplay(value) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return null;
    }
    if (/[^\d\s-]/.test(trimmed)) {
        return trimmed;
    }
    const digits = pedimentoDigits(trimmed);
    if (digits.length !== exports.PEDIMENTO_DIGIT_COUNT) {
        return trimmed;
    }
    return formatPedimentoMask(digits);
}
function parsePedimentoNumber(value) {
    if (value === null || value === undefined) {
        return { valid: true, empty: true, formatted: null, message: null };
    }
    const raw = String(value).trim();
    if (!raw) {
        return { valid: true, empty: true, formatted: null, message: null };
    }
    if (/[^\d\s-]/.test(raw)) {
        return { valid: false, empty: false, formatted: null, message: exports.PEDIMENTO_FORMAT_ERROR };
    }
    const digits = pedimentoDigits(raw);
    if (digits.length !== exports.PEDIMENTO_DIGIT_COUNT) {
        return { valid: false, empty: false, formatted: null, message: exports.PEDIMENTO_FORMAT_ERROR };
    }
    const year = Number(digits.slice(0, 2));
    const marker = digits[8];
    const yearLast = String(year % 10);
    const previousLast = String((year + 9) % 10);
    if (marker !== yearLast && marker !== previousLast) {
        return {
            valid: false,
            empty: false,
            formatted: null,
            message: exports.PEDIMENTO_YEAR_DIGIT_ERROR,
        };
    }
    if (digits.slice(9) === '000000') {
        return {
            valid: false,
            empty: false,
            formatted: null,
            message: exports.PEDIMENTO_SEQUENCE_ERROR,
        };
    }
    return {
        valid: true,
        empty: false,
        formatted: formatPedimentoMask(digits),
        message: null,
    };
}
function normalizePedimentoNumber(value) {
    const parsed = parsePedimentoNumber(value);
    if (!parsed.valid) {
        throw new common_1.BadRequestException(parsed.message ?? exports.PEDIMENTO_FORMAT_ERROR);
    }
    return parsed.formatted;
}
//# sourceMappingURL=pedimento-number.util.js.map