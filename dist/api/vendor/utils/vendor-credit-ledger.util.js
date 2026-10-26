"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundVendorCreditMoney = roundVendorCreditMoney;
exports.normalizeVendorCreditCurrency = normalizeVendorCreditCurrency;
exports.splitVendorPayment = splitVendorPayment;
exports.vendorCreditSignedAmount = vendorCreditSignedAmount;
exports.vendorCreditBalances = vendorCreditBalances;
exports.vendorCreditNet = vendorCreditNet;
exports.withRunningVendorCreditBalance = withRunningVendorCreditBalance;
const vendor_credit_ledger_entry_type_enum_1 = require("../../../entities/vendor/vendor-credit-ledger-entry-type.enum");
function roundVendorCreditMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function normalizeVendorCreditCurrency(value) {
    return String(value ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}
function splitVendorPayment(amount, pending) {
    const pay = roundVendorCreditMoney(amount);
    const due = Math.max(0, roundVendorCreditMoney(pending));
    const applied = Math.min(pay, due);
    return {
        applied,
        credit: roundVendorCreditMoney(Math.max(0, pay - applied)),
    };
}
function vendorCreditSignedAmount(type, amount) {
    const value = roundVendorCreditMoney(amount);
    return type === vendor_credit_ledger_entry_type_enum_1.VendorCreditLedgerEntryType.CREDIT ? value : -value;
}
function vendorCreditBalances(entries) {
    let mxn = 0;
    let usd = 0;
    for (const entry of entries) {
        const delta = vendorCreditSignedAmount(entry.entry_type, Number(entry.amount || 0));
        if (normalizeVendorCreditCurrency(entry.currency) === 'USD') {
            usd += delta;
        }
        else {
            mxn += delta;
        }
    }
    return {
        mxn: roundVendorCreditMoney(mxn),
        usd: roundVendorCreditMoney(usd),
    };
}
function vendorCreditNet(pending, credit) {
    return roundVendorCreditMoney(roundVendorCreditMoney(pending) - roundVendorCreditMoney(credit));
}
function withRunningVendorCreditBalance(entries) {
    const running = { MXN: 0, USD: 0 };
    return entries.map((entry) => {
        const currency = normalizeVendorCreditCurrency(entry.currency);
        running[currency] = roundVendorCreditMoney(running[currency] + vendorCreditSignedAmount(entry.entry_type, Number(entry.amount || 0)));
        return { ...entry, balance_after: running[currency] };
    });
}
//# sourceMappingURL=vendor-credit-ledger.util.js.map