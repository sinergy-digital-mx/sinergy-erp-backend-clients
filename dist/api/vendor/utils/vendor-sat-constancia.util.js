"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVendorSatConstancia = toVendorSatConstancia;
exports.assertSatConstanciaPdf = assertSatConstanciaPdf;
const sat_csf_util_1 = require("../../customers/utils/sat-csf.util");
function toVendorSatConstancia(data) {
    return {
        rfc: data.fiscal_rfc,
        persona_type: data.fiscal_person_type === 'fisica' ? 'Persona Física' : 'Persona Moral',
        razon_social: data.fiscal_razon_social,
        street: data.fiscal_street ?? null,
        exterior_number: data.fiscal_exterior_number ?? null,
        interior_number: data.fiscal_interior_number ?? null,
        colonia: data.fiscal_colonia ?? null,
        localidad: data.fiscal_localidad ?? null,
        city: data.fiscal_municipio ?? null,
        state: data.fiscal_state ?? null,
        zip_code: data.fiscal_postal_code,
        country: 'México',
    };
}
function assertSatConstanciaPdf(file) {
    if (!file?.buffer?.length) {
        throw new sat_csf_util_1.SatCsfParseError('Sube el PDF de la constancia del SAT.');
    }
    if ((file.size ?? file.buffer.length) > 10 * 1024 * 1024) {
        throw new sat_csf_util_1.SatCsfParseError('El PDF no puede superar 10 MB.');
    }
    const name = (file.originalname ?? '').toLowerCase();
    const mime = (file.mimetype ?? '').toLowerCase();
    const header = file.buffer.subarray(0, 5).toString('utf8');
    if (header !== '%PDF-' || (mime !== 'application/pdf' && !name.endsWith('.pdf'))) {
        throw new sat_csf_util_1.SatCsfParseError('Sube el PDF de la constancia del SAT.');
    }
}
//# sourceMappingURL=vendor-sat-constancia.util.js.map