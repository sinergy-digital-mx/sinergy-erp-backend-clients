import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import { PURCHASE_ORDER_PDF_LABELS_ES } from './purchase-order-pdf-labels.es';
import { PURCHASE_ORDER_PDF_LABELS_EN } from './purchase-order-pdf-labels.en';

export interface PurchaseOrderPdfLabels {
  originalDocumentTitle: string;
  purchaseOrderTitle: string;
  folioPrefix: string;
  receptionDocumentTitle: string;
  summary: string;
  creationDate: string;
  createdBy: string;
  expectedDate: string;
  status: string;
  payment: string;
  receptionDate: string;
  vendor: string;
  rfcPrefix: string;
  addressPrefix: string;
  destinationWarehouse: string;
  requestedProductsDetail: string;
  receivedProductsDetail: string;
  product: string;
  requestedQty: string;
  receivedBatches: string;
  receivedQty: string;
  unitPrice: string;
  total: string;
  unitPrefix: string;
  modePrefix: string;
  noTag: string;
  noBatchesRegistered: string;
  notesPrefix: string;
  subtotal: string;
  vat: string;
  ieps: string;
  totalLabel: string;
  statusCreated: string;
  statusReceived: string;
  statusCancelled: string;
  paymentPending: string;
  paymentPaid: string;
  dateLocale: string;
}

const LABELS_BY_LANGUAGE: Record<PurchaseOrderDocumentLanguage, PurchaseOrderPdfLabels> = {
  [PurchaseOrderDocumentLanguage.ES]: PURCHASE_ORDER_PDF_LABELS_ES,
  [PurchaseOrderDocumentLanguage.EN]: PURCHASE_ORDER_PDF_LABELS_EN,
};

export function getPurchaseOrderPdfLabels(
  language: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
): PurchaseOrderPdfLabels {
  return LABELS_BY_LANGUAGE[language] ?? PURCHASE_ORDER_PDF_LABELS_ES;
}

export function translateGeneralStatus(
  status: string | null | undefined,
  labels: PurchaseOrderPdfLabels,
): string {
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

export function translatePaymentStatus(
  status: string | null | undefined,
  labels: PurchaseOrderPdfLabels,
): string {
  switch (status) {
    case 'Pendiente':
      return labels.paymentPending;
    case 'Pagado':
      return labels.paymentPaid;
    default:
      return status || 'N/A';
  }
}
