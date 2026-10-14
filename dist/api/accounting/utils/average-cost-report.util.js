"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_COST_STATUS_LABELS = exports.SALES_COST_TYPE_LABELS = exports.SALES_COST_STATUS = exports.SALES_COST_TYPE = void 0;
exports.roundSalesCost = roundSalesCost;
exports.formatSalesCustomerName = formatSalesCustomerName;
exports.buildSalesCostRows = buildSalesCostRows;
exports.filterSalesCostRows = filterSalesCostRows;
exports.summarizeSalesCostRows = summarizeSalesCostRows;
exports.salesLineMargin = salesLineMargin;
exports.SALES_COST_TYPE = {
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
};
exports.SALES_COST_STATUS = {
    CASH: 1,
    CREDIT: 2,
    CANCELLED: 3,
    PAID: 4,
    RETURN: 5,
};
exports.SALES_COST_TYPE_LABELS = {
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
exports.SALES_COST_STATUS_LABELS = {
    1: 'Contado',
    2: 'Crédito',
    3: 'Cancelado',
    4: 'Pagado',
    5: 'Devolución',
};
const WALK_IN_FISCAL = 'VENTA DE MOSTRADOR';
function roundSalesCost(value, scale = 2) {
    const factor = 10 ** scale;
    return Math.round((value + Number.EPSILON) * factor) / factor;
}
function formatSalesCustomerName(input) {
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
    const generic = normalizeName(fiscal) === normalizeName(WALK_IN_FISCAL) ||
        normalizeName(person) === 'PUBLICO EN GENERAL' ||
        normalizeName(company) === 'PUBLICO EN GENERAL';
    if (generic) {
        return 'PÚBLICO EN GENERAL';
    }
    return (fiscal || company || person || receptor || 'PÚBLICO EN GENERAL').toUpperCase();
}
function buildSalesCostRows(input) {
    const rows = [];
    for (const order of input.orders) {
        if (inRange(order.created_on, input.dateFrom, input.dateTo)) {
            rows.push(orderRow(order, false));
        }
        if (order.cancelled &&
            order.cancelled_on &&
            inRange(order.cancelled_on, input.dateFrom, input.dateTo)) {
            rows.push(orderRow(order, true));
        }
    }
    for (const document of input.sideDocuments) {
        if (inRange(document.stamped_on, input.dateFrom, input.dateTo)) {
            rows.push(sideRow(document, false));
        }
        if (document.cancelled &&
            document.cancelled_on &&
            inRange(document.cancelled_on, input.dateFrom, input.dateTo)) {
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
function filterSalesCostRows(rows, search) {
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
function summarizeSalesCostRows(rows) {
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
function salesLineMargin(input) {
    const price = roundSalesCost(input.sale_total - input.tax);
    const marginAmount = roundSalesCost(price - input.cost_total);
    return {
        margin_amount: marginAmount,
        margin_percent: price === 0 ? null : roundSalesCost((marginAmount / price) * 100),
    };
}
function orderRow(order, reversal) {
    const money = convertMoney(order.currency, order.exchange_rate);
    const amount = money(order.subtotal);
    const discount = money(order.discount);
    const tax = money(order.tax);
    const saleTotal = money(order.total);
    const cost = roundSalesCost(reversal
        ? -(order.reversal_cost > 0 ? order.reversal_cost : order.sale_cost)
        : order.sale_cost);
    const typeCode = reversal
        ? order.invoiced
            ? exports.SALES_COST_TYPE.CANCEL_INVOICE
            : exports.SALES_COST_TYPE.CANCEL_RECEIPT
        : order.invoiced
            ? exports.SALES_COST_TYPE.INVOICE
            : order.is_credit
                ? exports.SALES_COST_TYPE.CREDIT_RECEIPT
                : exports.SALES_COST_TYPE.RECEIPT;
    const statusCode = reversal ? exports.SALES_COST_STATUS.CANCELLED : saleStatus(order);
    const signedTax = reversal ? -tax : tax;
    const signedSale = reversal ? -saleTotal : saleTotal;
    return {
        id: reversal ? `${order.id}:cancel` : order.id,
        sales_order_id: order.id,
        customer_name: order.customer_name,
        document: order.folio,
        date: reversal ? order.cancelled_on || order.created_on : order.created_on,
        type_code: typeCode,
        type_label: exports.SALES_COST_TYPE_LABELS[typeCode],
        status_code: statusCode,
        status_label: exports.SALES_COST_STATUS_LABELS[statusCode],
        amount,
        discount,
        tax: signedTax,
        sale_total: signedSale,
        cost_total: cost,
        ...salesLineMargin({ sale_total: signedSale, tax: signedTax, cost_total: cost }),
        currency: money.currency,
        reversal,
    };
}
function sideRow(document, reversal) {
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
            ? exports.SALES_COST_TYPE.CANCEL_CREDIT_NOTE
            : exports.SALES_COST_TYPE.CREDIT_NOTE
        : exports.SALES_COST_TYPE.ADVANCE;
    const statusCode = reversal
        ? exports.SALES_COST_STATUS.CANCELLED
        : creditNote
            ? exports.SALES_COST_STATUS.RETURN
            : exports.SALES_COST_STATUS.CASH;
    return {
        id: reversal ? `${document.id}:cancel` : document.id,
        sales_order_id: document.sales_order_id,
        customer_name: document.customer_name,
        document: document.document,
        date: reversal ? document.cancelled_on || document.stamped_on : document.stamped_on,
        type_code: typeCode,
        type_label: exports.SALES_COST_TYPE_LABELS[typeCode],
        status_code: statusCode,
        status_label: exports.SALES_COST_STATUS_LABELS[statusCode],
        amount: signedAmount,
        discount: 0,
        tax: signedTax,
        sale_total: signedSale,
        cost_total: 0,
        ...salesLineMargin({ sale_total: signedSale, tax: signedTax, cost_total: 0 }),
        currency: money.currency,
        reversal,
    };
}
function saleStatus(order) {
    if (order.is_credit && order.payment_status !== 'Pagado') {
        return exports.SALES_COST_STATUS.CREDIT;
    }
    if (order.is_credit) {
        return exports.SALES_COST_STATUS.PAID;
    }
    return exports.SALES_COST_STATUS.CASH;
}
function convertMoney(currency, exchangeRate) {
    const code = (currency || 'MXN').trim().toUpperCase() || 'MXN';
    const rate = exchangeRate != null && exchangeRate > 0 ? exchangeRate : null;
    const reportCurrency = code === 'USD' && rate == null ? 'USD' : 'MXN';
    const convert = ((value) => {
        const amount = Number.isFinite(value) ? value : 0;
        if (code === 'USD' && rate != null) {
            return roundSalesCost(amount * rate);
        }
        return roundSalesCost(amount);
    });
    convert.currency = reportCurrency;
    return convert;
}
function inRange(day, from, to) {
    return !!day && day >= from && day <= to;
}
function sum(rows, key) {
    return roundSalesCost(rows.reduce((total, row) => total + row[key], 0));
}
function normalizeName(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}
//# sourceMappingURL=average-cost-report.util.js.map