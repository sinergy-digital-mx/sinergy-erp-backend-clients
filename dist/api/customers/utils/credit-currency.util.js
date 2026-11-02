"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCreditCurrency = normalizeCreditCurrency;
exports.roundCreditMoneyAmount = roundCreditMoneyAmount;
exports.amountInCreditCurrency = amountInCreditCurrency;
exports.creditConversionRate = creditConversionRate;
exports.creditRateDate = creditRateDate;
function normalizeCreditCurrency(value) {
    return value === 'USD' ? 'USD' : 'MXN';
}
function roundCreditMoneyAmount(value) {
    return Number((Number(value) || 0).toFixed(2));
}
function amountInCreditCurrency(input) {
    const amount = roundCreditMoneyAmount(Math.max(0, Number(input.amount) || 0));
    const orderCurrency = normalizeCreditCurrency(input.orderCurrency);
    const creditCurrency = normalizeCreditCurrency(input.creditCurrency);
    if (orderCurrency === creditCurrency) {
        return { amount, error: null };
    }
    const rate = Number(input.exchangeRate);
    if (!(rate > 0)) {
        return {
            amount: null,
            error: 'No hay tipo de cambio para convertir el crédito de la orden',
        };
    }
    if (orderCurrency === 'USD') {
        return { amount: roundCreditMoneyAmount(amount * rate), error: null };
    }
    return { amount: roundCreditMoneyAmount(amount / rate), error: null };
}
function creditConversionRate(input) {
    const orderCurrency = normalizeCreditCurrency(input.orderCurrency);
    const creditCurrency = normalizeCreditCurrency(input.creditCurrency);
    const orderRate = Number(input.orderExchangeRate);
    const dailyRate = Number(input.dailyExchangeRate);
    if (orderCurrency === creditCurrency) {
        return orderRate > 0 ? orderRate : null;
    }
    if (orderRate > 0) {
        return orderRate;
    }
    if (dailyRate > 0) {
        return dailyRate;
    }
    return null;
}
function creditRateDate(value) {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Tijuana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}
//# sourceMappingURL=credit-currency.util.js.map