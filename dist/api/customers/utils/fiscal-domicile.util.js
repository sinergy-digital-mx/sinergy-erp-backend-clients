"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeFiscalAddress = composeFiscalAddress;
exports.hasSatStreetParts = hasSatStreetParts;
function composeFiscalAddress(parts) {
    const chunks = [];
    const street = parts.street?.trim();
    if (street) {
        chunks.push(street);
    }
    const exterior = parts.exteriorNumber?.trim();
    if (exterior) {
        chunks.push(exterior);
    }
    const interior = parts.interiorNumber?.trim();
    if (interior) {
        chunks.push(`Int. ${interior}`);
    }
    const colonia = parts.colonia?.trim();
    if (colonia) {
        chunks.push(`Col. ${colonia}`);
    }
    if (chunks.length === 0) {
        return null;
    }
    return chunks.join(' ').slice(0, 255);
}
function hasSatStreetParts(dto) {
    return (dto.fiscal_street !== undefined ||
        dto.fiscal_exterior_number !== undefined ||
        dto.fiscal_interior_number !== undefined ||
        dto.fiscal_colonia !== undefined);
}
//# sourceMappingURL=fiscal-domicile.util.js.map