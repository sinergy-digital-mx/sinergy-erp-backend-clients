export const SALES_COST_TYPE = {
  RECEIPT: 1,
  CASH_RETURN: 2,
  CANCEL_RECEIPT: 3,
  CREDIT_RECEIPT: 5,
  INVOICE: 6,
  CREDIT_NOTE: 7,
  CANCEL_INVOICE: 8,
  CANCEL_CREDIT_NOTE: 9,
  LAYAWAY: 18,
  ADVANCE: 19,
} as const;

export const SALES_COST_STATUS = {
  CASH: 1,
  CREDIT: 2,
  CANCELLED: 3,
  PAID: 4,
  RETURN: 5,
} as const;

export const SALES_COST_TYPE_LABELS: Record<number, string> = {
  1: 'Recibo',
  2: 'Dev. efectivo',
  3: 'Cancelación de recibo',
  5: 'Recibo a crédito',
  6: 'Factura',
  7: 'Nota de crédito',
  8: 'Cancelación de factura',
  9: 'Cancelación de nota',
  18: 'Apartado',
  19: 'Abono o anticipo',
};

export const SALES_COST_STATUS_LABELS: Record<number, string> = {
  1: 'Contado',
  2: 'Crédito',
  3: 'Cancelado',
  4: 'Pagado',
  5: 'Devolución',
};

const WALK_IN_FISCAL = 'VENTA DE MOSTRADOR';

export type SalesCostOrderInput = {
  id: string;
  folio: string;
  created_on: string;
  cancelled_on: string | null;
  cancelled: boolean;
  payment_status: string;
  is_credit: boolean;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  exchange_rate: number | null;
  invoiced: boolean;
  sale_cost: number;
  reversal_cost: number;
};

export type SalesCostSideDocumentInput = {
  id: string;
  document: string;
  customer_name: string;
  stamped_on: string;
  cancelled_on: string | null;
  cancelled: boolean;
  kind: 'advance' | 'credit_note';
  subtotal: number;
  total: number;
  currency: string;
  exchange_rate: number | null;
  sales_order_id: string | null;
  quotation_id: string | null;
};

export type SalesCostReportRow = {
  id: string;
  sales_order_id: string | null;
  quotation_id: string | null;
  customer_name: string;
  document: string;
  date: string;
  type_code: number;
  type_label: string;
  status_code: number;
  status_label: string;
  amount: number;
  discount: number;
  tax: number;
  sale_total: number;
  cost_total: number;
  margin_amount: number;
  margin_percent: number | null;
  source_currency: string;
  exchange_rate: number | null;
  currency: string;
  reversal: boolean;
};

export type SalesCostReportSummary = {
  document_count: number;
  amount: number;
  discount: number;
  tax: number;
  sale_total: number;
  cost_total: number;
  profit: number;
  margin_percent: number | null;
  has_foreign_currency: boolean;
};

type MoneyConverter = ((value: number) => number) & {
  currency: string;
  sourceCurrency: string;
  exchangeRate: number | null;
};

type SalesCostNumericKey = 'amount' | 'discount' | 'tax' | 'sale_total' | 'cost_total';

