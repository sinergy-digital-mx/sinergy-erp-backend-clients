"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSalesCreditNoteCfdi = buildSalesCreditNoteCfdi;
const advance_cfdi_util_1 = require("../../electronic-invoicing/utils/advance-cfdi.util");
const credit_note_util_1 = require("./credit-note.util");
function buildSalesCreditNoteCfdi(input) {
    const totalAmount = (0, credit_note_util_1.roundCreditMoney)(input.totalAmount);
    if (totalAmount <= 0) {
        throw new Error('El importe de la nota de crédito debe ser mayor a cero');
    }
    const currency = (input.currency || 'MXN').trim().toUpperCase() || 'MXN';
    const exchangeRate = Number(input.exchangeRate || 0);
    if (currency !== 'MXN' && !(exchangeRate > 0)) {
        throw new Error('La nota en dólares necesita el tipo de cambio de la orden');
    }
    const base = (0, credit_note_util_1.baseFromInclusiveTotal)(totalAmount, input.ivaPercentage);
    const built = (0, advance_cfdi_util_1.buildAdvanceConceptCfdi)({
        series: input.series,
        folio: input.folio,
        baseAmount: base,
        ivaPercentage: input.ivaPercentage,
        usoCfdi: input.usoCfdi || 'G02',
        formaPago: input.formaPago || '15',
        metodoPago: 'PUE',
        emisor: input.emisor,
        receptor: input.receptor,
        tipoComprobante: 'E',
        descripcion: input.descripcion,
        relatedUuid: input.relatedUuid,
        relationType: credit_note_util_1.CREDIT_NOTE_RELATION_TYPE,
        currency,
        exchangeRate: currency === 'MXN' ? null : exchangeRate,
        satClave: input.satClave || advance_cfdi_util_1.ADVANCE_SAT_CLAVE,
        unitCode: input.unitCode || advance_cfdi_util_1.ADVANCE_UNIT_CODE,
        unitName: input.unitName || advance_cfdi_util_1.ADVANCE_UNIT_NAME,
        identification: 'nota_credito',
    });
    if (Math.abs(built.total - totalAmount) > 0.009) {
        throw new Error('El importe de la nota no cuadra con el IVA de la factura');
    }
    return built;
}
//# sourceMappingURL=credit-note-cfdi.util.js.map