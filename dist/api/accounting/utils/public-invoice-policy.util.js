"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEXICO_TIME_ZONE_IDS = exports.MEXICO_TIME_ZONES = exports.DEFAULT_PUBLIC_INVOICE_TIME_ZONE = void 0;
exports.isMexicoTimeZone = isMexicoTimeZone;
exports.mexicoTimeZoneLabel = mexicoTimeZoneLabel;
exports.readPublicInvoicePolicy = readPublicInvoicePolicy;
exports.toPublicInvoicePolicyView = toPublicInvoicePolicyView;
exports.resolvePublicInvoiceSettings = resolvePublicInvoiceSettings;
exports.currentMonthInTimeZone = currentMonthInTimeZone;
exports.automaticRunPeriod = automaticRunPeriod;
exports.isOrderMonthClosed = isOrderMonthClosed;
exports.assertOrderMonthStillOpen = assertOrderMonthStillOpen;
exports.orderMonthClosedMessage = orderMonthClosedMessage;
exports.lastDayOfMonth = lastDayOfMonth;
exports.zonedParts = zonedParts;
exports.zonedTimeToUtc = zonedTimeToUtc;
const common_1 = require("@nestjs/common");
const fiscal_tax_policy_util_1 = require("../../billing/utils/fiscal-tax-policy.util");
exports.DEFAULT_PUBLIC_INVOICE_TIME_ZONE = 'America/Tijuana';
exports.MEXICO_TIME_ZONES = [
    { id: 'America/Tijuana', label: 'Tijuana' },
    { id: 'America/Hermosillo', label: 'Hermosillo' },
    { id: 'America/Mazatlan', label: 'Mazatlán' },
    { id: 'America/Chihuahua', label: 'Chihuahua' },
    { id: 'America/Mexico_City', label: 'Ciudad de México' },
    { id: 'America/Monterrey', label: 'Monterrey' },
    { id: 'America/Matamoros', label: 'Matamoros' },
    { id: 'America/Ojinaga', label: 'Ojinaga' },
    { id: 'America/Bahia_Banderas', label: 'Bahía de Banderas' },
    { id: 'America/Merida', label: 'Mérida' },
    { id: 'America/Cancun', label: 'Cancún' },
];
exports.MEXICO_TIME_ZONE_IDS = exports.MEXICO_TIME_ZONES.map((zone) => zone.id);
function isMexicoTimeZone(value) {
    return exports.MEXICO_TIME_ZONE_IDS.includes(value);
}
function mexicoTimeZoneLabel(timeZone) {
    return exports.MEXICO_TIME_ZONES.find((zone) => zone.id === timeZone)?.label ?? timeZone;
}
function readPublicInvoicePolicy(row) {
    const rawZone = typeof row?.global_invoice_timezone === 'string' ? row.global_invoice_timezone : '';
    const hour = normalizeHour(row?.global_invoice_hour);
    return {
        autoEnabled: (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(row?.global_invoice_auto_enabled, false),
        blockAfterMonth: (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(row?.global_invoice_block_after_month, false),
        hour,
        timeZone: isMexicoTimeZone(rawZone) ? rawZone : exports.DEFAULT_PUBLIC_INVOICE_TIME_ZONE,
    };
}
function toPublicInvoicePolicyView(row, now = new Date()) {
    const policy = readPublicInvoicePolicy(row);
    return {
        auto_enabled: policy.autoEnabled,
        block_after_month: policy.blockAfterMonth,
        hour: policy.hour,
        timezone: policy.timeZone,
        timezone_label: mexicoTimeZoneLabel(policy.timeZone),
        calendar_month: currentMonthInTimeZone(policy.timeZone, now),
    };
}
function resolvePublicInvoiceSettings(input, current) {
    const auto = input.global_invoice_auto_enabled ??
        (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(current?.global_invoice_auto_enabled, false);
    const block = input.global_invoice_block_after_month ??
        (0, fiscal_tax_policy_util_1.isFiscalFlagOn)(current?.global_invoice_block_after_month, false);
    let hour = input.global_invoice_hour !== undefined
        ? input.global_invoice_hour
        : normalizeHour(current?.global_invoice_hour);
    let timeZone = input.global_invoice_timezone !== undefined
        ? input.global_invoice_timezone
        : typeof current?.global_invoice_timezone === 'string'
            ? current.global_invoice_timezone
            : null;
    if (hour != null && !Number.isInteger(hour)) {
        throw new common_1.BadRequestException('La hora del cierre tiene que ser una hora en punto, del 0 al 23');
    }
    if (hour != null && (hour < 0 || hour > 23)) {
        throw new common_1.BadRequestException('La hora del cierre tiene que estar entre 0 y 23');
    }
    if (timeZone != null && timeZone !== '' && !isMexicoTimeZone(timeZone)) {
        throw new common_1.BadRequestException('Elige una zona horaria de México');
    }
    if (timeZone === '')
        timeZone = null;
    if (auto || block) {
        if (hour == null)
            hour = 9;
        if (!timeZone)
            timeZone = exports.DEFAULT_PUBLIC_INVOICE_TIME_ZONE;
    }
    return {
        global_invoice_auto_enabled: auto,
        global_invoice_block_after_month: block,
        global_invoice_hour: hour,
        global_invoice_timezone: timeZone,
    };
}
function currentMonthInTimeZone(timeZone, now = new Date()) {
    const local = zonedParts(now, timeZone);
    return `${local.year}-${String(local.month).padStart(2, '0')}`;
}
function automaticRunPeriod(policy, now = new Date()) {
    if (!policy.autoEnabled || policy.hour == null)
        return null;
    const local = zonedParts(now, policy.timeZone);
    if (local.day !== lastDayOfMonth(local.year, local.month))
        return null;
    if (local.hour < policy.hour)
        return null;
    return { year: local.year, month: local.month };
}
function isOrderMonthClosed(createdAt, policy, now = new Date()) {
    if (!policy.blockAfterMonth || policy.hour == null)
        return false;
    const created = coerceDate(createdAt);
    if (!created)
        return false;
    const local = zonedParts(created, policy.timeZone);
    const cutoff = zonedTimeToUtc(local.year, local.month, lastDayOfMonth(local.year, local.month), policy.hour, 0, policy.timeZone);
    return now.getTime() >= cutoff.getTime();
}
function assertOrderMonthStillOpen(createdAt, fiscal, now = new Date()) {
    const policy = readPublicInvoicePolicy(fiscal);
    if (!isOrderMonthClosed(createdAt, policy, now))
        return;
    throw new common_1.BadRequestException(orderMonthClosedMessage(createdAt, policy));
}
function orderMonthClosedMessage(createdAt, policy) {
    const created = coerceDate(createdAt);
    const local = created ? zonedParts(created, policy.timeZone) : null;
    const month = local == null
        ? 'ese mes'
        : new Intl.DateTimeFormat('es-MX', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        }).format(new Date(Date.UTC(local.year, local.month - 1, 1)));
    const hour = `${String(policy.hour ?? 0).padStart(2, '0')}:00`;
    return (`Esta orden es de ${month}. ` +
        `La razón social no permite facturarla por separado después del último día de ese mes a las ${hour} ` +
        `(${mexicoTimeZoneLabel(policy.timeZone)}).`);
}
function lastDayOfMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const read = (type) => Number(parts.find((part) => part.type === type)?.value);
    let hour = read('hour');
    if (hour === 24)
        hour = 0;
    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
        hour,
        minute: read('minute'),
    };
}
function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
    let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const local = zonedParts(utc, timeZone);
        const shown = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
        const wanted = Date.UTC(year, month - 1, day, hour, minute);
        utc = new Date(utc.getTime() + (wanted - shown));
    }
    return utc;
}
function normalizeHour(value) {
    if (value == null || value === '')
        return null;
    const hour = Number(value);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23)
        return null;
    return hour;
}
function coerceDate(value) {
    if (value == null || value === '')
        return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
//# sourceMappingURL=public-invoice-policy.util.js.map