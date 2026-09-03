"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesOrderPdfLabels = getSalesOrderPdfLabels;
exports.translateGeneralStatus = translateGeneralStatus;
exports.translatePaymentStatus = translatePaymentStatus;
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const sales_order_pdf_labels_es_1 = require("./sales-order-pdf-labels.es");
const sales_order_pdf_labels_en_1 = require("./sales-order-pdf-labels.en");
const LABELS_BY_LANGUAGE = {
    [document_language_enum_1.DocumentLanguage.ES]: sales_order_pdf_labels_es_1.SALES_ORDER_PDF_LABELS_ES,
    [document_language_enum_1.DocumentLanguage.EN]: sales_order_pdf_labels_en_1.SALES_ORDER_PDF_LABELS_EN,
};
function getSalesOrderPdfLabels(language = document_language_enum_1.DocumentLanguage.ES) {
    return LABELS_BY_LANGUAGE[language] ?? sales_order_pdf_labels_es_1.SALES_ORDER_PDF_LABELS_ES;
}
function translateGeneralStatus(status, labels) {
    switch (status) {
        case 'Creada':
            return labels.statusCreated;
        case 'En Selección':
            return labels.statusInSelection ?? status;
        case 'Lista para entrega':
            return labels.statusReadyForDelivery ?? status;
        case 'Surtida':
            return labels.statusFulfilled;
        case 'Cancelada':
            return labels.statusCancelled;
        case 'Convertida':
            return labels.statusConverted ?? status;
        default:
            return status || 'N/A';
    }
}
function translatePaymentStatus(status, labels) {
    switch (status) {
        case 'Pendiente':
            return labels.paymentPending;
        case 'Pagado':
            return labels.paymentPaid;
        default:
            return status || 'N/A';
    }
}
//# sourceMappingURL=sales-order-pdf-labels.js.map