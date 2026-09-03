"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseOrderPdfLabels = getPurchaseOrderPdfLabels;
exports.translateGeneralStatus = translateGeneralStatus;
exports.translatePaymentStatus = translatePaymentStatus;
const purchase_order_document_language_enum_1 = require("../../../entities/purchase-orders/purchase-order-document-language.enum");
const purchase_order_pdf_labels_es_1 = require("./purchase-order-pdf-labels.es");
const purchase_order_pdf_labels_en_1 = require("./purchase-order-pdf-labels.en");
const LABELS_BY_LANGUAGE = {
    [purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES]: purchase_order_pdf_labels_es_1.PURCHASE_ORDER_PDF_LABELS_ES,
    [purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.EN]: purchase_order_pdf_labels_en_1.PURCHASE_ORDER_PDF_LABELS_EN,
};
function getPurchaseOrderPdfLabels(language = purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES) {
    return LABELS_BY_LANGUAGE[language] ?? purchase_order_pdf_labels_es_1.PURCHASE_ORDER_PDF_LABELS_ES;
}
function translateGeneralStatus(status, labels) {
    switch (status) {
        case 'Creada':
            return labels.statusCreated;
        case 'Recibida':
            return labels.statusReceived;
        case 'Cancelada':
            return labels.statusCancelled;
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
//# sourceMappingURL=purchase-order-pdf-labels.js.map