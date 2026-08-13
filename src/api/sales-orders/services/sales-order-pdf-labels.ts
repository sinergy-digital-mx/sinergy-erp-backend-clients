import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { SALES_ORDER_PDF_LABELS_ES } from './sales-order-pdf-labels.es';
import { SALES_ORDER_PDF_LABELS_EN } from './sales-order-pdf-labels.en';

export interface SalesOrderPdfLabels {
  originalDocumentTitle: string;
  salesOrderTitle: string;
  folioPrefix: string;
  summary: string;
  creationDate: string;
  createdBy: string;
  expectedDate: string;
  status: string;
  payment: string;
  customer: string;
  emailPrefix: string;
  phonePrefix: string;
  sourceWarehouse: string;
  productsDetail: string;
  product: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
  unitPrefix: string;
  notesPrefix: string;
  notesEmpty: string;
  pageLabel: string;
  subtotal: string;
  discountTotal: string;
  lineDiscountTotal: string;
  globalDiscountTotal: string;
  vat: string;
  ieps: string;
  totalLabel: string;
  statusCreated: string;
  statusInSelection?: string;
  statusReadyForDelivery?: string;
  statusFulfilled: string;
  statusCancelled: string;
  paymentPending: string;
  paymentPaid: string;
  dateLocale: string;
}

const LABELS_BY_LANGUAGE: Record<DocumentLanguage, SalesOrderPdfLabels> = {
  [DocumentLanguage.ES]: SALES_ORDER_PDF_LABELS_ES,
  [DocumentLanguage.EN]: SALES_ORDER_PDF_LABELS_EN,
};

export function getSalesOrderPdfLabels(
  language: DocumentLanguage = DocumentLanguage.ES,
): SalesOrderPdfLabels {
  return LABELS_BY_LANGUAGE[language] ?? SALES_ORDER_PDF_LABELS_ES;
}

export function translateGeneralStatus(
  status: string | null | undefined,
  labels: SalesOrderPdfLabels,
): string {
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
    default:
      return status || 'N/A';
  }
}

export function translatePaymentStatus(
  status: string | null | undefined,
  labels: SalesOrderPdfLabels,
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