export function roundSalesCost(value: number, scale = 2): number {
  const factor = 10 ** scale;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatSalesCustomerName(input: {
  walk_in_name?: string | null;
  order_fiscal?: string | null;
  customer_fiscal?: string | null;
  company_name?: string | null;
  name?: string | null;
  lastname?: string | null;
  receptor_nombre?: string | null;
}): string {
  const walkIn = input.walk_in_name?.trim();
  if (walkIn) {
    return walkIn.toUpperCase();
  }

  const fiscal = input.order_fiscal?.trim() || input.customer_fiscal?.trim() || '';
  const company = input.company_name?.trim() || '';
  const person = [input.name, input.lastname]
    .map((part) => part?.trim())
    .filter((part) => !!part)
    .join(' ');
  const receptor = input.receptor_nombre?.trim() || '';
  const generic =
    normalizeName(fiscal) === normalizeName(WALK_IN_FISCAL) ||
    normalizeName(person) === 'PUBLICO EN GENERAL' ||
    normalizeName(company) === 'PUBLICO EN GENERAL';

  if (generic) {
    return 'PÚBLICO EN GENERAL';
  }

  return (fiscal || company || person || receptor || 'PÚBLICO EN GENERAL').toUpperCase();
}

export function buildSalesCostRows(input: {
  orders: SalesCostOrderInput[];
  sideDocuments: SalesCostSideDocumentInput[];
  dateFrom: string;
  dateTo: string;
}): SalesCostReportRow[] {
  const rows: SalesCostReportRow[] = [];

  for (const order of input.orders) {
    if (inRange(order.created_on, input.dateFrom, input.dateTo)) {
      rows.push(orderRow(order, false));
    }
    if (
      order.cancelled &&
      order.cancelled_on &&
      inRange(order.cancelled_on, input.dateFrom, input.dateTo)
    ) {
      rows.push(orderRow(order, true));
    }
  }

  for (const document of input.sideDocuments) {
    if (inRange(document.stamped_on, input.dateFrom, input.dateTo)) {
      rows.push(sideRow(document, false));
    }
    if (
      document.cancelled &&
      document.cancelled_on &&
      inRange(document.cancelled_on, input.dateFrom, input.dateTo)
    ) {
      rows.push(sideRow(document, true));
    }
  }

  rows.sort((left, right) => {
    if (left.date !== right.date) {
      return left.date < right.date ? -1 : 1;
    }
    const documentOrder = left.document.localeCompare(right.document, 'es', {
      numeric: true,
      sensitivity: 'base',
    });
    if (documentOrder !== 0) {
      return documentOrder;
    }
    if (left.reversal !== right.reversal) {
      return left.reversal ? 1 : -1;
    }
    return left.type_code - right.type_code;
  });

  return rows;
}

export function filterSalesCostRows(
  rows: SalesCostReportRow[],
  search?: string,
): SalesCostReportRow[] {
  const query = search?.trim().toLowerCase();
  if (!query) {
    return rows;
  }
  return rows.filter((row) => {
    const haystack = [
      row.customer_name,
      row.document,
      row.type_label,
      String(row.type_code),
      row.status_label,
      String(row.status_code),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function summarizeSalesCostRows(rows: SalesCostReportRow[]): SalesCostReportSummary {
  const amount = sum(rows, 'amount');
  const discount = sum(rows, 'discount');
  const tax = sum(rows, 'tax');
  const saleTotal = sum(rows, 'sale_total');
  const costTotal = sum(rows, 'cost_total');
  const profit = roundSalesCost(saleTotal - tax - costTotal);
  const price = roundSalesCost(saleTotal - tax);

  return {
    document_count: rows.length,
    amount,
    discount,
    tax,
    sale_total: saleTotal,
    cost_total: costTotal,
    profit,
    margin_percent: price === 0 ? null : roundSalesCost((profit / price) * 100),
    has_foreign_currency: rows.some((row) => row.currency !== 'MXN'),
  };
}

export function salesLineMargin(input: {
  sale_total: number;
  tax: number;
  cost_total: number;
}): { margin_amount: number; margin_percent: number | null } {
  const price = roundSalesCost(input.sale_total - input.tax);
  const marginAmount = roundSalesCost(price - input.cost_total);
  return {
    margin_amount: marginAmount,
    margin_percent: price === 0 ? null : roundSalesCost((marginAmount / price) * 100),
  };
}

function orderRow(order: SalesCostOrderInput, reversal: boolean): SalesCostReportRow {
  const money = convertMoney(order.currency, order.exchange_rate);
  const amount = money(order.subtotal);
  const discount = money(order.discount);
  const tax = money(order.tax);
  const saleTotal = money(order.total);
  const cost = roundSalesCost(
    reversal
      ? -(order.reversal_cost > 0 ? order.reversal_cost : order.sale_cost)
      : order.sale_cost,
  );
  const typeCode = reversal
    ? order.invoiced
      ? SALES_COST_TYPE.CANCEL_INVOICE
      : SALES_COST_TYPE.CANCEL_RECEIPT
    : order.invoiced
      ? SALES_COST_TYPE.INVOICE
      : order.is_credit
        ? SALES_COST_TYPE.CREDIT_RECEIPT
        : SALES_COST_TYPE.RECEIPT;
  const statusCode = reversal ? SALES_COST_STATUS.CANCELLED : saleStatus(order);
  const signedTax = reversal ? -tax : tax;
  const signedSale = reversal ? -saleTotal : saleTotal;

  return {
    id: reversal ? `${order.id}:cancel` : order.id,
    sales_order_id: order.id,
    quotation_id: null,
    customer_name: order.customer_name,
    document: order.folio,
    date: reversal ? order.cancelled_on || order.created_on : order.created_on,
    type_code: typeCode,
    type_label: SALES_COST_TYPE_LABELS[typeCode],
    status_code: statusCode,
    status_label: SALES_COST_STATUS_LABELS[statusCode],
    amount,
    discount,
    tax: signedTax,
    sale_total: signedSale,
    cost_total: cost,
    ...salesLineMargin({ sale_total: signedSale, tax: signedTax, cost_total: cost }),
    source_currency: money.sourceCurrency,
    exchange_rate: money.exchangeRate,
    currency: money.currency,
    reversal,
  };
}

function sideRow(document: SalesCostSideDocumentInput, reversal: boolean): SalesCostReportRow {
  const money = convertMoney(document.currency, document.exchange_rate);
  const amount = money(document.subtotal);
  const saleTotal = money(document.total);
  const tax = roundSalesCost(saleTotal - amount);
  const creditNote = document.kind === 'credit_note';
  const sign = creditNote ? (reversal ? 1 : -1) : reversal ? -1 : 1;
  const signedAmount = roundSalesCost(sign * amount);
  const signedTax = roundSalesCost(sign * tax);
  const signedSale = roundSalesCost(sign * saleTotal);
  const typeCode = creditNote
    ? reversal
      ? SALES_COST_TYPE.CANCEL_CREDIT_NOTE
      : SALES_COST_TYPE.CREDIT_NOTE
    : SALES_COST_TYPE.ADVANCE;
  const statusCode = reversal
    ? SALES_COST_STATUS.CANCELLED
    : creditNote
      ? SALES_COST_STATUS.RETURN
      : SALES_COST_STATUS.CASH;

  return {
    id: reversal ? `${document.id}:cancel` : document.id,
    sales_order_id: document.sales_order_id,
    quotation_id: document.quotation_id,
    customer_name: document.customer_name,
    document: document.document,
    date: reversal ? document.cancelled_on || document.stamped_on : document.stamped_on,
    type_code: typeCode,
    type_label: SALES_COST_TYPE_LABELS[typeCode],
    status_code: statusCode,
    status_label: SALES_COST_STATUS_LABELS[statusCode],
    amount: signedAmount,
    discount: 0,
    tax: signedTax,
    sale_total: signedSale,
    cost_total: 0,
    ...salesLineMargin({ sale_total: signedSale, tax: signedTax, cost_total: 0 }),
    source_currency: money.sourceCurrency,
    exchange_rate: money.exchangeRate,
    currency: money.currency,
    reversal,
  };
}

function saleStatus(order: SalesCostOrderInput): number {
  if (order.is_credit && order.payment_status !== 'Pagado') {
    return SALES_COST_STATUS.CREDIT;
  }
  if (order.is_credit) {
    return SALES_COST_STATUS.PAID;
  }
  return SALES_COST_STATUS.CASH;
}

function convertMoney(currency: string, exchangeRate: number | null): MoneyConverter {
  const code = (currency || 'MXN').trim().toUpperCase() || 'MXN';
  const sourceCurrency = code === 'USD' ? 'USD' : 'MXN';
  const rate =
    sourceCurrency === 'USD' && exchangeRate != null && exchangeRate > 0 ? exchangeRate : null;
  const converted = sourceCurrency !== 'USD' || rate != null;
  const convert = ((value: number) => {
    const amount = Number.isFinite(value) ? value : 0;
    if (sourceCurrency === 'USD' && rate != null) {
      return roundSalesCost(amount * rate);
    }
    return roundSalesCost(amount);
  }) as MoneyConverter;
  convert.currency = converted ? 'MXN' : 'USD';
  convert.sourceCurrency = sourceCurrency;
  convert.exchangeRate = rate;
  return convert;
}

export function rateOnOrBefore(
  day: string,
  points: Array<{ rate_date: string; exchange_rate: number }>,
): number | null {
  const target = day.slice(0, 10);
  let found: number | null = null;
  const ordered = [...points].sort((left, right) => left.rate_date.localeCompare(right.rate_date));
  for (const point of ordered) {
    if (point.rate_date.slice(0, 10) <= target && point.exchange_rate > 0) {
      found = point.exchange_rate;
    }
  }
  return found;
}

export function salesCurrencyLabel(sourceCurrency: string, exchangeRate: number | null): string {
  if (sourceCurrency === 'USD' && exchangeRate != null && exchangeRate > 0) {
    return `USD ${formatExchangeRate(exchangeRate)}`;
  }
  return sourceCurrency === 'USD' ? 'USD' : 'MXN';
}

function formatExchangeRate(rate: number): string {
  const [whole, fraction = ''] = rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '').split('.');
  return `${whole}.${(fraction || '').padEnd(2, '0').slice(0, 4)}`;
}

function inRange(day: string | null, from: string, to: string): boolean {
  return !!day && day >= from && day <= to;
}

function sum(rows: SalesCostReportRow[], key: SalesCostNumericKey): number {
  return roundSalesCost(rows.reduce((total, row) => total + row[key], 0));
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
