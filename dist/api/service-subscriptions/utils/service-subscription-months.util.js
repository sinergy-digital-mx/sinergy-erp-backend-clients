"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMonthStart = normalizeMonthStart;
exports.listPeriodMonths = listPeriodMonths;
exports.addMonths = addMonths;
exports.formatPeriodLabel = formatPeriodLabel;
exports.billingDate = billingDate;
exports.todayInTimeZone = todayInTimeZone;
exports.isCurrentMonth = isCurrentMonth;
const common_1 = require("@nestjs/common");
const service_subscription_constants_1 = require("../service-subscription.constants");
const MONTH_LABELS = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
];
function normalizeMonthStart(value) {
    const match = /^(\d{4})-(\d{2})/.exec(String(value ?? '').trim());
    if (!match) {
        throw new common_1.BadRequestException('Indica el mes con formato AAAA-MM');
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
        throw new common_1.BadRequestException('El mes no es válido');
    }
    return `${match[1]}-${match[2]}-01`;
}
function listPeriodMonths(start, end) {
    const from = normalizeMonthStart(start);
    const to = normalizeMonthStart(end);
    if (to < from) {
        throw new common_1.BadRequestException('El mes final no puede ser anterior al inicial');
    }
    const months = [];
    let cursor = from;
    while (cursor <= to) {
        months.push(cursor);
        if (months.length > service_subscription_constants_1.MAX_SUBSCRIPTION_MONTHS) {
            throw new common_1.BadRequestException(`La suscripción cubre como máximo ${service_subscription_constants_1.MAX_SUBSCRIPTION_MONTHS} meses`);
        }
        cursor = addMonths(cursor, 1);
    }
    return months;
}
function addMonths(monthStart, count) {
    const [yearText, monthText] = normalizeMonthStart(monthStart).split('-');
    const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + count, 1));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}
function formatPeriodLabel(monthStart) {
    const normalized = normalizeMonthStart(monthStart);
    const month = Number(normalized.slice(5, 7));
    const year = normalized.slice(0, 4);
    return `${MONTH_LABELS[month - 1]} ${year}`;
}
function billingDate(monthStart, billingDay) {
    const day = Math.min(Math.max(Math.trunc(billingDay) || 1, 1), 28);
    return `${normalizeMonthStart(monthStart).slice(0, 8)}${String(day).padStart(2, '0')}`;
}
function todayInTimeZone(timeZone = 'America/Tijuana', now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, isoDate };
}
function isCurrentMonth(monthStart, today = todayInTimeZone()) {
    return normalizeMonthStart(monthStart).slice(0, 7) === today.isoDate.slice(0, 7);
}
//# sourceMappingURL=service-subscription-months.util.js.map