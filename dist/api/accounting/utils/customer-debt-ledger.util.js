"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundDebtMoney = roundDebtMoney;
exports.clampDebtMoney = clampDebtMoney;
exports.isWalkInDebtCustomer = isWalkInDebtCustomer;
exports.customerDebtDisplayName = customerDebtDisplayName;
exports.billingBranchLabel = billingBranchLabel;
exports.debtDueDate = debtDueDate;
exports.calendarDaysPastDue = calendarDaysPastDue;
exports.debtAgingBucket = debtAgingBucket;
exports.debtPaymentMethodLabel = debtPaymentMethodLabel;
exports.debtMovementLabel = debtMovementLabel;
exports.debtMovementDescription = debtMovementDescription;
exports.formatDebtDay = formatDebtDay;
exports.formatDebtDateTime = formatDebtDateTime;
exports.applyDebtLedgerBalances = applyDebtLedgerBalances;
exports.chargeSourceKey = chargeSourceKey;
exports.paymentSourceKey = paymentSourceKey;
exports.chargeReversalSourceKey = chargeReversalSourceKey;
exports.paymentReversalSourceKey = paymentReversalSourceKey;
exports.creditNoteSourceKey = creditNoteSourceKey;
exports.creditNoteReversalSourceKey = creditNoteReversalSourceKey;
exports.advanceCoveredAmount = advanceCoveredAmount;
exports.isAdvanceDebtMovement = isAdvanceDebtMovement;
exports.stripAdvanceFromDebtMovements = stripAdvanceFromDebtMovements;
const customer_debt_ledger_movement_type_enum_1 = require("../../../entities/accounting/customer-debt-ledger-movement-type.enum");
const sales_order_payment_display_util_1 = require("../../sales-orders/utils/sales-order-payment-display.util");
const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';
const MOVEMENT_RANK = {
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE]: 0,
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT]: 1,
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE_REVERSAL]: 2,
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT_REVERSAL]: 3,
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE]: 4,
    [customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL]: 5,
};
function roundDebtMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function clampDebtMoney(value) {
    return roundDebtMoney(Math.max(0, value));
}
function isWalkInDebtCustomer(customer) {
    return (customer.fiscal_razon_social === WALK_IN_FISCAL_NAME ||
        customer.name === WALK_IN_DISPLAY_NAME);
}
function customerDebtDisplayName(customer) {
    const fiscal = customer.fiscal_razon_social?.trim();
    if (fiscal)
        return fiscal;
    const company = customer.company_name?.trim();
    if (company)
        return company;
    const person = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
    return person || 'Sin nombre';
}
function billingBranchLabel(city, code) {
    const cityLabel = city?.trim();
    const codeLabel = code?.trim();
    if (cityLabel && codeLabel)
        return `${cityLabel} (${codeLabel})`;
    return cityLabel || codeLabel || null;
}
function debtDueDate(occurredAt, creditDays) {
    const days = Math.max(0, Number(creditDays ?? 0));
    const due = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate());
    due.setDate(due.getDate() + days);
    const month = String(due.getMonth() + 1).padStart(2, '0');
    const day = String(due.getDate()).padStart(2, '0');
    return `${due.getFullYear()}-${month}-${day}`;
}
function calendarDaysPastDue(dueDate, asOf) {
    const [year, month, day] = dueDate.slice(0, 10).split('-').map(Number);
    const dueUtc = Date.UTC(year, (month || 1) - 1, day || 1);
    const asOfUtc = Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
    return Math.round((asOfUtc - dueUtc) / 86_400_000);
}
function debtAgingBucket(dueDate, asOf) {
    if (!dueDate)
        return 'current';
    const days = calendarDaysPastDue(dueDate, asOf);
    if (days <= 0)
        return 'current';
    if (days <= 30)
        return 'd1_30';
    if (days <= 60)
        return 'd31_60';
    if (days <= 90)
        return 'd61_90';
    return 'd91_plus';
}
function debtPaymentMethodLabel(method) {
    if (!method)
        return null;
    const known = sales_order_payment_display_util_1.SALES_ORDER_PAYMENT_METHOD_LABELS[method];
    return known ?? method;
}
function debtMovementLabel(type) {
    switch (type) {
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE:
            return 'Cargo';
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT:
            return 'Abono';
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE_REVERSAL:
            return 'Cancelación';
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT_REVERSAL:
            return 'Reversa de abono';
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE:
            return 'Nota de crédito';
        case customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL:
            return 'Reversa de nota de crédito';
        default:
            return 'Saldo inicial';
    }
}
function debtMovementDescription(input) {
    const folio = input.folio?.trim() || 'la orden';
    if (input.movementType === 'opening') {
        return `Saldo de ${folio} al inicio del periodo.`;
    }
    if (input.movementType === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE) {
        const due = input.dueDate ? ` Vence ${formatDebtDay(input.dueDate)}.` : '';
        return `Cargo de ${folio}.${due}`;
    }
    if (input.movementType === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT) {
        const method = debtPaymentMethodLabel(input.paymentMethod);
        const ref = input.referenceNumber?.trim();
        const extra = [method, ref ? `ref. ${ref}` : null].filter(Boolean).join(', ');
        return extra ? `Abono a ${folio} (${extra}).` : `Abono a ${folio}.`;
    }
    if (input.movementType === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE_REVERSAL) {
        return `Se canceló el saldo pendiente de ${folio}.`;
    }
    if (input.movementType === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE) {
        return `Nota de crédito sobre ${folio}.`;
    }
    if (input.movementType === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CREDIT_NOTE_REVERSAL) {
        return `Se canceló la nota de crédito de ${folio}.`;
    }
    return `Se revirtió un abono de ${folio}.`;
}
function formatDebtDay(value) {
    const [year, month, day] = value.slice(0, 10).split('-');
    if (!year || !month || !day)
        return value;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const label = months[Number(month) - 1];
    if (!label)
        return `${day}/${month}/${year}`;
    return `${Number(day)} ${label} ${year}`;
}
function formatDebtDateTime(value) {
    if (!value)
        return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return '';
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: MEXICO_TIME_ZONE,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value ?? '';
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[Number(pick('month')) - 1] ?? pick('month');
    const minute = pick('minute').padStart(2, '0');
    const dayPeriod = pick('dayPeriod').toLowerCase().replace(/\./g, '').replace('am', 'a.m.').replace('pm', 'p.m.');
    return `${Number(pick('day'))} ${month} ${pick('year')}, ${Number(pick('hour'))}:${minute} ${dayPeriod}`;
}
const MEXICO_TIME_ZONE = 'America/Tijuana';
function applyDebtLedgerBalances(drafts) {
    const groups = new Map();
    for (const draft of drafts) {
        const key = `${draft.tenantId}|${draft.customerId}|${draft.fiscalConfigurationId}`;
        const list = groups.get(key) ?? [];
        list.push(draft);
        groups.set(key, list);
    }
    const balanced = [];
    for (const list of groups.values()) {
        list.sort((a, b) => {
            const time = a.occurredAt.getTime() - b.occurredAt.getTime();
            if (time !== 0)
                return time;
            const rank = MOVEMENT_RANK[a.movementType] - MOVEMENT_RANK[b.movementType];
            if (rank !== 0)
                return rank;
            return a.sourceKey.localeCompare(b.sourceKey);
        });
        let customerBalance = 0;
        const orderBalances = new Map();
        for (const draft of list) {
            const prevOrder = orderBalances.get(draft.salesOrderId) ?? 0;
            customerBalance = clampDebtMoney(customerBalance + Number(draft.amountDelta));
            const orderBalance = clampDebtMoney(prevOrder + Number(draft.amountDelta));
            orderBalances.set(draft.salesOrderId, orderBalance);
            balanced.push({
                ...draft,
                balanceAfter: customerBalance,
                orderBalanceAfter: orderBalance,
            });
        }
    }
    return balanced;
}
function chargeSourceKey(salesOrderId) {
    return `charge:${salesOrderId}`;
}
function paymentSourceKey(paymentId) {
    return `payment:${paymentId}`;
}
function chargeReversalSourceKey(salesOrderId) {
    return `charge_reversal:${salesOrderId}`;
}
function paymentReversalSourceKey(paymentId) {
    return `payment_reversal:${paymentId}`;
}
function creditNoteSourceKey(invoiceId) {
    return `credit_note:${invoiceId}`;
}
function creditNoteReversalSourceKey(invoiceId) {
    return `credit_note_reversal:${invoiceId}`;
}
function advanceCoveredAmount(input) {
    const paid = roundDebtMoney(Number(input.advance_paid || 0));
    const requested = roundDebtMoney(Number(input.advance_requested || 0));
    const invoiced = roundDebtMoney(Number(input.advance_invoiced || 0));
    const asked = requested > 0.009 ? requested : paid > 0.009 ? paid : invoiced;
    return roundDebtMoney(Math.max(asked, paid));
}
function isAdvanceDebtMovement(source, paymentSource) {
    return isAdvanceSource(source) || isAdvanceSource(paymentSource);
}
function isAdvanceSource(value) {
    return String(value ?? '').trim().toLowerCase() === 'advance';
}
function stripAdvanceFromDebtMovements(rows) {
    const groups = new Map();
    for (const row of rows) {
        const list = groups.get(row.sales_order_id) ?? [];
        list.push(row);
        groups.set(row.sales_order_id, list);
    }
    const result = [];
    for (const list of groups.values()) {
        result.push(...stripAdvanceFromOrder(list));
    }
    return result;
}
function stripAdvanceFromOrder(rows) {
    const sample = rows[0];
    const dropped = droppedAdvanceAmount(rows);
    const covered = roundDebtMoney(Math.max(advanceCoveredAmount(sample ?? {}), dropped));
    const totalKnown = sample?.order_total != null && sample.order_total !== '';
    const chargeLimit = totalKnown
        ? roundDebtMoney(Math.max(roundDebtMoney(Number(sample?.order_total || 0)) - covered, 0))
        : null;
    const kept = [];
    let balance = 0;
    for (const row of rows) {
        if (isAdvanceDebtMovement(row.source, row.payment_source))
            continue;
        let delta = roundDebtMoney(Number(row.amount_delta || 0));
        if (row.movement_type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE) {
            const next = chargeLimit == null
                ? roundDebtMoney(Math.max(delta - covered, 0))
                : roundDebtMoney(Math.min(Math.max(delta, 0), chargeLimit));
            if (next <= 0.009)
                continue;
            delta = next;
        }
        else if (row.movement_type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.CHARGE_REVERSAL) {
            if (balance <= 0.009)
                continue;
            delta = roundDebtMoney(-balance);
        }
        balance = clampDebtMoney(balance + delta);
        kept.push({ ...row, amount_delta: delta, order_balance_after: balance });
    }
    return kept;
}
function droppedAdvanceAmount(rows) {
    let net = 0;
    for (const row of rows) {
        if (!isAdvanceDebtMovement(row.source, row.payment_source))
            continue;
        const amount = Math.abs(roundDebtMoney(Number(row.amount_delta || 0)));
        if (row.movement_type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT)
            net += amount;
        if (row.movement_type === customer_debt_ledger_movement_type_enum_1.CustomerDebtLedgerMovementType.PAYMENT_REVERSAL)
            net -= amount;
    }
    return roundDebtMoney(Math.max(net, 0));
}
//# sourceMappingURL=customer-debt-ledger.util.js.map