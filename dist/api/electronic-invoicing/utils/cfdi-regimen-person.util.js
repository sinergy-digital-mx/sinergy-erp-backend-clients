"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferReceptorRegimen = inferReceptorRegimen;
exports.receptorRegimenMismatch = receptorRegimenMismatch;
const MORAL_ONLY = new Set(['601', '603', '620', '623', '624']);
const FISICA_ONLY = new Set(['605', '606', '607', '608', '611', '612', '614', '615', '616', '621', '625']);
const GENERIC_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
function inferReceptorRegimen(rfc, personType) {
    const cleanRfc = String(rfc ?? '').replace(/[\s-]/g, '').toUpperCase();
    if (GENERIC_RFCS.has(cleanRfc)) {
        return '616';
    }
    if (cleanRfc.length === 12) {
        return '601';
    }
    if (cleanRfc.length === 13) {
        return '612';
    }
    return String(personType ?? '').trim().toLowerCase() === 'fisica' ? '612' : '601';
}
function receptorRegimenMismatch(rfc, regimen) {
    const cleanRfc = String(rfc ?? '').replace(/[\s-]/g, '').toUpperCase();
    const code = String(regimen ?? '').trim();
    if (!cleanRfc || !code) {
        return null;
    }
    if (GENERIC_RFCS.has(cleanRfc) && code !== '616') {
        return 'Público en general debe timbrarse con régimen 616.';
    }
    const moral = cleanRfc.length === 12;
    const fisica = cleanRfc.length === 13;
    if (moral && FISICA_ONLY.has(code)) {
        return `El RFC del cliente es de persona moral. El régimen ${code} solo aplica a personas físicas.`;
    }
    if (fisica && MORAL_ONLY.has(code)) {
        return `El RFC del cliente es de persona física. El régimen ${code} solo aplica a personas morales.`;
    }
    return null;
}
//# sourceMappingURL=cfdi-regimen-person.util.js.map